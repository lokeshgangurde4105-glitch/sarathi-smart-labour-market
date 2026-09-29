from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db

router = APIRouter()


# ============================================================
# HEALTH CHECK (Requirement 4)
# ============================================================

@router.get("")
@router.get("/")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
        is_healthy = True
    except Exception as e:
        db_status = f"error: {str(e)}"
        is_healthy = False

    return {
        "status": "ok" if is_healthy else "degraded",
        "service": "SARATHI backend",
        "database": db_status,
        "engine": "SQLite (Live Source of Truth)",
        "success": is_healthy,
        "message": "Backend API is running and connected to SQLite database",
    }


# ============================================================
# API STATUS
# ============================================================

@router.get("/status")
def api_status(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_online = True
    except Exception:
        db_online = False

    return {
        "success": True,
        "service": "SARATHI backend",
        "status": "online",
        "database_connected": db_online,
    }


# ============================================================
# MODULE STATUS
# ============================================================

@router.get("/status/check")
def health_status():
    return {
        "success": True,
        "module": "health",
        "status": "working",
    }