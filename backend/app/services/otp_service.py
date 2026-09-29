import hashlib
import logging
import os
import re
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import OtpVerification, RefreshToken, User, AuditLog

logger = logging.getLogger("sarathi.otp")

OTP_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60
MAX_ATTEMPTS = 3
REFRESH_TOKEN_EXPIRY_DAYS = 14

# E.164 International Phone Regex: Starts with +, followed by 1-9, then 7 to 14 digits
E164_REGEX = re.compile(r"^\+[1-9]\d{7,14}$")


def validate_e164_phone(phone: str) -> str:
    """
    Validates and standardizes international phone number according to E.164.
    Example: +919876543210 or +14155552671
    """
    cleaned = phone.strip()
    if not cleaned.startswith("+"):
        digits_only = re.sub(r"\D", "", cleaned)
        if len(digits_only) == 10:
            cleaned = f"+91{digits_only}"
        elif len(digits_only) > 10:
            cleaned = f"+{digits_only}"
    if not E164_REGEX.match(cleaned):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid phone number format. Please provide a valid international E.164 "
                "phone number starting with a country code (e.g., +919876543210 or +14155552671)."
            ),
        )
    return cleaned


# ============================================================
# EXTERNAL PROVIDER ADAPTERS
# ============================================================

class EmailProvider:
    """SMTP / Mail provider adapter with strict configuration checks."""

    @staticmethod
    def is_configured() -> bool:
        host = os.getenv("SMTP_HOST")
        user = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        return bool(host and user and password)

    @staticmethod
    def send(recipient_email: str, otp_code: str, purpose: str) -> Tuple[bool, str]:
        if not EmailProvider.is_configured():
            return False, "Email verification is not configured."

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USERNAME")
        smtp_pass = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM", "noreply@sarathi.gov.in")

        try:
            subject = f"SARATHI Security Code: {otp_code}"
            readable_purpose = purpose.replace("_", " ").title()
            body_text = f"""
Welcome to SARATHI - Smart Labour Market Intelligence & Career Guidance Platform.

Your one-time verification code for {readable_purpose} is:

[ {otp_code} ]

This code will expire in {OTP_EXPIRY_MINUTES} minutes.
Do NOT share this code with anyone. SARATHI administrators will never ask for your OTP.
"""
            msg = MIMEMultipart()
            msg["From"] = smtp_from
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)

            logger.info(f"Email OTP dispatched to {recipient_email}")
            return True, f"Verification code sent to {recipient_email}"
        except Exception as e:
            logger.error(f"Failed to dispatch email via SMTP: {e}")
            return False, f"Failed to deliver email: {str(e)}"


class SMSProvider:
    """Twilio / SMS provider adapter with strict configuration checks."""

    @staticmethod
    def is_configured() -> bool:
        sid = os.getenv("TWILIO_ACCOUNT_SID")
        token = os.getenv("TWILIO_AUTH_TOKEN")
        from_num = os.getenv("TWILIO_FROM_NUMBER") or os.getenv("TWILIO_VERIFY_SERVICE_SID")
        return bool(sid and token and from_num)

    @staticmethod
    def send(recipient_phone: str, otp_code: str, purpose: str) -> Tuple[bool, str]:
        if not SMSProvider.is_configured():
            return False, "SMS verification is not configured."

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")

        try:
            # Twilio REST API client
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=f"Your SARATHI verification code is {otp_code}. Valid for {OTP_EXPIRY_MINUTES} mins.",
                from_=from_number,
                to=recipient_phone,
            )
            logger.info(f"SMS OTP dispatched to {recipient_phone}, SID: {message.sid}")
            return True, f"Verification code sent via SMS to {recipient_phone}"
        except ImportError:
            logger.warning("Twilio SDK not installed in python environment")
            return False, "SMS gateway client library is unavailable."
        except Exception as e:
            logger.error(f"Failed to dispatch SMS: {e}")
            return False, f"Failed to deliver SMS: {str(e)}"


class WhatsAppProvider:
    """WhatsApp Business API adapter with strict configuration checks."""

    @staticmethod
    def is_configured() -> bool:
        token = os.getenv("WHATSAPP_API_TOKEN")
        phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        return bool(token and phone_id)

    @staticmethod
    def send(recipient_phone: str, otp_code: str, purpose: str) -> Tuple[bool, str]:
        if not WhatsAppProvider.is_configured():
            return False, "WhatsApp verification is not configured."

        import urllib.request
        import json

        token = os.getenv("WHATSAPP_API_TOKEN")
        phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        clean_phone = recipient_phone.replace("+", "").strip()

        url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "text",
            "text": {
                "body": f"Your SARATHI verification code is *{otp_code}*. Valid for {OTP_EXPIRY_MINUTES} mins."
            },
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status in (200, 201):
                    logger.info(f"WhatsApp OTP dispatched to {recipient_phone}")
                    return True, f"Verification code sent via WhatsApp to {recipient_phone}"
            return False, "WhatsApp service returned an unexpected response."
        except Exception as e:
            logger.error(f"Failed to dispatch WhatsApp message: {e}")
            return False, f"Failed to deliver WhatsApp message: {str(e)}"


def is_email_provider_configured() -> bool:
    return EmailProvider.is_configured()


def is_phone_provider_configured() -> bool:
    return SMSProvider.is_configured() or WhatsAppProvider.is_configured()


# ============================================================
# OTP GENERATION, STORAGE & DISPATCH
# ============================================================

