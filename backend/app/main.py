import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models  # noqa: F401  (import registers all tables on Base)

# ============================================================
# CREATE DATABASE TABLES
# ============================================================
# Creates any table that doesn't exist yet via lifespan startup.
# ============================================================


# ============================================================
# ROUTES
# ============================================================

from .routes import (
    auth,
    students,
    assessments,
    courses,
    certificates,
    jobs,
    skills,
    skill_gap,
    institutes,
    training,
    analytics,
    dashboard,
    curriculum,
    employers,
    recommendations,
    reports,
    notifications,
    industries,
    health,
    admin,
    ai_copilot,
    payments,
    real_data,
)


# ============================================================
# LIFESPAN CONTEXT MANAGER
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure all tables and columns exist and seed default records safely
    from .migrate import run_sqlite_migrations
    try:
        run_sqlite_migrations()
    except Exception as e:
        print(f"Startup notice: SQLite migration check: {e}")

    Base.metadata.create_all(bind=engine)
    from .database import SessionLocal
    from .seed import seed_database

    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"Startup notice: Database seeding check: {e}")
    finally:
        db.close()

    print("=" * 60)
    print("SARATHI - SMART LABOUR MARKET INTELLIGENCE PLATFORM")
    print("=" * 60)
    print("Backend: FastAPI (Online)")
    print("Database: Connected (SQLite - Live Source of Truth)")
    print("API: http://127.0.0.1:8000")
    print("Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    yield


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="SARATHI - Labour Market Intelligence Platform",
    description=(
        "Backend API for SARATHI: Smart Labour Market Intelligence "
        "and Career Guidance Platform"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================
# Configured for development and production environments.
# Allows credentials and permits frontend dev ports seamlessly.
# ============================================================

cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8443",
    "http://127.0.0.1:8443",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in allowed_origins:
            allowed_origins.append(trimmed)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "platform": "SARATHI - Smart Labour Market Intelligence Platform",
        "service": "SARATHI",
        "problem_statement": "SIH 26134",
        "status": "online",
        "backend": "FastAPI",
    }


# ============================================================
# HEALTH CHECK (Requirement 4)
# ============================================================

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
        db_msg = "connected"
    except Exception as e:
        db_connected = False
        db_msg = f"error: {str(e)}"

    return {
        "status": "ok" if db_connected else "degraded",
        "service": "SARATHI",
        "database": db_msg,
        "engine": "SQLite (Live Source of Truth)",
        "success": db_connected,
    }


# ============================================================
# SYSTEM STATUS
# ============================================================

@app.get("/api/system/status")
def system_status(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
        db_ok = True
    except Exception as e:
        db_status = f"disconnected ({e})"
        db_ok = False

    return {
        "success": db_ok,
        "backend": {
            "name": "FastAPI",
            "status": "online",
        },
        "database": {
            "name": "SQLite (Live DB)",
            "status": db_status,
            "connected": db_ok,
        },
        "frontend": {
            "name": "React / Vite",
            "status": "ready",
        },
    }


# ============================================================
# API INFORMATION
# ============================================================

@app.get("/api")
def api_info():
    return {
        "success": True,
        "name": "Smart Labour Market Intelligence API",
        "version": "1.0.0",

        "modules": [
            "dashboard",
            "jobs",
            "skills",
            "students",
            "curriculum",
            "skill-gap",
            "employers",
            "recommendations",
            "training",
            "reports",
            "notifications",
            "authentication",
            "industries",
            "health",
        ],
    }


# ============================================================
# HEALTH ROUTER
# ============================================================

app.include_router(
    health.router,
    prefix="/api/health",
    tags=["Health"],
)

# ============================================================
# REAL DATASET (SIH 26134)
# ============================================================

app.include_router(
    real_data.router,
    prefix="/api/real-data",
    tags=["Real Dataset"],
)



# ============================================================
# JOBS
# ============================================================

app.include_router(
    jobs.router,
    prefix="/api/jobs",
    tags=["Jobs"],
)


# ============================================================
# SKILLS
# ============================================================

app.include_router(
    skills.router,
    prefix="/api/skills",
    tags=["Skills"],
)


# ============================================================
# STUDENTS
# ============================================================

app.include_router(
    students.router,
    prefix="/api/students",
    tags=["Students"],
)


# ============================================================
# DASHBOARD
# ============================================================

app.include_router(
    dashboard.router,
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# SKILL GAP
# ============================================================

app.include_router(
    skill_gap.router,
    prefix="/api/skill-gap",
    tags=["Skill Gap Analysis"],
)


# ============================================================
# EMPLOYERS
# ============================================================

app.include_router(
    employers.router,
    prefix="/api/employers",
    tags=["Employers"],
)


# ============================================================
# RECOMMENDATIONS
# ============================================================

app.include_router(
    recommendations.router,
    prefix="/api/recommendations",
    tags=["Recommendations"],
)


# ============================================================
# TRAINING
# ============================================================

app.include_router(
    training.router,
    prefix="/api/training",
    tags=["Training"],
)


# ============================================================
# REPORTS
# ============================================================

app.include_router(
    reports.router,
    prefix="/api/reports",
    tags=["Reports"],
)


# ============================================================
# NOTIFICATIONS
# ============================================================

app.include_router(
    notifications.router,
    prefix="/api/notifications",
    tags=["Notifications"],
)


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# INDUSTRIES
# ============================================================

app.include_router(
    industries.router,
    prefix="/api/industries",
    tags=["Industries"],
)


# ============================================================
# CURRICULUM
# ============================================================

app.include_router(
    curriculum.router,
    prefix="/api/curriculum",
    tags=["Curriculum"],
)


# ============================================================
# ASSESSMENTS (Requirement 42)
# ============================================================

app.include_router(
    assessments.router,
    prefix="/api/assessments",
    tags=["Assessments"],
)


# ============================================================
# COURSES & ENROLLMENT (Requirements 44 & 45)
# ============================================================

app.include_router(
    courses.router,
    prefix="/api/courses",
    tags=["Courses"],
)


# ============================================================
# CERTIFICATES & VERIFICATION (Requirement 46)
# ============================================================

app.include_router(
    certificates.router,
    prefix="/api/certificates",
    tags=["Certificates"],
)


# ============================================================
# INSTITUTES (Requirement 49)
# ============================================================

app.include_router(
    institutes.router,
    prefix="/api/institutes",
    tags=["Institutes"],
)


# ============================================================
# ANALYTICS & DATASET IMPORT (Requirements 51 & 52)
# ============================================================

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
)


# ============================================================
# ADMIN & VERIFICATION WORKFLOW
# ============================================================

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin & Verification"],
)


# ============================================================
# SARATHI AI COPILOT & EXPLAINABLE "WHY?" ENGINE
# ============================================================

app.include_router(
    ai_copilot.router,
    prefix="/api/ai",
    tags=["SARATHI AI Copilot"],
)


# ============================================================
# PAYMENTS (RAZORPAY ABSTRACTION & SANDBOX)
# ============================================================

app.include_router(
    payments.router,
    prefix="/api/payments",
    tags=["Payments"],
)



