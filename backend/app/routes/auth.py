import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, StudentProfile, EntityVerification, AuditLog
from ..services.otp_service import (
    generate_and_store_otp,
    verify_otp_code,
    issue_refresh_token,
    rotate_refresh_token,
    revoke_all_user_refresh_tokens,
    is_email_provider_configured,
    is_phone_provider_configured,
    validate_e164_phone,
)
from ..utils.auth_utils import (
    create_access_token,
    get_current_user,
    decode_token_payload,
    require_role,
)

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 5 Canonical roles per the SARATHI master spec:
# 1. student
# 2. employer
# 3. training_institute
# 4. trainer
# 5. government_admin
CANONICAL_ROLES = {
    "student",
    "employer",
    "training_institute",
    "trainer",
    "government_admin",
}

ROLE_ALIASES = {
    "admin": "government_admin",
    "government": "government_admin",
}

# Public self-registration is strictly allowed ONLY for these 4 roles.
# Government Admin accounts MUST NOT be self-registered publicly.
PUBLIC_REGISTRATION_ROLES = {
    "student",
    "employer",
    "training_institute",
    "trainer",
}


def log_auth_audit(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    details: str = "",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Safely logs authentication events into the audit_logs table."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-blocking failure for audit logging


# ============================================================
# SCHEMAS
# ============================================================

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str
    remember_me: Optional[bool] = False
    role: Optional[str] = None
    account_type: Optional[str] = None


class RegisterRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    email: EmailStr
    password: str
    role: str = "student"
    phone: Optional[str] = None
    country: Optional[str] = "India"


class SendEmailOtpRequest(BaseModel):
    email: EmailStr
    purpose: str = "email_verification"  # email_verification or password_reset


class VerifyEmailOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "email_verification"


class SendPhoneOtpRequest(BaseModel):
    phone: str
    channel: str = "sms"  # sms or whatsapp
    purpose: str = "phone_verification"


class VerifyPhoneOtpRequest(BaseModel):
    phone: str
    otp: str
    purpose: str = "phone_verification"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============================================================
# 1. REGISTER (Strict Public Role Check + PENDING_VERIFICATION)
# ============================================================

@router.post("/register")
def register(
    request: RegisterRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    role_norm = ROLE_ALIASES.get(request.role.strip().lower(), request.role.strip().lower())

    # Security check: Prohibit public self-registration of government_admin
    if role_norm == "government_admin" or role_norm in ("admin", "government"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Government Administrator accounts are provisioned exclusively by central authority. "
                "Public self-registration is disabled for this role."
            ),
        )

    if role_norm not in PUBLIC_REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Public registration allows: {sorted(PUBLIC_REGISTRATION_ROLES)}",
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long",
        )

    # Validate E.164 phone if provided
    phone_clean = None
    if request.phone and request.phone.strip():
        phone_clean = validate_e164_phone(request.phone)

    existing = db.query(User).filter(func.lower(func.trim(User.email)) == request.email.lower().strip()).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_display_name = (request.name or request.full_name or request.email.split("@")[0]).strip()

    # Rule: For local/offline environments or when SMTP provider is unconfigured,
    # auto-verify user so registration and login work smoothly end-to-end.
    # In production, require actual verification workflows.
    app_env = os.getenv("APP_ENV", "development").lower()
    is_student = (role_norm == "student")
    if app_env == "production":
        auto_activate = False
    else:
        auto_activate = not is_email_provider_configured() or is_student

    user = User(
        name=user_display_name,
        email=request.email.lower(),
        phone=phone_clean,
        country=request.country or "India",
        hashed_password=pwd_context.hash(request.password),
        role=role_norm,
        email_verified=True if auto_activate else False,
        phone_verified=True if auto_activate else False,
        organization_verified=True if (is_student or auto_activate) else False,
        account_status="ACTIVE" if auto_activate else "PENDING_VERIFICATION",
        failed_login_attempts=0,
        locked_until=None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize role-specific profile records
    if is_student:
        student_prof = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        if not student_prof:
            student_prof = StudentProfile(
                user_id=user.id,
                full_name=user_display_name,
                phone=phone_clean,
                profile_completed=False,
                onboarding_completed=False,
                skill_score=0.0,
                industry_readiness=0.0,
            )
            db.add(student_prof)
            db.commit()

    # Automatically submit initial entity verification entry for institutional roles
    if role_norm in ("employer", "training_institute", "trainer"):
        entity_v = EntityVerification(
            user_id=user.id,
            entity_type=role_norm,
            entity_name=user_display_name,
            document_type="Registration Certificate",
            document_id=f"SARATHI-REG-{user.id:04d}",
            status="VERIFIED" if auto_activate else "PENDING",
            submitted_at=datetime.utcnow(),
        )
        db.add(entity_v)
        db.commit()

    # Log to audit_logs
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")
    log_auth_audit(
        db,
        action="USER_REGISTERED",
        user_id=user.id,
        details=f"Public registration for {role_norm} ({user.email})",
        ip_address=ip,
        user_agent=agent,
    )

    msg = (
        "Registration successful! You may now sign in with your email and password."
        if auto_activate
        else (
            "Registration submitted successfully. Your account is in PENDING_VERIFICATION status. "
            "Please verify your email and phone number before signing in."
        )
    )

    return {
        "success": True,
        "message": msg,
        "data": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "account_status": user.account_status,
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "organization_verified": user.organization_verified,
        },
    }


