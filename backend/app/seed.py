import json
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .models import (
    User,
    StudentProfile,
    Skill,
    Course,
    CourseModule,
    CourseEnrollment,
    CourseProgress,
    Certificate,
    VerificationRecord,
    EntityVerification,
    DatasetImport,
    JobPosting,
    JobApplication,
    CandidateJobMatch,
    AssessmentQuestion,
    AssessmentAttempt,
    StudentSkillGap,
    Sector,
    Location,
)
from .data.question_bank import EXPANDED_QUESTION_BANK

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import os

GOVERNMENT_EMAIL = os.getenv("GOVERNMENT_EMAIL", "admin@example.com").lower().strip()
GOVERNMENT_PASSWORD = os.getenv("GOVERNMENT_PASSWORD", "admin123")

DEMO_USERS = [
    {
        "name": "Aarav Sharma (Student)",
        "email": "student@example.com",
        "password": "student123",
        "role": "student",
    },
    {
        "name": "Tata Consultancy Services (Employer)",
        "email": "employer@example.com",
        "password": "employer123",
        "role": "employer",
    },
    {
        "name": "Pune Institute of Technology (Institute)",
        "email": "institute@example.com",
        "password": "institute123",
        "role": "training_institute",
    },
    {
        "name": "Prof. Rajesh Verma (Trainer)",
        "email": "trainer@example.com",
        "password": "trainer123",
        "role": "trainer",
    },
    {
        "name": "Government Administrator",
        "email": GOVERNMENT_EMAIL,
        "password": GOVERNMENT_PASSWORD,
        "role": "government_admin",
    },
]

DEMO_SKILLS = [
    {"name": "Python", "category": "Programming", "demand_score": 95, "supply_score": 75, "gap_score": 20, "status": "High Demand", "trend": "Rising", "is_emerging": False},
    {"name": "FastAPI", "category": "Backend", "demand_score": 88, "supply_score": 62, "gap_score": 26, "status": "High Demand", "trend": "Rising", "is_emerging": True},
    {"name": "SQL", "category": "Database", "demand_score": 92, "supply_score": 80, "gap_score": 12, "status": "High Demand", "trend": "Stable", "is_emerging": False},
    {"name": "React", "category": "Frontend", "demand_score": 90, "supply_score": 72, "gap_score": 18, "status": "High Demand", "trend": "Stable", "is_emerging": False},
    {"name": "Machine Learning", "category": "Artificial Intelligence", "demand_score": 94, "supply_score": 58, "gap_score": 36, "status": "Critical Gap", "trend": "Surging", "is_emerging": True},
    {"name": "Cloud Computing", "category": "Cloud & DevOps", "demand_score": 91, "supply_score": 60, "gap_score": 31, "status": "Critical Gap", "trend": "Rising", "is_emerging": True},
    {"name": "Docker", "category": "DevOps", "demand_score": 85, "supply_score": 55, "gap_score": 30, "status": "Skill Gap", "trend": "Rising", "is_emerging": True},
    {"name": "Generative AI", "category": "Artificial Intelligence", "demand_score": 96, "supply_score": 42, "gap_score": 54, "status": "Critical Gap", "trend": "Surging", "is_emerging": True},
    {"name": "Data Structures", "category": "Computer Science", "demand_score": 89, "supply_score": 70, "gap_score": 19, "status": "High Demand", "trend": "Stable", "is_emerging": False},
    {"name": "Cybersecurity", "category": "Security", "demand_score": 87, "supply_score": 48, "gap_score": 39, "status": "Critical Gap", "trend": "Rising", "is_emerging": True},
]

DEMO_QUESTIONS = EXPANDED_QUESTION_BANK


