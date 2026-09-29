import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


# ============================================================
# JWT CONFIGURATION
# ============================================================
# Reads from backend/.env — see .env.example. Falls back to a
# dev-only default so the app still runs without a .env file,
# but ALWAYS set JWT_SECRET_KEY before a real demo/deployment.
# ============================================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))


# ============================================================
# HTTP BEARER SECURITY
# ============================================================

security = HTTPBearer(auto_error=False)


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
):
    """
    Create a JWT access token.
    """

    to_encode = data.copy()

    if expires_delta:

        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )

    else:

        expire = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update(
        {
            "exp": expire,
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# ============================================================
# VERIFY TOKEN
# ============================================================

def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials],
):
    """
    Verify JWT token and return its payload.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


def decode_token_payload(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Get the currently authenticated user
    from the JWT token.
    """

    payload = verify_token(credentials)

    user_id = payload.get("sub")

    if user_id is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return {
        "id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "user"),
    }


# ============================================================
# CHECK ADMIN ROLE
# ============================================================

def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Allow access only to admin users.
    """

    user = get_current_user(credentials)

    if user.get("role") not in ("admin", "government_admin"):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )

    return user


# ============================================================
# REQUIRE ROLE (generic)
# ============================================================
# Use as a route dependency to gate an endpoint to specific
# roles, e.g.:
#
#   @router.post("/jobs")
#   def post_job(
#       user: dict = Depends(require_role("employer")),
#   ):
#       ...
# ============================================================

def require_role(*allowed_roles: str):
    def checker(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    ) -> dict:
        user = get_current_user(credentials)
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}",
            )
        return user

    return checker