# ============================================================
# 2. LOGIN (Strict Verification Checks + Lockout Prevention)
# ============================================================

@router.post("/login")
def login(
    request: LoginRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")
    login_email = (request.email or request.username or "").lower().strip()

    if not login_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

    user = db.query(User).filter(func.lower(func.trim(User.email)) == login_email).first()

    # Check brute-force lockout
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        wait_minutes = max(1, int((user.locked_until - datetime.utcnow()).total_seconds() / 60))
        log_auth_audit(
            db,
            action="LOGIN_BLOCKED",
            user_id=user.id,
            details=f"Account locked until {user.locked_until}",
            ip_address=ip,
            user_agent=agent,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to multiple failed login attempts. Please try again later.",
        )

    # Credential verification
    if user is None or not pwd_context.verify(request.password, user.hashed_password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                log_auth_audit(
                    db,
                    action="ACCOUNT_LOCKED",
                    user_id=user.id,
                    details="Locked account for 15 minutes due to 5 consecutive failed login attempts",
                    ip_address=ip,
                    user_agent=agent,
                )
            db.commit()

        log_auth_audit(
            db,
            action="LOGIN_FAILED",
            user_id=user.id if user else None,
            details=f"Failed login attempt for {login_email}",
            ip_address=ip,
            user_agent=agent,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Account Active check
    if not user.is_active:
        log_auth_audit(
            db,
            action="LOGIN_BLOCKED",
            user_id=user.id,
            details="Account is inactive/deactivated",
            ip_address=ip,
            user_agent=agent,
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")

    # Normalize user's role if stored as legacy admin or government
    canonical_role = ROLE_ALIASES.get(user.role, user.role)
    if user.role != canonical_role:
        user.role = canonical_role
        db.commit()

    # Enforce strict role matching and credential isolation
    selected_role_raw = (request.role or request.account_type or "").strip().lower()
    if selected_role_raw:
        selected_role = ROLE_ALIASES.get(selected_role_raw, selected_role_raw)

        # 1. Government / Administration Account Isolation
        if selected_role == "government_admin":
            if user.role != "government_admin":
                log_auth_audit(
                    db,
                    action="LOGIN_ROLE_MISMATCH",
                    user_id=user.id,
                    details=f"User {user.email} (role: {user.role}) attempted Government / Administration login",
                    ip_address=ip,
                    user_agent=agent,
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Selected account type is Government / Administration, but this email does not belong to an authorized Government Administrator.",
                )

        # 2. Standard Public Login Isolation (Government credentials cannot login under public roles)
        elif selected_role in PUBLIC_REGISTRATION_ROLES:
            if user.role == "government_admin":
                log_auth_audit(
                    db,
                    action="LOGIN_ROLE_MISMATCH",
                    user_id=user.id,
                    details="Government Administrator attempted standard public user login",
                    ip_address=ip,
                    user_agent=agent,
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Government Administrator credentials cannot be used for standard user login. Please select Government / Administration.",
                )

    # Rule: Verification enforcement on login
    # 1. Suspended
    if user.account_status == "SUSPENDED":
        log_auth_audit(db, "LOGIN_BLOCKED", user.id, "Account suspended", ip, agent)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended. Please contact support.",
        )

    # 2. Rejected
    if user.account_status == "REJECTED":
        reason = user.rejection_reason or "Registration criteria not met."
        log_auth_audit(db, "LOGIN_BLOCKED", user.id, f"Rejected: {reason}", ip, agent)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your verification request was rejected. Reason: {reason}",
        )

    # 3. Pending Verification
    if user.account_status == "PENDING_VERIFICATION":
        if not user.email_verified:
            log_auth_audit(db, "LOGIN_BLOCKED", user.id, "Email not verified", ip, agent)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before login.",
            )
        if not user.phone_verified:
            log_auth_audit(db, "LOGIN_BLOCKED", user.id, "Phone not verified", ip, agent)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your phone before login.",
            )
        if user.role in ("employer", "training_institute", "trainer") and not user.organization_verified:
            log_auth_audit(db, "LOGIN_BLOCKED", user.id, "Organization verification pending", ip, agent)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your registration is not yet verified.",
            )

        # If all prerequisites are satisfied, promote to ACTIVE
        user.account_status = "ACTIVE"
        db.commit()

    # Successful login: reset failed counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    refresh_token = issue_refresh_token(db, user.id)

    log_auth_audit(
        db,
        action="LOGIN_SUCCESS",
        user_id=user.id,
        details=f"Successful login for {user.role}",
        ip_address=ip,
        user_agent=agent,
    )

    profile_completed = True
    onboarding_completed = True
    if user.role == "student":
        sp = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        profile_completed = bool(sp.profile_completed) if sp else False
        onboarding_completed = bool(sp.onboarding_completed) if sp else False

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "phone": user.phone,
                "account_status": user.account_status,
                "email_verified": user.email_verified,
                "phone_verified": user.phone_verified,
                "organization_verified": user.organization_verified,
                "profile_completed": profile_completed,
                "onboarding_completed": onboarding_completed,
            },
        },
    }