DEMO_COURSES = [
    {
        "name": "Full Stack Python & Cloud Development",
        "qualification": "B.Tech / BCA / MCA / Diploma",
        "duration_months": 4,
        "training_capacity": 60,
        "enrolled_students": 42,
        "placement_rate": 88.5,
        "alignment_score": 92.0,
        "demand_level": "High",
        "description": "Comprehensive engineering curriculum covering Modern Python, FastAPI REST services, SQLAlchemy ORM, React 19, and Docker cloud deployment.",
        "modules": [
            ("Modern Python & Object-Oriented Design", "Deep dive into Python 3.12+, OOP, generators, and data structures.", 1, 20),
            ("Relational Databases & SQLAlchemy ORM", "SQL schema design, queries, migrations, indexing, and ORM mapping.", 2, 25),
            ("FastAPI Enterprise REST APIs", "Async endpoints, Pydantic validation, JWT authentication, and Swagger.", 3, 30),
            ("Modern React & State Management", "Component design, hooks, TypeScript integration, and Tailwind CSS.", 4, 35),
            ("Cloud Infrastructure & Docker Deployment", "Dockerizing full-stack apps, CI/CD pipelines, and cloud hosting.", 5, 20),
        ],
    },
    {
        "name": "Applied AI & Machine Learning Systems",
        "qualification": "B.Tech / M.Tech / Data Science Graduates",
        "duration_months": 6,
        "training_capacity": 45,
        "enrolled_students": 38,
        "placement_rate": 91.0,
        "alignment_score": 95.0,
        "demand_level": "Very High",
        "description": "Hands-on industry program covering Supervised/Unsupervised ML, Deep Learning, Generative AI, RAG pipelines, and model deployment.",
        "modules": [
            ("Data Wrangling & Statistical Analysis", "Numpy, Pandas, hypothesis testing, and exploratory data analysis.", 1, 30),
            ("Machine Learning Algorithms & Optimization", "Regression, classification, ensemble models, and hyperparameter tuning.", 2, 40),
            ("Deep Learning & Transformers", "Neural architectures, PyTorch fundamentals, and attention mechanisms.", 3, 40),
            ("Generative AI & LLM Systems", "Prompt engineering, RAG pipelines, vector embeddings, and LangChain.", 4, 45),
            ("MLOps & Scalable API Serving", "Model registry, monitoring drift, and serving via FastAPI & Docker.", 5, 25),
        ],
    },
    {
        "name": "Enterprise Cloud & DevOps Engineering",
        "qualification": "IT / CS Degree or Diploma",
        "duration_months": 3,
        "training_capacity": 50,
        "enrolled_students": 32,
        "placement_rate": 86.0,
        "alignment_score": 89.0,
        "demand_level": "High",
        "description": "Industrial curriculum on Linux administration, Docker containers, Kubernetes orchestration, CI/CD automation, and AWS cloud.",
        "modules": [
            ("Linux Systems & Shell Automation", "Kernel concepts, bash scripting, permissions, and network troubleshooting.", 1, 20),
            ("Docker Containerization", "Multi-stage builds, networking, volumes, and microservice containerization.", 2, 25),
            ("Kubernetes Orchestration", "Pods, deployments, services, ingress controllers, and ConfigMaps.", 3, 35),
            ("CI/CD Automation Pipelines", "GitHub Actions, automated test suites, and continuous delivery.", 4, 25),
            ("Cloud Infrastructure as Code", "Terraform basics and cloud provisioning on AWS.", 5, 25),
        ],
    },
    {
        "name": "Data Analytics & Business Intelligence",
        "qualification": "Any Graduate / BCA / B.Com / B.Sc",
        "duration_months": 3,
        "training_capacity": 55,
        "enrolled_students": 49,
        "placement_rate": 84.0,
        "alignment_score": 87.0,
        "demand_level": "High",
        "description": "Practical training in Advanced SQL, Business Intelligence with Power BI, Python data analysis, and executive dashboard reporting.",
        "modules": [
            ("Advanced SQL & Data Modeling", "Window functions, CTEs, star schema, and data warehouse fundamentals.", 1, 30),
            ("Power BI Executive Dashboards", "DAX expressions, data modeling, storytelling, and visual reporting.", 2, 35),
            ("Python Data Analytics", "Pandas, Seaborn, Matplotlib, and automated reporting.", 3, 30),
            ("Business Case Studies & Capstone", "Real-world dataset analysis and stakeholder presentation.", 4, 25),
        ],
    },
]