def generate_and_store_otp(
    db: Session,
    recipient: str,
    purpose: str,
    channel: str = "email",
) -> dict:
    """
    Validates provider configuration, generates cryptographically secure 6-digit OTP,
    hashes the OTP with SHA-256 before database storage, enforces cooldown,
    and dispatches via the configured provider adapter.
    """
    recipient_clean = recipient.strip().lower() if channel == "email" else recipient.strip()

    # If phone channel, validate E.164 format
    if channel in ("sms", "whatsapp", "phone"):
        recipient_clean = validate_e164_phone(recipient_clean)

    # Provider configuration check:
    # If not configured, strictly do NOT return fake success or universal OTP
    if channel == "email":
        if not EmailProvider.is_configured():
            raise HTTPException(
                status_code=400,
                detail="Email verification is not configured.",
            )
    elif channel == "sms":
        if not SMSProvider.is_configured():
            raise HTTPException(
                status_code=400,
                detail="SMS verification is not configured.",
            )
    elif channel == "whatsapp":
        if not WhatsAppProvider.is_configured():
            raise HTTPException(
                status_code=400,
                detail="WhatsApp verification is not configured.",
            )
    elif channel == "phone":
        if not (SMSProvider.is_configured() or WhatsAppProvider.is_configured()):
            raise HTTPException(
                status_code=400,
                detail="SMS verification is not configured.",
            )

    # Enforce resend cooldown (60 seconds)
    recent_otp = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.recipient == recipient_clean,
            OtpVerification.purpose == purpose,
            OtpVerification.is_used == False,
            OtpVerification.created_at >= datetime.utcnow() - timedelta(seconds=RESEND_COOLDOWN_SECONDS),
        )
        .first()
    )

    if recent_otp:
        time_elapsed = (datetime.utcnow() - recent_otp.created_at).total_seconds()
        remaining_wait = max(1, int(RESEND_COOLDOWN_SECONDS - time_elapsed))
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {remaining_wait} seconds before requesting a new verification code.",
        )

    # Invalidate previous unused OTPs for this recipient & purpose
    db.query(OtpVerification).filter(
        OtpVerification.recipient == recipient_clean,
        OtpVerification.purpose == purpose,
        OtpVerification.is_used == False,
    ).update({"is_used": True})
    db.commit()

    # Generate secure 6-digit OTP (100000 - 999999)
    otp_code = str(secrets.randbelow(900000) + 100000)

    # Hash OTP using SHA-256 before persisting
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    record = OtpVerification(
        recipient=recipient_clean,
        purpose=purpose,
        otp_hash=otp_hash,
        attempts=0,
        max_attempts=MAX_ATTEMPTS,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Dispatch via the adapter
    if channel == "email":
        sent, msg = EmailProvider.send(recipient_clean, otp_code, purpose)
    elif channel == "sms" or (channel == "phone" and SMSProvider.is_configured()):
        sent, msg = SMSProvider.send(recipient_clean, otp_code, purpose)
    elif channel == "whatsapp" or (channel == "phone" and WhatsAppProvider.is_configured()):
        sent, msg = WhatsAppProvider.send(recipient_clean, otp_code, purpose)
    else:
        sent, msg = False, "No valid communication provider configured."

    if not sent:
        raise HTTPException(status_code=500, detail=msg)

    return {
        "success": True,
        "recipient": recipient_clean,
        "channel": channel,
        "purpose": purpose,
        "cooldown_seconds": RESEND_COOLDOWN_SECONDS,
        "expires_in_minutes": OTP_EXPIRY_MINUTES,
        "message": msg,
    }


# ============================================================
# OTP VERIFICATION
# ============================================================

def verify_otp_code(db: Session, recipient: str, purpose: str, candidate_otp: str) -> bool:
    """
    Verifies candidate OTP against SHA-256 hash with attempt counting and constant-time check.
    Invalidates OTP upon success or when maximum attempts are exceeded.
    """
    recipient_clean = recipient.strip().lower() if "@" in recipient else recipient.strip()
    candidate_otp = candidate_otp.strip()

    record = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.recipient == recipient_clean,
            OtpVerification.purpose == purpose,
            OtpVerification.is_used == False,
            OtpVerification.expires_at > datetime.utcnow(),
        )
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code. Please request a new code.",
        )

    if record.attempts >= record.max_attempts:
        record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Too many invalid attempts. This verification code has expired. Please request a new one.",
        )

    candidate_hash = hashlib.sha256(candidate_otp.encode("utf-8")).hexdigest()

    if secrets.compare_digest(candidate_hash, record.otp_hash):
        record.is_used = True
        db.commit()
        return True
    else:
        record.attempts += 1
        db.commit()
        remaining = record.max_attempts - record.attempts
        if remaining > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Incorrect verification code. {remaining} attempt(s) remaining.",
            )
        else:
            record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Maximum attempts exceeded. This verification code has been invalidated.",
            )


# ============================================================
# REFRESH TOKEN ROTATION MANAGEMENT
# ============================================================

def issue_refresh_token(db: Session, user_id: int) -> str:
    """Generates an opaque cryptographic refresh token, hashes it, and stores it."""
    raw_token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)

    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(record)
    db.commit()
    return raw_token


def rotate_refresh_token(db: Session, raw_token: str) -> tuple[str, str, User]:
    """
    Validates refresh token, invalidates old token, issues new access + refresh pair.
    """
    token_hash = hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()

    record = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token. Please sign in again.",
        )

    # Invalidate old token (Rotation)
    record.revoked = True
    db.commit()

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated or unavailable.")

    from ..utils.auth_utils import create_access_token

    # Issue new access token
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    # Issue new refresh token
    new_refresh_token = issue_refresh_token(db, user.id)

    return new_access_token, new_refresh_token, user


def revoke_all_user_refresh_tokens(db: Session, user_id: int) -> int:
    """Revokes all active refresh tokens for a user (on logout or password reset)."""
    count = (
        db.query(RefreshToken)
        .filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        .update({"revoked": True})
    )
    db.commit()
    return count