# ============================================================
# 3. EMAIL OTP DISPATCH & VERIFY
# ============================================================

@router.post("/send-email-otp")
def send_email_otp(
    request: SendEmailOtpRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    result = generate_and_store_otp(
        db=db,
        recipient=request.email,
        purpose=request.purpose,
        channel="email",
    )

    log_auth_audit(
        db,
        action="EMAIL_OTP_DISPATCHED",
        details=f"OTP dispatched to {request.email} for {request.purpose}",
        ip_address=ip,
        user_agent=agent,
    )
    return result


@router.post("/verify-email-otp")
def verify_email_otp(
    request: VerifyEmailOtpRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    verify_otp_code(db, request.email, request.purpose, request.otp)

    user = db.query(User).filter(User.email == request.email.lower()).first()
    if user:
        user.email_verified = True
        # Check if user now qualifies for active status
        if user.phone_verified and (user.role == "student" or user.organization_verified):
            user.account_status = "ACTIVE"
        db.commit()

    log_auth_audit(
        db,
        action="EMAIL_OTP_VERIFIED",
        user_id=user.id if user else None,
        details=f"Email OTP successfully verified for {request.email}",
        ip_address=ip,
        user_agent=agent,
    )

    return {
        "success": True,
        "message": "Email address verified successfully.",
        "verified_email": request.email,
        "email_verified": True,
        "account_status": user.account_status if user else "PENDING_VERIFICATION",
    }


# ============================================================
# 4. PHONE OTP DISPATCH & VERIFY (SMS / WHATSAPP)
# ============================================================

@router.post("/send-phone-otp")
def send_phone_otp(
    request: SendPhoneOtpRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    result = generate_and_store_otp(
        db=db,
        recipient=request.phone,
        purpose=request.purpose,
        channel=request.channel or "sms",
    )

    log_auth_audit(
        db,
        action="PHONE_OTP_DISPATCHED",
        details=f"Phone OTP dispatched to {request.phone} via {request.channel}",
        ip_address=ip,
        user_agent=agent,
    )
    return result


@router.post("/verify-phone-otp")
def verify_phone_otp(
    request: VerifyPhoneOtpRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    phone_clean = validate_e164_phone(request.phone)
    verify_otp_code(db, phone_clean, request.purpose, request.otp)

    user = db.query(User).filter(User.phone == phone_clean).first()
    if user:
        user.phone_verified = True
        # Check if user qualifies for activation
        if user.email_verified and (user.role == "student" or user.organization_verified):
            user.account_status = "ACTIVE"
        db.commit()

    log_auth_audit(
        db,
        action="PHONE_OTP_VERIFIED",
        user_id=user.id if user else None,
        details=f"Phone OTP verified for {phone_clean}",
        ip_address=ip,
        user_agent=agent,
    )

    return {
        "success": True,
        "message": "Phone number verified successfully.",
        "verified_phone": phone_clean,
        "phone_verified": True,
        "account_status": user.account_status if user else "PENDING_VERIFICATION",
    }


# ============================================================
# 5. VERIFICATION STATUS CHECK
# ============================================================

@router.get("/verification-status")
def get_verification_status(
    email: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_token_payload(token)
        if payload and "sub" in payload:
            try:
                user = db.query(User).filter(User.id == int(payload["sub"])).first()
            except ValueError:
                pass

    if not user and email:
        user = db.query(User).filter(User.email == email.lower().strip()).first()

    if not user:
        return {
            "success": True,
            "status": "UNKNOWN",
            "email_configured": is_email_provider_configured(),
            "phone_configured": is_phone_provider_configured(),
        }

    return {
        "success": True,
        "data": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "account_status": user.account_status,
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "organization_verified": user.organization_verified,
            "rejection_reason": user.rejection_reason,
            "email_provider_configured": is_email_provider_configured(),
            "phone_provider_configured": is_phone_provider_configured(),
        },
    }


# ============================================================
# 6. FORGOT & RESET PASSWORD
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user:
        return {
            "success": True,
            "message": "If this email is registered in SARATHI, a password reset code has been sent.",
            "provider_configured": is_email_provider_configured(),
        }

    # Dispatch OTP via configured provider
    result = generate_and_store_otp(db, user.email, "password_reset", channel="email")

    log_auth_audit(
        db,
        action="PASSWORD_RESET_REQUESTED",
        user_id=user.id,
        details=f"Password reset OTP sent to {user.email}",
        ip_address=ip,
        user_agent=agent,
    )

    return {
        "success": True,
        "message": f"Password reset verification code dispatched to {user.email}",
        "otp_dispatch": result,
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    # Verify OTP
    verify_otp_code(db, request.email, "password_reset", request.otp)

    if len(request.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")

    user.hashed_password = pwd_context.hash(request.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    # Invalidate all prior refresh tokens
    revoked_count = revoke_all_user_refresh_tokens(db, user.id)

    log_auth_audit(
        db,
        action="PASSWORD_RESET_COMPLETED",
        user_id=user.id,
        details=f"Password successfully reset for {user.email}",
        ip_address=ip,
        user_agent=agent,
    )

    return {
        "success": True,
        "message": "Password has been successfully reset. Please sign in with your new password.",
        "revoked_sessions": revoked_count,
    }


# ============================================================
# 7. REFRESH TOKEN ROTATION
# ============================================================

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    new_access_token, new_refresh_token, user = rotate_refresh_token(db, request.refresh_token)

    return {
        "success": True,
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "data": {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        },
    }


# ============================================================
# 8. LOGOUT
# ============================================================

@router.post("/logout")
def logout(
    req: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    ip = req.client.host if req.client else None
    agent = req.headers.get("user-agent")

    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_token_payload(token)
        if payload and "sub" in payload:
            try:
                user_id = int(payload["sub"])
            except ValueError:
                pass

    revoked = 0
    if user_id:
        revoked = revoke_all_user_refresh_tokens(db, user_id)
        log_auth_audit(
            db,
            action="LOGOUT",
            user_id=user_id,
            details=f"User logged out; {revoked} session(s) revoked",
            ip_address=ip,
            user_agent=agent,
        )

    return {
        "success": True,
        "message": "Logged out successfully.",
        "revoked_tokens": revoked,
    }


# ============================================================
# 9. PROTECTED PROFILE & ROLE VERIFICATION ENDPOINTS
# ============================================================

@router.get("/me")
def get_current_user_profile(
    user_payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        uid = int(user_payload["id"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    return {
        "success": True,
        "data": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "account_status": user.account_status,
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "organization_verified": user.organization_verified,
        },
    }


@router.get("/admin-check")
def admin_only_check(
    user_payload: dict = Depends(require_role("government_admin", "admin")),
):
    return {
        "success": True,
        "message": "Authorized for administrator access.",
        "admin": user_payload,
    }