DEMO_JOBS = [
    {
        "title": "Junior Python / FastAPI Developer",
        "company_name": "TechSolutions Global",
        "location": "Pune, Maharashtra",
        "job_type": "Full Time",
        "experience": "0-2 Years",
        "vacancies": 8,
        "salary_range": "₹4.5 - 7.0 LPA",
        "description": "We are seeking proactive Python developers proficient in FastAPI, SQL databases, and RESTful architectures to build scalable cloud backends.",
        "required_skills": "Python, FastAPI, SQL, Docker",
    },
    {
        "title": "Full Stack Software Engineer",
        "company_name": "Infosys Digital Labs",
        "location": "Bangalore / Pune (Hybrid)",
        "job_type": "Full Time",
        "experience": "1-3 Years",
        "vacancies": 12,
        "salary_range": "₹6.0 - 10.5 LPA",
        "description": "Build high-throughput web applications with React frontend, Python FastAPI backend, and PostgreSQL database cluster.",
        "required_skills": "Python, React, SQL, FastAPI, Docker",
    },
    {
        "title": "Associate AI / ML Engineer",
        "company_name": "Cognitive AI Systems",
        "location": "Hyderabad, Telangana",
        "job_type": "Full Time",
        "experience": "0-2 Years",
        "vacancies": 5,
        "salary_range": "₹7.0 - 12.0 LPA",
        "description": "Develop and deploy intelligent LLM applications, retrieval-augmented generation pipelines, and predictive algorithms.",
        "required_skills": "Python, Machine Learning, Generative AI, Cloud Computing",
    },
    {
        "title": "Cloud Operations & DevOps Engineer",
        "company_name": "CloudNine Networks",
        "location": "Mumbai, Maharashtra",
        "job_type": "Full Time",
        "experience": "1-3 Years",
        "vacancies": 6,
        "salary_range": "₹5.5 - 9.0 LPA",
        "description": "Manage containerized infrastructure, build automated CI/CD deployment pipelines, and optimize cloud services.",
        "required_skills": "Cloud Computing, Docker, Linux, Python",
    },
    {
        "title": "Data Analyst & Reporting Specialist",
        "company_name": "PwC Strategy & Operations",
        "location": "Pune, Maharashtra",
        "job_type": "Full Time",
        "experience": "0-2 Years",
        "vacancies": 4,
        "salary_range": "₹5.0 - 8.0 LPA",
        "description": "Extract insights from multi-source datasets, create interactive Power BI dashboards, and present findings to leadership.",
        "required_skills": "SQL, Python, Data Analytics, Statistics",
    },
]


