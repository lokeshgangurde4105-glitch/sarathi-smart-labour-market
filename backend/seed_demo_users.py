"""
Creates one demo account per role for SIH judging / testing.
Safe to re-run — skips any account that already exists.

Run from the backend/ folder:
    python seed_demo_users.py
"""

from passlib.context import CryptContext

from app.database import Base, SessionLocal, engine
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {"name": "Demo Student", "email": "student@example.com", "password": "student123", "role": "student"},
    {"name": "Demo Employer", "email": "employer@example.com", "password": "employer123", "role": "employer"},
    {"name": "Demo Training Institute", "email": "institute@example.com", "password": "institute123", "role": "training_institute"},
    {"name": "Demo Trainer", "email": "trainer@example.com", "password": "trainer123", "role": "trainer"},
    {"name": "Demo Government Planner", "email": "government@example.com", "password": "government123", "role": "government"},
    {"name": "Demo Admin", "email": "admin@example.com", "password": "admin123", "role": "admin"},
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created = 0
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"skip  (already exists): {u['email']}")
                continue
            user = User(
                name=u["name"],
                email=u["email"],
                hashed_password=pwd_context.hash(u["password"]),
                role=u["role"],
                is_active=True,
                account_status="ACTIVE",
                email_verified=True,
                phone_verified=True,
                organization_verified=True,
            )
            db.add(user)
            created += 1
            print(f"create: {u['email']} / {u['password']}  (role={u['role']})")
        db.commit()
        print(f"\nDone. {created} account(s) created.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
