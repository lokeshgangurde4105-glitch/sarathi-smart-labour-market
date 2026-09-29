import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

# Load backend/.env (see backend/.env.example)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


# ============================================================
# DATABASE URL
# ============================================================
# Default: SQLite file at backend/sarathi.db — zero setup,
# matches the spec's "use SQLite for development database".
#
# To use PostgreSQL instead (e.g. in production), set DATABASE_URL
# in backend/.env, e.g.:
#   DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/labour_market_db
# ============================================================

DEFAULT_SQLITE_PATH = (Path(__file__).resolve().parent.parent / "sarathi.db").resolve()
raw_db_url = os.getenv("DATABASE_URL", "")
if not raw_db_url or raw_db_url in ("sqlite:///./sarathi.db", "sqlite:///sarathi.db"):
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
else:
    DATABASE_URL = raw_db_url

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# ============================================================
# SQLALCHEMY ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

# Apply SQLite concurrency & integrity optimizations (WAL mode, foreign keys)
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()



# ============================================================
# DATABASE SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE MODEL
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================
# FastAPI routes use this to obtain a database session.
#
# Example:
#
# @router.get("/dashboard")
# def dashboard(db: Session = Depends(get_db)):
#     ...
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