def seed_database(db: Session):
    """
    Idempotent database seeder. Populates essential baseline records
    if tables are currently empty. Safe to run on every startup.
    Strictly enforces that EXACTLY ONE dedicated Government/Admin account exists.
    """
    from sqlalchemy import func
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    gov_email = os.getenv("GOVERNMENT_EMAIL", "admin@example.com").lower().strip()
    gov_pwd = os.getenv("GOVERNMENT_PASSWORD", "admin123")

    # 1. Baseline Users
    user_map = {}
    for u in DEMO_USERS:
        is_gov = (u["role"] == "government_admin")
        target_email = gov_email if is_gov else u["email"].lower().strip()
        target_pwd = gov_pwd if is_gov else u["password"]

        existing = db.query(User).filter(func.lower(func.trim(User.email)) == target_email).first()
        if not existing:
            user = User(
                name=u["name"],
                email=target_email,
                hashed_password=pwd_context.hash(target_pwd),
                role=u["role"],
                is_active=True,
                account_status="ACTIVE",
                email_verified=True,
                phone_verified=True,
                organization_verified=True,
                failed_login_attempts=0,
                locked_until=None,
            )
            db.add(user)
            db.flush()
            user_map[u["role"]] = user
        else:
            if existing.account_status != "ACTIVE":
                existing.account_status = "ACTIVE"
                existing.email_verified = True
                existing.phone_verified = True
                existing.organization_verified = True
            if is_gov:
                existing.role = "government_admin"
                existing.name = "Government Administrator"
                existing.is_active = True
                existing.hashed_password = pwd_context.hash(target_pwd)
                existing.failed_login_attempts = 0
                existing.locked_until = None
            user_map[u["role"]] = existing

    # 2. Enforce strictly ONE Government Administrator account (Requirement 6):
    # Any other user in the database with role 'government_admin' or 'admin' or 'government'
    # whose email is NOT gov_email is demoted to 'student' so there are NO duplicate Government accounts!
    other_admins = db.query(User).filter(
        User.role.in_(["government_admin", "admin", "government"]),
        func.lower(func.trim(User.email)) != gov_email
    ).all()
    for oa in other_admins:
        oa.role = "student"

    db.commit()

    student_user = user_map.get("student")
    employer_user = user_map.get("employer")

    # 2. Student Profile
    if student_user:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not profile:
            profile = StudentProfile(
                user_id=student_user.id,
                phone="+91 98765 43210",
                college="Government College of Engineering, Pune",
                year=3,
                course="B.Tech Computer Engineering",
                target_role="Full Stack AI Engineer",
                bio="Passionate engineer aiming to solve real-world problems with scalable backend systems and intelligent AI workflows.",
                skills="Python, SQL, React, FastAPI, Data Structures",
                skill_score=82.0,
                industry_readiness=85.0,
                location="Pune, Maharashtra",
                resume_headline="B.Tech CSE Student | Python & React Developer | AI Enthusiast",
            )
            db.add(profile)
            db.commit()

    # 3. Skills
    for s in DEMO_SKILLS:
        existing = db.query(Skill).filter(Skill.name == s["name"]).first()
        if not existing:
            skill = Skill(
                name=s["name"],
                category=s["category"],
                is_emerging=s["is_emerging"],
                is_obsolete=False,
            )
            db.add(skill)
    db.commit()

    # 4. Assessment Questions
    for q in DEMO_QUESTIONS:
        existing = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.question == q["question"]
        ).first()
        if not existing:
            question = AssessmentQuestion(
                skill_name=q["skill_name"],
                question=q["question"],
                option_a=q["option_a"],
                option_b=q["option_b"],
                option_c=q["option_c"],
                option_d=q["option_d"],
                correct_option=q["correct_option"],
                explanation=q["explanation"],
                difficulty=q["difficulty"],
                category=q["category"],
            )
            db.add(question)
    db.commit()

    # 5. Courses & Course Modules
    course_records = []
    for c in DEMO_COURSES:
        existing = db.query(Course).filter(Course.name == c["name"]).first()
        if not existing:
            course = Course(
                name=c["name"],
                qualification=c["qualification"],
                duration_months=c["duration_months"],
                training_capacity=c["training_capacity"],
                enrolled_students=c["enrolled_students"],
                placement_rate=c["placement_rate"],
                alignment_score=c["alignment_score"],
                demand_level=c["demand_level"],
                description=c["description"],
                status="Active",
            )
            db.add(course)
            db.flush()
            course_records.append(course)

            # Add modules
            for title, desc, order_num, hours in c["modules"]:
                module = CourseModule(
                    course_id=course.id,
                    title=title,
                    description=desc,
                    order_num=order_num,
                    duration_hours=hours,
                    is_core=True,
                )
                db.add(module)
        else:
            course_records.append(existing)

    db.commit()

    # 6. Student Enrollment & Progress
    if student_user and course_records:
        first_course = course_records[0]
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.user_id == student_user.id,
            CourseEnrollment.course_id == first_course.id,
        ).first()

        if not enrollment:
            enrollment = CourseEnrollment(
                user_id=student_user.id,
                course_id=first_course.id,
                status="In Progress",
                attendance_percentage=88.0,
                progress_percentage=65.0,
                grade="A",
            )
            db.add(enrollment)
            db.flush()

            # Add progress for each module of this course
            modules = db.query(CourseModule).filter(CourseModule.course_id == first_course.id).order_by(CourseModule.order_num).all()
            for idx, mod in enumerate(modules):
                # mark first two completed, third in progress
                is_comp = idx < 2
                score = 90.0 if idx < 2 else (65.0 if idx == 2 else 0.0)
                db.add(CourseProgress(
                    enrollment_id=enrollment.id,
                    module_id=mod.id,
                    is_completed=is_comp,
                    score=score,
                ))
            db.commit()

    # 7. Student Certificate & Verification Record (Earned upon 100% course completion only)
    # No demo certificates seeded: certificates are strictly generated upon verified 100% course completion.

    # 8. Jobs
    for j in DEMO_JOBS:
        existing = db.query(JobPosting).filter(JobPosting.title == j["title"]).first()
        if not existing:
            job = JobPosting(
                employer_user_id=employer_user.id if employer_user else None,
                title=j["title"],
                company_name=j["company_name"],
                location=j["location"],
                job_type=j["job_type"],
                experience=j["experience"],
                vacancies=j["vacancies"],
                salary_range=j["salary_range"],
                description=j["description"],
                required_skills=j["required_skills"],
                status="Active",
            )
            db.add(job)
    db.commit()

    # 9. Job Application for Student
    if student_user:
        job = db.query(JobPosting).first()
        if job:
            existing_app = db.query(JobApplication).filter(
                JobApplication.job_id == job.id,
                JobApplication.user_id == student_user.id,
            ).first()
            if not existing_app:
                db.add(JobApplication(
                    job_id=job.id,
                    user_id=student_user.id,
                    status="Interview",
                    cover_note="Experienced with Python and REST APIs. Completed Full Stack certification.",
                ))
                db.commit()

    # 10. Student Skill Gaps
    if student_user:
        gaps = db.query(StudentSkillGap).filter(StudentSkillGap.user_id == student_user.id).all()
        if not gaps:
            db.add(StudentSkillGap(
                user_id=student_user.id,
                skill_name="Cloud Computing",
                current_score=50.0,
                required_score=85.0,
                gap_score=35.0,
                priority="High",
                recommended_course="Enterprise Cloud & DevOps Engineering",
            ))
            db.add(StudentSkillGap(
                user_id=student_user.id,
                skill_name="Generative AI",
                current_score=40.0,
                required_score=85.0,
                gap_score=45.0,
                priority="Critical",
                recommended_course="Applied AI & Machine Learning Systems",
            ))
            db.commit()

    # 11. Ingest Real Indian Fresher Dataset
    seed_indian_job_market_freshers(db, employer_user)

    # 12. Seed Multi-Role Entity Verifications (Verification Center)
    seed_entity_verifications(db, user_map)


