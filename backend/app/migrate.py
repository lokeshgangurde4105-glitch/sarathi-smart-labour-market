import sqlite3
import os
from pathlib import Path

def run_sqlite_migrations(db_path: str = None):
    if not db_path:
        db_path = str(Path(__file__).resolve().parent.parent / "sarathi.db")

    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def get_columns(table_name: str) -> set[str]:
        try:
            cursor.execute(f"PRAGMA table_info({table_name});")
            return {row[1] for row in cursor.fetchall()}
        except Exception:
            return set()

    # 1. Migrations for student_profiles
    sp_cols = get_columns("student_profiles")
    if sp_cols:
        additions = [
            ("full_name", "VARCHAR(200)"),
            ("dob", "VARCHAR(50)"),
            ("gender", "VARCHAR(50)"),
            ("branch", "VARCHAR(200)"),
            ("semester", "INTEGER"),
            ("graduation_year", "INTEGER"),
            ("preferred_industry", "VARCHAR(100)"),
            ("preferred_location", "VARCHAR(100)"),
            ("programming_languages", "TEXT"),
            ("tools_technologies", "TEXT"),
            ("experience_level", "VARCHAR(50)"),
            ("internship_experience", "TEXT"),
            ("projects", "TEXT"),
            ("linkedin_url", "VARCHAR(255)"),
            ("github_url", "VARCHAR(255)"),
            ("portfolio_url", "VARCHAR(255)"),
            ("profile_completed", "BOOLEAN DEFAULT 0"),
        ]
        for col_name, col_type in additions:
            if col_name not in sp_cols:
                try:
                    cursor.execute(f"ALTER TABLE student_profiles ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} to student_profiles")
                except Exception as e:
                    print(f"Notice: {col_name} on student_profiles: {e}")

    # 2. Migrations for course_enrollments
    ce_cols = get_columns("course_enrollments")
    if ce_cols:
        additions = [
            ("external_course_title", "VARCHAR(255)"),
            ("provider", "VARCHAR(100) DEFAULT 'Coursera'"),
        ]
        for col_name, col_type in additions:
            if col_name not in ce_cols:
                try:
                    cursor.execute(f"ALTER TABLE course_enrollments ADD COLUMN {col_name} {col_type};")
                    print(f"Added column {col_name} to course_enrollments")
                except Exception as e:
                    print(f"Notice: {col_name} on course_enrollments: {e}")

    # 3. Ensure course_enrollments.course_id is nullable for external roadmap courses
    try:
        cursor.execute("PRAGMA table_info(course_enrollments);")
        ce_info = {row[1]: row[3] for row in cursor.fetchall()}
        if ce_info.get("course_id") == 1:
            cursor.execute("PRAGMA foreign_keys=OFF;")
            cursor.execute("""
                CREATE TABLE course_enrollments_migration_tmp (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    course_id INTEGER REFERENCES courses(id),
                    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
                    attendance_percentage FLOAT DEFAULT 100.0,
                    progress_percentage FLOAT DEFAULT 0.0,
                    grade VARCHAR(20) DEFAULT 'In Progress',
                    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    external_course_title VARCHAR(255),
                    provider VARCHAR(100) DEFAULT 'Coursera'
                );
            """)
            cursor.execute("""
                INSERT INTO course_enrollments_migration_tmp (id, user_id, course_id, status, attendance_percentage, progress_percentage, grade, enrolled_at, completed_at, external_course_title, provider)
                SELECT id, user_id, course_id, status, attendance_percentage, progress_percentage, grade, enrolled_at, completed_at, external_course_title, provider FROM course_enrollments;
            """)
            cursor.execute("DROP TABLE course_enrollments;")
            cursor.execute("ALTER TABLE course_enrollments_migration_tmp RENAME TO course_enrollments;")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_course_enrollments_id ON course_enrollments (id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_course_enrollments_user_id ON course_enrollments (user_id);")
            cursor.execute("PRAGMA foreign_keys=ON;")
            print("Migrated course_enrollments to make course_id nullable.")
    except Exception as e:
        print(f"Notice during course_enrollments migration: {e}")

    # 4. Ensure certificates.course_id is nullable for external roadmap courses
    try:
        cursor.execute("PRAGMA table_info(certificates);")
        cert_info = {row[1]: row[3] for row in cursor.fetchall()}
        if cert_info.get("course_id") == 1:
            cursor.execute("PRAGMA foreign_keys=OFF;")
            cursor.execute("""
                CREATE TABLE certificates_migration_tmp (
                    id INTEGER PRIMARY KEY,
                    certificate_number VARCHAR(100) UNIQUE,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    course_id INTEGER REFERENCES courses(id),
                    institute_name VARCHAR(200) DEFAULT 'National Skill Training Institute',
                    trainer_name VARCHAR(200) DEFAULT 'Senior Master Trainer',
                    student_name VARCHAR(200),
                    course_name VARCHAR(200),
                    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    grade VARCHAR(20) DEFAULT 'A+',
                    skills TEXT,
                    verification_code VARCHAR(100) UNIQUE,
                    status VARCHAR(50) DEFAULT 'Verified',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("""
                INSERT INTO certificates_migration_tmp (id, certificate_number, user_id, course_id, institute_name, trainer_name, student_name, course_name, issue_date, grade, skills, verification_code, status, created_at)
                SELECT id, certificate_number, user_id, course_id, institute_name, trainer_name, student_name, course_name, issue_date, grade, skills, verification_code, status, created_at FROM certificates;
            """)
            cursor.execute("DROP TABLE certificates;")
            cursor.execute("ALTER TABLE certificates_migration_tmp RENAME TO certificates;")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_certificates_id ON certificates (id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_certificates_user_id ON certificates (user_id);")
            cursor.execute("PRAGMA foreign_keys=ON;")
            print("Migrated certificates to make course_id nullable.")
    except Exception as e:
        print(f"Notice during certificates migration: {e}")

    # 5. Clean up any demo certificates in certificates table if present
    try:
        cursor.execute("DELETE FROM certificates WHERE certificate_number LIKE '%SARATHI-CERT-2026-001%';")
        cursor.execute("DELETE FROM verification_records WHERE certificate_code LIKE '%SARATHI-CERT-2026-001%';")
    except Exception:
        pass

    conn.commit()
    conn.close()
    print("SQLite migrations complete.")

if __name__ == "__main__":
    run_sqlite_migrations()