def seed_indian_job_market_freshers(db: Session, employer_user):
    import os
    import csv

    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "data", "indian_job_market_freshers.csv"),
        os.path.join(os.getcwd(), "backend", "data", "indian_job_market_freshers.csv"),
        "backend/data/indian_job_market_freshers.csv",
    ]
    csv_path = None
    for p in possible_paths:
        if os.path.exists(p):
            csv_path = p
            break

    if not csv_path:
        return

    existing_import = db.query(DatasetImport).filter(
        DatasetImport.filename == "indian_job_market_freshers.csv"
    ).first()

    if existing_import:
        return

    added_count = 0
    try:
        with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                if idx >= 150:
                    break
                title = row.get("Job Title", "").strip()
                if not title:
                    continue

                raw_loc = row.get("Location", "").strip()
                locality = row.get("Locality", "").strip()
                state = row.get("State", "").strip()

                location = raw_loc or (f"{locality}, {state}" if locality and state else state or "Pune, Maharashtra")

                company = "National Skill Partner"
                if "TCS" in title:
                    company = "Tata Consultancy Services"
                elif "Java" in title or "HTML" in title or "Web" in title:
                    company = "NexGen Tech Solutions"
                elif "Trainer" in title or "Teacher" in title:
                    company = "Skill India Academy"
                elif "Remote" in location or "Remote" in raw_loc:
                    company = "CloudEdge Technologies"
                else:
                    company = "SARATHI National Enterprise Partner"

                title_lower = title.lower()
                if "python" in title_lower:
                    skills = "Python, SQL, REST APIs, Git"
                elif "html" in title_lower or "web" in title_lower or "frontend" in title_lower:
                    skills = "HTML, CSS, JavaScript, Responsive UI"
                elif "java" in title_lower:
                    skills = "Java, OOP, Spring Boot, SQL"
                elif "tester" in title_lower or "testing" in title_lower or "qa" in title_lower:
                    skills = "Manual Testing, QA Automation, Test Cases, Bug Tracking"
                elif "data entry" in title_lower or "operator" in title_lower or "office" in title_lower:
                    skills = "MS Excel, Computer Fundamentals, Data Management"
                elif "robotics" in title_lower or "stem" in title_lower:
                    skills = "Robotics, STEM Education, Python, Arduino"
                elif "teacher" in title_lower or "primary" in title_lower:
                    skills = "Computers, Communication, Pedagogy, EVS"
                else:
                    skills = "Computer Applications, Problem Solving, Communication"

                monthly_val = row.get("Monthly Salary", "").strip()
                if monthly_val:
                    try:
                        m_float = float(monthly_val)
                        lpa = round((m_float * 12) / 100000, 1)
                        salary_str = f"₹{lpa} - ₹{round(lpa + 1.5, 1)} LPA"
                    except ValueError:
                        salary_str = "₹3.5 - 5.5 LPA"
                else:
                    salary_str = "₹3.2 - 5.0 LPA"

                existing_job = db.query(JobPosting).filter(
                    JobPosting.title == title,
                    JobPosting.location == location,
                ).first()

                if not existing_job:
                    db.add(JobPosting(
                        employer_user_id=employer_user.id if employer_user else None,
                        title=title,
                        company_name=company,
                        location=location,
                        job_type="Full Time" if "Remote" not in location else "Remote",
                        experience="0-1 Years",
                        vacancies=3,
                        salary_range=salary_str,
                        description=f"Fresher job vacancy for {title}. Location: {location}. Official verified Indian labour listing.",
                        required_skills=skills,
                        status="Active",
                    ))
                    added_count += 1

        db.add(DatasetImport(
            filename="indian_job_market_freshers.csv",
            row_count=added_count,
            source_name="National Fresher Labour Survey (Live Dataset)",
            status="Processed & Active in Analytics",
            summary_json=json.dumps({"ingested_jobs": added_count, "source": "User Labour Dataset"}),
        ))
        db.commit()
    except Exception as e:
        print(f"[SEED] Warning during fresher dataset ingestion: {e}")


def seed_entity_verifications(db: Session, users):
    user_map = users if isinstance(users, dict) else {u.role: u for u in users}

    demo_verifications = [
        {
            "role": "student",
            "entity_name": "Aarav Sharma",
            "entity_type": "student",
            "document_type": "College Student ID & Degree Enrolment",
            "document_id": "COEP-CS-2024-8841",
            "status": "VERIFIED",
            "reviewer_notes": "Enrolment verified with COEP Technological University student registry.",
            "reviewed_by": "Government Administrator",
        },
        {
            "role": "employer",
            "entity_name": "Tata Consultancy Services",
            "entity_type": "employer",
            "document_type": "Corporate CIN & MCA21 Verification",
            "document_id": "L72200MH1995PLC095651",
            "status": "VERIFIED",
            "reviewer_notes": "Corporate entity verified via Ministry of Corporate Affairs (MCA21).",
            "reviewed_by": "Government Administrator",
        },
        {
            "role": "training_institute",
            "entity_name": "Pune Institute of Technology",
            "entity_type": "training_institute",
            "document_type": "AISHE & NCVET Accreditation Certificate",
            "document_id": "AISHE-C-33842-NCVET",
            "status": "VERIFIED",
            "reviewer_notes": "Official NSTI / NCVET affiliated vocational training provider.",
            "reviewed_by": "Government Administrator",
        },
        {
            "role": "trainer",
            "entity_name": "Prof. Rajesh Verma",
            "entity_type": "trainer",
            "document_type": "NSDC Master Trainer Certificate (TOT)",
            "document_id": "NSDC-TRN-77291",
            "status": "VERIFIED",
            "reviewer_notes": "Certified Assessor & Trainer in Cloud & Python stacks.",
            "reviewed_by": "Government Administrator",
        },
    ]

    for item in demo_verifications:
        u = user_map.get(item["role"])
        if u:
            existing = db.query(EntityVerification).filter(
                EntityVerification.user_id == u.id,
                EntityVerification.document_id == item["document_id"],
            ).first()
            if not existing:
                db.add(EntityVerification(
                    user_id=u.id,
                    entity_type=item["entity_type"],
                    entity_name=item["entity_name"],
                    document_type=item["document_type"],
                    document_id=item["document_id"],
                    status=item["status"],
                    reviewer_notes=item["reviewer_notes"],
                    reviewed_by=item["reviewed_by"],
                    reviewed_at=datetime.utcnow(),
                ))

    # Add a pending verification for admin review demo
    student_user = user_map.get("student")
    if student_user:
        pending_check = db.query(EntityVerification).filter(
            EntityVerification.user_id == student_user.id,
            EntityVerification.document_id == "CERT-AWS-SAA-9921",
        ).first()
        if not pending_check:
            db.add(EntityVerification(
                user_id=student_user.id,
                entity_type="student",
                entity_name="Aarav Sharma - AWS Cloud Practitioner",
                document_type="Cloud Security Certification Scorecard",
                document_id="CERT-AWS-SAA-9921",
                status="PENDING",
                reviewer_notes="Candidate submitted AWS Certification badge for verification.",
                submitted_at=datetime.utcnow(),
            ))

    db.commit()

