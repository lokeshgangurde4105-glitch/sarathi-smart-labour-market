from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
from typing import Optional, List, Any, Union
from sqlalchemy.orm import Session
import json

from ..database import get_db
from ..models import (
    User,
    StudentProfile,
    Course,
    CourseEnrollment,
    CourseProgress,
    CourseModule,
    Certificate,
    JobPosting,
    JobApplication,
    StudentSkillGap,
    AssessmentAttempt,
    StudentUploadedCertificate,
    EntityVerification,
    StudySession,
    VerificationRecord,
)
from ..utils.auth_utils import decode_token_payload

router = APIRouter()


# ============================================================
# HELPER: Get current user ID from optional Bearer token
# ============================================================

def get_optional_user_id(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> int:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_token_payload(token)
        if payload and "sub" in payload:
            try:
                return int(payload["sub"])
            except ValueError:
                pass
    # Fallback to demo student account
    demo_student = db.query(User).filter(User.email == "student@example.com").first()
    if demo_student:
        return demo_student.id
    first_user = db.query(User).first()
    return first_user.id if first_user else 1


# ============================================================
# SCHEMAS
# ============================================================

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    college: Optional[str] = None
    year: Optional[int] = None
    current_year: Optional[int] = None
    course: Optional[str] = None
    course_name: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    graduation_year: Optional[int] = None
    target_role: Optional[str] = None
    preferred_industry: Optional[str] = None
    preferred_location: Optional[str] = None
    work_preference: Optional[str] = None
    skills: Optional[Union[str, List[str]]] = None
    programming_languages: Optional[Union[str, List[str]]] = None
    tools_technologies: Optional[Union[str, List[str]]] = None
    experience_level: Optional[str] = None
    internship_experience: Optional[str] = None
    projects: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    resume_headline: Optional[str] = None


class OnboardingRequest(BaseModel):
    interests: List[str]
    target_role: str
    work_preference: Optional[str] = "Hybrid"
    known_skills: Optional[List[str]] = None
    location: Optional[str] = "Pune, Maharashtra"
    college: Optional[str] = None
    year: Optional[int] = 3


class CertificateUploadRequest(BaseModel):
    title: str
    issuing_organization: str
    issue_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    file_hash_sha256: str


class StartStudyRequest(BaseModel):
    course_id: int
    module_id: Optional[int] = None
    lesson_id: Optional[int] = None
    activity_type: Optional[str] = "LESSON"


class StudyHeartbeatRequest(BaseModel):
    session_id: int
    duration_seconds: int


class CompleteStudyRequest(BaseModel):
    session_id: int
    duration_seconds: int
    is_completed: Optional[bool] = True


# ============================================================
# HELPER: DYNAMIC PROFILE SERIALIZATION & METRICS
# ============================================================

def recalculate_student_metrics(profile: StudentProfile, db: Session) -> tuple[float, float]:
    cand_tokens: list[str] = []
    if profile.skills:
        cand_tokens.extend([s.strip().lower() for s in profile.skills.split(",") if s.strip()])
    if profile.programming_languages:
        cand_tokens.extend([s.strip().lower() for s in profile.programming_languages.split(",") if s.strip()])
    if profile.tools_technologies:
        cand_tokens.extend([s.strip().lower() for s in profile.tools_technologies.split(",") if s.strip()])

    cand_tokens = list(dict.fromkeys(cand_tokens))
    if not cand_tokens:
        profile.skill_score = 0.0
        profile.industry_readiness = 0.0
        return 0.0, 0.0

    cand_set = set(cand_tokens)
    target_role_str = (profile.target_role or "").strip().lower()

    try:
        from .real_data import _cached_csv
        rows = list(_cached_csv("job_recommendation_dataset.csv"))
    except Exception:
        rows = []

    matching_ratios: list[float] = []
    for r in rows:
        role_title = r.get("Job Title", "").strip().lower()
        if target_role_str and target_role_str not in role_title:
            continue
        req_raw = r.get("Required Skills", "")
        req_tokens = [s.strip().lower() for s in req_raw.split(",") if s.strip()]
        if not req_tokens:
            continue
        req_set = set(req_tokens)
        matched = cand_set.intersection(req_set)
        matching_ratios.append(len(matched) / len(req_set))

    if not matching_ratios and rows:
        for r in rows[:500]:
            req_raw = r.get("Required Skills", "")
            req_tokens = [s.strip().lower() for s in req_raw.split(",") if s.strip()]
            if not req_tokens:
                continue
            req_set = set(req_tokens)
            matched = cand_set.intersection(req_set)
            matching_ratios.append(len(matched) / len(req_set))

    base_pct = (sum(matching_ratios) / max(1, len(matching_ratios))) * 100.0 if matching_ratios else 25.0

    # Verification bonuses from real SQLite activity
    completed_enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == profile.user_id,
        CourseEnrollment.progress_percentage >= 100.0
    ).count()

    passed_attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == profile.user_id,
        AssessmentAttempt.passed == True
    ).count()

    project_bonus = 8.0 if profile.projects and len(profile.projects.strip()) > 3 else 0.0
    internship_bonus = 7.0 if profile.internship_experience and len(profile.internship_experience.strip()) > 3 else 0.0
    links_bonus = 5.0 if (profile.linkedin_url or profile.github_url or profile.portfolio_url) else 0.0
    course_bonus = min(20.0, completed_enrollments * 10.0)
    assessment_bonus = min(15.0, passed_attempts * 7.5)

    final_skill_score = min(100.0, round(base_pct + course_bonus + assessment_bonus, 1))
    final_readiness = min(100.0, round((final_skill_score * 0.70) + project_bonus + internship_bonus + links_bonus, 1))

    profile.skill_score = final_skill_score
    profile.industry_readiness = final_readiness
    return final_skill_score, final_readiness


def _parse_skills_list(skills_val: Optional[str]) -> list[str]:
    if not skills_val:
        return []
    s = skills_val.strip()
    if s.startswith("[") and s.endswith("]"):
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
    return [item.strip() for item in s.split(",") if item.strip()]


def serialize_profile(user: User, profile: Optional[StudentProfile]) -> dict[str, Any]:
    if not profile:
        return {
            "id": user.id,
            "user_id": user.id,
            "name": user.name,
            "full_name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": "",
            "dob": "",
            "gender": "",
            "college": "",
            "year": None,
            "current_year": None,
            "course": "",
            "course_name": "",
            "branch": "",
            "semester": None,
            "graduation_year": None,
            "target_role": "",
            "preferred_industry": "",
            "preferred_location": "",
            "work_preference": "Hybrid",
            "skills": [],
            "programming_languages": "",
            "tools_technologies": "",
            "experience_level": "Fresher",
            "internship_experience": "",
            "projects": "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
            "bio": "",
            "location": "",
            "resume_headline": "",
            "skill_score": 0.0,
            "industry_readiness": 0.0,
            "profile_completed": False,
            "onboarding_completed": False,
            "interests": [],
            "updated_at": None,
        }

    return {
        "id": user.id,
        "user_id": user.id,
        "name": user.name,
        "full_name": profile.full_name or user.name,
        "email": user.email,
        "role": user.role,
        "phone": profile.phone or "",
        "dob": profile.dob or "",
        "gender": profile.gender or "",
        "college": profile.college or "",
        "year": profile.year,
        "current_year": profile.year,
        "course": profile.course or "",
        "course_name": profile.course or "",
        "branch": profile.branch or "",
        "semester": profile.semester,
        "graduation_year": profile.graduation_year,
        "target_role": profile.target_role or "",
        "preferred_industry": profile.preferred_industry or "",
        "preferred_location": profile.preferred_location or "",
        "work_preference": profile.work_preference or "Hybrid",
        "skills": _parse_skills_list(profile.skills),
        "programming_languages": profile.programming_languages or "",
        "tools_technologies": profile.tools_technologies or "",
        "experience_level": profile.experience_level or "Fresher",
        "internship_experience": profile.internship_experience or "",
        "projects": profile.projects or "",
        "linkedin_url": profile.linkedin_url or "",
        "github_url": profile.github_url or "",
        "portfolio_url": profile.portfolio_url or "",
        "bio": profile.bio or "",
        "location": profile.location or "",
        "resume_headline": profile.resume_headline or "",
        "skill_score": profile.skill_score or 0.0,
        "industry_readiness": profile.industry_readiness or 0.0,
        "profile_completed": bool(profile.profile_completed),
        "onboarding_completed": bool(profile.onboarding_completed),
        "interests": json.loads(profile.interests) if profile.interests else [],
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


# ============================================================
# GET STUDENT PROFILE (Requirement 41)
# ============================================================

@router.get("/profile")
@router.get("/me/profile")
def get_student_profile(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            profile_completed=False,
            onboarding_completed=False,
            skill_score=0.0,
            industry_readiness=0.0,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "success": True,
        "data": serialize_profile(user, profile),
    }


# ============================================================
# UPDATE STUDENT PROFILE (Requirement 41)
# ============================================================

@router.put("/profile")
@router.post("/profile")
@router.put("/me/profile")
@router.post("/me/profile")
def update_student_profile(
    body: ProfileUpdateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id)
        db.add(profile)

    name_val = body.name or body.full_name
    if name_val is not None and name_val.strip():
        user.name = name_val.strip()
        profile.full_name = name_val.strip()
    if body.phone is not None:
        profile.phone = body.phone
    if body.dob is not None:
        profile.dob = body.dob
    if body.gender is not None:
        profile.gender = body.gender
    if body.college is not None:
        profile.college = body.college
    year_val = body.year if body.year is not None else body.current_year
    if year_val is not None:
        profile.year = year_val
    course_val = body.course or body.course_name
    if course_val is not None:
        profile.course = course_val
    if body.branch is not None:
        profile.branch = body.branch
    if body.semester is not None:
        profile.semester = body.semester
    if body.graduation_year is not None:
        profile.graduation_year = body.graduation_year
    if body.target_role is not None:
        profile.target_role = body.target_role
    if body.preferred_industry is not None:
        profile.preferred_industry = body.preferred_industry
    if body.preferred_location is not None:
        profile.preferred_location = body.preferred_location
    if body.work_preference is not None:
        profile.work_preference = body.work_preference
    if body.bio is not None:
        profile.bio = body.bio
    if body.skills is not None:
        profile.skills = ", ".join(body.skills) if isinstance(body.skills, list) else body.skills
    if body.programming_languages is not None:
        profile.programming_languages = ", ".join(body.programming_languages) if isinstance(body.programming_languages, list) else body.programming_languages
    if body.tools_technologies is not None:
        profile.tools_technologies = ", ".join(body.tools_technologies) if isinstance(body.tools_technologies, list) else body.tools_technologies
    if body.experience_level is not None:
        profile.experience_level = body.experience_level
    if body.internship_experience is not None:
        profile.internship_experience = body.internship_experience
    if body.projects is not None:
        profile.projects = body.projects
    if body.linkedin_url is not None:
        profile.linkedin_url = body.linkedin_url
    if body.github_url is not None:
        profile.github_url = body.github_url
    if body.portfolio_url is not None:
        profile.portfolio_url = body.portfolio_url
    if body.location is not None:
        profile.location = body.location
    if body.resume_headline is not None:
        profile.resume_headline = body.resume_headline

    # Mark profile completed if core mandatory fields are provided
    if profile.college and (profile.course or profile.branch) and profile.target_role and (profile.skills or profile.programming_languages):
        profile.profile_completed = True
        profile.onboarding_completed = True

    # Deterministically recalculate real metrics
    recalculate_student_metrics(profile, db)

    db.commit()
    db.refresh(profile)
    db.refresh(user)

    return {
        "success": True,
        "message": "Student profile updated successfully in database",
        "data": serialize_profile(user, profile),
    }


# ============================================================
# STUDENT ONBOARDING (Requirements 10 & 11)
# ============================================================

@router.post("/onboarding")
def complete_student_onboarding(
    body: OnboardingRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id)
        db.add(profile)

    profile.target_role = body.target_role
    profile.interests = json.dumps(body.interests)
    profile.work_preference = body.work_preference or "Hybrid"
    profile.location = body.location or "Pune, Maharashtra"
    if body.college:
        profile.college = body.college
    if body.year:
        profile.year = body.year
    if body.known_skills:
        profile.skills = ", ".join(body.known_skills)

    profile.onboarding_completed = True
    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "message": "Student onboarding completed successfully. Personalized roadmap generated!",
        "data": {
            "onboarding_completed": True,
            "target_role": profile.target_role,
            "interests": body.interests,
            "work_preference": profile.work_preference,
            "location": profile.location,
            "skills": [s.strip() for s in (profile.skills or "").split(",") if s.strip()],
        },
    }


# ============================================================
# CERTIFICATE UPLOAD (With Cryptographic SHA-256 Hash & States)
# ============================================================

@router.post("/certificates/upload")
def upload_certificate(
    body: CertificateUploadRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    # Store uploaded certificate
    cert = StudentUploadedCertificate(
        user_id=user.id,
        title=body.title,
        issuing_organization=body.issuing_organization,
        issue_date=body.issue_date or "2026",
        credential_id=body.credential_id or f"CERT-{user.id}-{body.file_hash_sha256[:8].upper()}",
        credential_url=body.credential_url,
        file_hash_sha256=body.file_hash_sha256,
        verification_status="PENDING",
    )
    db.add(cert)

    # Also register in administrative entity verifications for review
    entity_v = EntityVerification(
        user_id=user.id,
        entity_type="student",
        entity_name=f"{user.name} - {body.title}",
        document_type="Student Skill Certificate",
        document_id=cert.credential_id,
        status="PENDING",
        reviewer_notes=f"SHA-256: {body.file_hash_sha256} | Issuer: {body.issuing_organization}",
    )
    db.add(entity_v)
    db.commit()
    db.refresh(cert)

    return {
        "success": True,
        "message": "Certificate submitted successfully. Under verification by SARATHI authority.",
        "data": {
            "id": cert.id,
            "title": cert.title,
            "issuing_organization": cert.issuing_organization,
            "credential_id": cert.credential_id,
            "file_hash_sha256": cert.file_hash_sha256,
            "verification_status": cert.verification_status,
            "created_at": cert.created_at.isoformat(),
        },
    }


@router.get("/certificates/uploaded")
def list_uploaded_certificates(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    certs = (
        db.query(StudentUploadedCertificate)
        .filter(StudentUploadedCertificate.user_id == user_id)
        .order_by(StudentUploadedCertificate.created_at.desc())
        .all()
    )

    data = [
        {
            "id": c.id,
            "title": c.title,
            "issuing_organization": c.issuing_organization,
            "credential_id": c.credential_id,
            "credential_url": c.credential_url,
            "file_hash_sha256": c.file_hash_sha256,
            "verification_status": c.verification_status,
            "rejection_reason": c.rejection_reason,
            "verified_at": c.verified_at.isoformat() if c.verified_at else None,
            "created_at": c.created_at.isoformat(),
        }
        for c in certs
    ]

    return {"success": True, "count": len(data), "data": data}



# ============================================================
# STUDENT DASHBOARD AGGREGATE
# ============================================================

@router.get("/me/dashboard")
@router.get("/dashboard")
def get_my_student_dashboard(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile and (profile.skills or profile.programming_languages) and profile.skill_score == 0.0:
        recalculate_student_metrics(profile, db)
        db.commit()

    # Enrolled courses with modules and progress
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.user_id == user.id).all()
    enrolled_courses = []
    for enr in enrollments:
        course = db.query(Course).filter(Course.id == enr.course_id).first() if enr.course_id else None
        if course:
            modules = db.query(CourseModule).filter(CourseModule.course_id == course.id).order_by(CourseModule.order_num).all()
            module_list = []
            for m in modules:
                prog = db.query(CourseProgress).filter(
                    CourseProgress.enrollment_id == enr.id,
                    CourseProgress.module_id == m.id,
                ).first()
                module_list.append({
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "order_num": m.order_num,
                    "duration_hours": m.duration_hours,
                    "completed": prog.is_completed if prog else False,
                    "score": prog.score if prog else 0.0,
                })

            enrolled_courses.append({
                "enrollment_id": enr.id,
                "course_id": course.id,
                "name": course.name,
                "status": enr.status,
                "attendance_percentage": enr.attendance_percentage,
                "progress_percentage": enr.progress_percentage,
                "grade": enr.grade,
                "modules": module_list,
            })
        elif enr.external_course_title:
            enrolled_courses.append({
                "enrollment_id": enr.id,
                "course_id": None,
                "name": enr.external_course_title,
                "status": enr.status,
                "attendance_percentage": enr.attendance_percentage,
                "progress_percentage": enr.progress_percentage,
                "grade": enr.grade,
                "modules": [],
            })

    # Skill gaps
    skill_gaps = db.query(StudentSkillGap).filter(StudentSkillGap.user_id == user.id).all()
    gaps_data = [
        {
            "id": g.id,
            "skill_name": g.skill_name,
            "current_score": g.current_score,
            "required_score": g.required_score,
            "gap_score": g.gap_score,
            "priority": g.priority,
            "recommended_course": g.recommended_course,
        }
        for g in skill_gaps
    ]

    # Certificates
    certificates = db.query(Certificate).filter(Certificate.user_id == user.id).all()
    certs_data = [
        {
            "id": c.id,
            "certificate_number": c.certificate_number,
            "course_name": c.course_name,
            "institute_name": c.institute_name,
            "issue_date": c.issue_date.strftime("%d %B %Y") if c.issue_date else "",
            "grade": c.grade,
            "skills": c.skills,
            "status": c.status,
            "verification_code": c.verification_code,
        }
        for c in certificates
    ]

    # Applications
    applications = db.query(JobApplication).filter(JobApplication.user_id == user.id).all()
    apps_data = []
    for app in applications:
        job = db.query(JobPosting).filter(JobPosting.id == app.job_id).first()
        apps_data.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Software Engineer",
            "company_name": job.company_name if job else "Tech Corp",
            "status": app.status,
            "applied_at": app.applied_at.strftime("%d %b %Y") if app.applied_at else "",
        })

    # Latest assessment attempt
    latest_attempt = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == user.id)
        .order_by(AssessmentAttempt.created_at.desc())
        .first()
    )

    return {
        "success": True,
        "data": {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
            "profile": serialize_profile(user, profile),
            "enrolled_courses": enrolled_courses,
            "skill_gaps": gaps_data,
            "certificates": certs_data,
            "applications": apps_data,
            "latest_assessment": {
                "id": latest_attempt.id,
                "total_score": latest_attempt.total_score,
                "percentage": latest_attempt.percentage,
                "passed": latest_attempt.passed,
                "date": latest_attempt.created_at.strftime("%d %b %Y"),
            } if latest_attempt else None,
        },
    }


# ============================================================
# SCHEMAS FOR COURSE PROGRESS & PLANNER
# ============================================================

class TargetCompletionDateRequest(BaseModel):
    target_date: str


class ToggleModuleRequest(BaseModel):
    module_id: int


def calculate_user_study_stats(db: Session, user_id: int) -> dict:
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    seven_days_ago = now - timedelta(days=7)

    sessions = db.query(StudySession).filter(StudySession.user_id == user_id).all()
    total_seconds = sum(s.duration_seconds for s in sessions if s.duration_seconds)
    today_seconds = sum(s.duration_seconds for s in sessions if s.started_at >= today_start and s.duration_seconds)
    week_seconds = sum(s.duration_seconds for s in sessions if s.started_at >= seven_days_ago and s.duration_seconds)

    # Active study dates where duration_seconds > 0
    active_dates = set()
    for s in sessions:
        if s.duration_seconds and s.duration_seconds > 0 and s.started_at:
            active_dates.add(s.started_at.date())

    today_date = now.date()
    yesterday_date = today_date - timedelta(days=1)

    streak = 0
    if today_date in active_dates:
        curr = today_date
        while curr in active_dates:
            streak += 1
            curr -= timedelta(days=1)
    elif yesterday_date in active_dates:
        curr = yesterday_date
        while curr in active_dates:
            streak += 1
            curr -= timedelta(days=1)

    return {
        "total_seconds": total_seconds,
        "total_hours": round(total_seconds / 3600.0, 1),
        "today_seconds": today_seconds,
        "today_hours": round(today_seconds / 3600.0, 1),
        "week_seconds": week_seconds,
        "week_hours": round(week_seconds / 3600.0, 1),
        "streak_days": streak,
        "total_sessions": len(sessions),
    }


def calculate_student_course_progress(db: Session, user_id: int, course_id_param: Optional[int] = None):
    from datetime import datetime, timedelta

    # 1. Get student profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # 2. Get active enrollment
    if course_id_param:
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.user_id == user_id,
            CourseEnrollment.course_id == course_id_param,
        ).first()
    else:
        # Prefer enrollment with progress > 0, else latest
        enrollment = (
            db.query(CourseEnrollment)
            .filter(CourseEnrollment.user_id == user_id, CourseEnrollment.progress_percentage > 0)
            .first()
        )
        if not enrollment:
            enrollment = (
                db.query(CourseEnrollment)
                .filter(CourseEnrollment.user_id == user_id)
                .order_by(CourseEnrollment.enrolled_at.desc())
                .first()
            )

    if not enrollment:
        stats = calculate_user_study_stats(db, user_id)
        return {
            "has_enrollment": False,
            "enrollment_id": None,
            "course_id": None,
            "course_name": None,
            "completion_percentage": 0.0,
            "completed_lessons": 0,
            "total_lessons": 0,
            "completed_hours": 0.0,
            "remaining_hours": 0.0,
            "total_hours": 0.0,
            "recommended_daily_hours": 0.0,
            "target_completion_date": profile.target_completion_date if profile else None,
            "days_remaining": 0,
            "pace_status": "NOT_STARTED",
            "streak_days": stats["streak_days"],
            "today_study_hours": stats["today_hours"],
            "total_study_hours": stats["total_hours"],
            "modules": [],
            "daily_plan": [],
            "weekly_plan": [],
        }

    course = db.query(Course).filter(Course.id == enrollment.course_id).first() if enrollment.course_id else None
    course_name = course.name if course else (enrollment.external_course_title or "Enrolled Course")
    course_id = course.id if course else None

    # 3. Get course modules
    modules = (
        db.query(CourseModule)
        .filter(CourseModule.course_id == course_id)
        .order_by(CourseModule.order_num)
        .all()
    ) if course_id else []

    if modules:
        total_lessons = len(modules)
        total_hours = sum(m.duration_hours for m in modules) or 40.0
        completed_lessons = 0
        completed_hours = 0
        module_details = []

        for m in modules:
            prog = (
                db.query(CourseProgress)
                .filter(
                    CourseProgress.enrollment_id == enrollment.id,
                    CourseProgress.module_id == m.id,
                )
                .first()
            )
            is_done = bool(prog and prog.is_completed)
            if is_done:
                completed_lessons += 1
                completed_hours += m.duration_hours
            module_details.append({
                "id": m.id,
                "title": m.title,
                "duration_hours": m.duration_hours,
                "completed": is_done,
            })

        remaining_hours = max(0, total_hours - completed_hours)
        completion_percentage = round((completed_hours / total_hours * 100), 1) if total_hours > 0 else 0.0
    else:
        total_lessons = 4
        total_hours = 40.0
        completion_percentage = enrollment.progress_percentage
        completed_lessons = int(round((completion_percentage / 100.0) * 4))
        completed_hours = round(total_hours * (completion_percentage / 100.0), 1)
        remaining_hours = max(0.0, total_hours - completed_hours)
        module_details = [
            {"id": 1, "title": "Milestone 1: Foundations & Architecture", "duration_hours": 10.0, "completed": completion_percentage >= 25.0},
            {"id": 2, "title": "Milestone 2: Core Engineering & Implementation", "duration_hours": 10.0, "completed": completion_percentage >= 50.0},
            {"id": 3, "title": "Milestone 3: Advanced Optimization & Scaling", "duration_hours": 10.0, "completed": completion_percentage >= 75.0},
            {"id": 4, "title": "Milestone 4: Production Evaluation & Capstone", "duration_hours": 10.0, "completed": completion_percentage >= 100.0},
        ]

    # Sync enrollment progress_percentage in DB
    if enrollment and enrollment.progress_percentage != completion_percentage:
        enrollment.progress_percentage = completion_percentage
        db.commit()

    # 5. Target completion date & pacing
    target_str = profile.target_completion_date
    now = datetime.utcnow()
    target_dt = None
    if target_str:
        try:
            target_dt = datetime.strptime(target_str, "%Y-%m-%d")
        except ValueError:
            target_dt = None

    if not target_dt or target_dt.date() <= now.date():
        target_dt = now + timedelta(days=45)
        target_str = target_dt.strftime("%Y-%m-%d")
        profile.target_completion_date = target_str
        db.commit()

    days_remaining = max(1, (target_dt.date() - now.date()).days)
    recommended_daily_hours = round(remaining_hours / days_remaining, 1) if remaining_hours > 0 else 0.0

    # Pacing calculation
    total_expected_days = 90
    days_elapsed = max(1, total_expected_days - days_remaining)
    expected_pct = min(100.0, (days_elapsed / total_expected_days) * 100.0)

    if completion_percentage >= expected_pct + 8:
        pace_status = "AHEAD"
    elif completion_percentage < expected_pct - 10:
        pace_status = "BEHIND"
    else:
        pace_status = "ON_TRACK"

    # Daily Schedule (next 7 days)
    days_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily_plan = []
    uncompleted_mods = [m for m in module_details if not m["completed"]]
    curr_mod_idx = 0

    for i in range(7):
        day_date = now + timedelta(days=i)
        day_name = days_name[day_date.weekday()]
        mod_for_day = uncompleted_mods[curr_mod_idx % len(uncompleted_mods)]["title"] if uncompleted_mods else "Final Capstone & Industry Project"
        daily_plan.append({
            "day": day_name,
            "date": day_date.strftime("%d %b"),
            "module_title": mod_for_day,
            "duration_hours": recommended_daily_hours or 1.5,
            "completed": (i == 0 and completed_lessons > 0),
        })
        if i % 2 == 1 and uncompleted_mods:
            curr_mod_idx += 1

    # Weekly Plan
    weekly_plan = [
        {
            "week_number": 1,
            "week_title": "Core Foundations & Architecture",
            "target_hours": 20,
            "completed_hours": min(20, completed_hours),
            "status": "COMPLETED" if completed_hours >= 20 else "CURRENT",
        },
        {
            "week_number": 2,
            "week_title": "Databases & Data Modeling",
            "target_hours": 25,
            "completed_hours": 25 if completed_hours >= 45 else max(0, completed_hours - 20),
            "status": "COMPLETED" if completed_hours >= 45 else ("CURRENT" if completed_hours >= 20 else "UPCOMING"),
        },
        {
            "week_number": 3,
            "week_title": "REST APIs & Asynchronous Microservices",
            "target_hours": 30,
            "completed_hours": max(0, min(30, completed_hours - 45)),
            "status": "COMPLETED" if completed_hours >= 75 else ("CURRENT" if completed_hours >= 45 else "UPCOMING"),
        },
        {
            "week_number": 4,
            "week_title": "Full-Stack UI Integration & State Management",
            "target_hours": 35,
            "completed_hours": max(0, min(35, completed_hours - 75)),
            "status": "COMPLETED" if completed_hours >= 110 else ("CURRENT" if completed_hours >= 75 else "UPCOMING"),
        },
        {
            "week_number": 5,
            "week_title": "DevOps, Docker Containerization & Production CI/CD",
            "target_hours": 20,
            "completed_hours": max(0, min(20, completed_hours - 110)),
            "status": "COMPLETED" if completed_hours >= 130 else ("CURRENT" if completed_hours >= 110 else "UPCOMING"),
        },
    ]

    study_stats = calculate_user_study_stats(db, user_id)
    real_streak = study_stats["streak_days"]
    if real_streak == 0 and completed_lessons > 0:
        real_streak = 1

    return {
        "has_enrollment": True,
        "enrollment_id": enrollment.id,
        "course_id": course_id,
        "course_name": course_name,
        "completion_percentage": completion_percentage,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "completed_hours": completed_hours,
        "remaining_hours": remaining_hours,
        "total_hours": total_hours,
        "recommended_daily_hours": recommended_daily_hours,
        "target_completion_date": target_str,
        "days_remaining": days_remaining,
        "pace_status": pace_status,
        "streak_days": real_streak,
        "today_study_hours": study_stats["today_hours"],
        "total_study_hours": study_stats["total_hours"],
        "modules": module_details,
        "daily_plan": daily_plan,
        "weekly_plan": weekly_plan,
    }


# ============================================================
# DYNAMIC COURSE PROGRESS & PLANNER (Requirement 6)
# ============================================================

@router.get("/me/course-progress")
def get_my_course_progress(
    course_id: Optional[int] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    progress_data = calculate_student_course_progress(db, user_id, course_id)
    return {"success": True, "data": progress_data}


@router.post("/me/target-completion-date")
def set_target_completion_date(
    body: TargetCompletionDateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    user_id = get_optional_user_id(authorization, db)
    try:
        dt = datetime.strptime(body.target_date, "%Y-%m-%d")
        if dt.date() <= datetime.utcnow().date():
            raise HTTPException(status_code=400, detail="Target completion date must be in the future")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)

    profile.target_completion_date = body.target_date
    db.commit()

    updated = calculate_student_course_progress(db, user_id)
    return {
        "success": True,
        "message": f"Target completion date updated to {body.target_date}. Daily study recommendation adjusted.",
        "data": updated,
    }


@router.post("/me/toggle-module-complete")
def toggle_module_complete(
    body: ToggleModuleRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    module = db.query(CourseModule).filter(CourseModule.id == body.module_id).first()
    enrollment = None
    if module:
        enrollment = (
            db.query(CourseEnrollment)
            .filter(
                CourseEnrollment.user_id == user_id,
                CourseEnrollment.course_id == module.course_id,
            )
            .first()
        )
    if not enrollment:
        enrollment = (
            db.query(CourseEnrollment)
            .filter(CourseEnrollment.user_id == user_id, CourseEnrollment.progress_percentage > 0)
            .first()
        )
    if not enrollment:
        enrollment = (
            db.query(CourseEnrollment)
            .filter(CourseEnrollment.user_id == user_id)
            .order_by(CourseEnrollment.enrolled_at.desc())
            .first()
        )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Active course enrollment not found")

    prog = (
        db.query(CourseProgress)
        .filter(
            CourseProgress.enrollment_id == enrollment.id,
            CourseProgress.module_id == body.module_id,
        )
        .first()
    )
    if not prog:
        prog = CourseProgress(
            enrollment_id=enrollment.id,
            module_id=body.module_id,
            is_completed=True,
            score=95.0,
        )
        db.add(prog)
    else:
        prog.is_completed = not prog.is_completed

    db.commit()

    updated = calculate_student_course_progress(db, user_id)
    return {
        "success": True,
        "message": "Module status updated in database.",
        "data": updated,
    }


# ============================================================
# STUDY SESSIONS & ACTIVE TIME TRACKING
# ============================================================

@router.post("/me/study/start")
def start_study_session(
    body: StartStudyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    user_id = get_optional_user_id(authorization, db)
    session = StudySession(
        user_id=user_id,
        course_id=body.course_id,
        module_id=body.module_id,
        lesson_id=body.lesson_id,
        activity_type=body.activity_type or "LESSON",
        started_at=datetime.utcnow(),
        duration_seconds=0,
        is_completed=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "message": "Study session initiated.",
        "data": {
            "session_id": session.id,
            "course_id": session.course_id,
            "started_at": session.started_at.isoformat(),
        },
    }


@router.post("/me/study/heartbeat")
def study_session_heartbeat(
    body: StudyHeartbeatRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    session = db.query(StudySession).filter(StudySession.id == body.session_id, StudySession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")

    session.duration_seconds = max(session.duration_seconds, body.duration_seconds)
    db.commit()

    return {
        "success": True,
        "session_id": session.id,
        "duration_seconds": session.duration_seconds,
    }


@router.post("/me/study/complete")
def complete_study_session(
    body: CompleteStudyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    user_id = get_optional_user_id(authorization, db)
    session = db.query(StudySession).filter(StudySession.id == body.session_id, StudySession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")

    session.duration_seconds = max(session.duration_seconds, body.duration_seconds)
    session.completed_at = datetime.utcnow()
    session.is_completed = True

    # If module_id was assigned and session completed, ensure module progress recorded
    if session.module_id:
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.user_id == user_id,
            CourseEnrollment.course_id == session.course_id,
        ).first()
        if enrollment:
            prog = db.query(CourseProgress).filter(
                CourseProgress.enrollment_id == enrollment.id,
                CourseProgress.module_id == session.module_id,
            ).first()
            if not prog:
                prog = CourseProgress(
                    enrollment_id=enrollment.id,
                    module_id=session.module_id,
                    is_completed=True,
                    score=100.0,
                )
                db.add(prog)
            else:
                prog.is_completed = True

    db.commit()

    stats = calculate_user_study_stats(db, user_id)
    return {
        "success": True,
        "message": "Study session completed and logged.",
        "data": {
            "session_id": session.id,
            "duration_seconds": session.duration_seconds,
            "stats": stats,
        },
    }


@router.get("/me/study/stats")
def get_study_stats(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    stats = calculate_user_study_stats(db, user_id)
    return {"success": True, "data": stats}


# ============================================================
# LIST STUDENTS (For Institute / Trainer / Employer / Admin)
# ============================================================

@router.get("/")
def get_all_students(
    search: Optional[str] = None,
    course: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "student")
    users = query.all()

    results = []
    for u in users:
        p = db.query(StudentProfile).filter(StudentProfile.user_id == u.id).first()
        student_data = {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "course": p.course if p else "Computer Science",
            "year": p.year if p else 3,
            "college": p.college if p else "Engineering College",
            "skill_score": p.skill_score if p else 75.0,
            "industry_readiness": p.industry_readiness if p else 70.0,
            "status": "Industry Ready" if (p and p.industry_readiness >= 80) else ("Developing" if (p and p.industry_readiness >= 65) else "Needs Training"),
            "skills": [s.strip() for s in (p.skills or "").split(",") if s.strip()] if p else ["Python", "SQL"],
            "target_role": p.target_role if p else "Software Engineer",
            "location": p.location if p else "Pune, Maharashtra",
        }

        if search:
            s_lower = search.lower()
            if (
                s_lower not in student_data["name"].lower()
                and s_lower not in student_data["email"].lower()
                and not any(s_lower in sk.lower() for sk in student_data["skills"])
            ):
                continue

        if course and course.lower() not in student_data["course"].lower():
            continue

        results.append(student_data)

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


@router.get("/{student_id}")
def get_student_by_id(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    p = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    return {
        "success": True,
        "data": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "course": p.course if p else "Computer Science",
            "year": p.year if p else 3,
            "college": p.college if p else "Engineering College",
            "skill_score": p.skill_score if p else 75.0,
            "industry_readiness": p.industry_readiness if p else 70.0,
            "skills": [s.strip() for s in (p.skills or "").split(",") if s.strip()] if p else [],
            "target_role": p.target_role if p else "Developer",
        },
    }


# ============================================================
# PERSONALIZED 4-PHASE LEARNING ROADMAP (SIH-134 REAL DATA)
# ============================================================

class RoadmapEnrollRequest(BaseModel):
    course_title: str
    provider: Optional[str] = "Coursera"


class DirectProgressUpdateRequest(BaseModel):
    progress_percentage: float


@router.get("/me/roadmap")
@router.get("/roadmap")
def get_student_roadmap(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    target_role = (profile.target_role if profile and profile.target_role else "Full Stack Developer").strip()

    # Map existing enrollments
    user_enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.user_id == user.id).all()
    enrolled_by_name: dict[str, CourseEnrollment] = {}
    for e in user_enrollments:
        if e.external_course_title:
            enrolled_by_name[e.external_course_title.lower().strip()] = e
        if e.course_id:
            c = db.query(Course).filter(Course.id == e.course_id).first()
            if c:
                enrolled_by_name[c.name.lower().strip()] = e

    from .real_data import _cached_csv
    try:
        coursera_rows = list(_cached_csv("Coursera_catalog.csv"))
    except Exception:
        coursera_rows = []
    try:
        datacamp_rows = list(_cached_csv("datacamp_courses.csv"))
    except Exception:
        datacamp_rows = []

    cand_skills_raw = ((profile.skills or "") + "," + (profile.programming_languages or "")) if profile else ""
    cand_tokens = [s.strip().lower() for s in cand_skills_raw.split(",") if s.strip()]
    cand_set = set(cand_tokens)

    def find_courses(keywords: list[str], limit: int = 3) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        seen_titles = set()
        for c in coursera_rows:
            title = c.get("course_title", "").strip()
            skills = c.get("course_skills", "").lower()
            t_lower = title.lower()
            if any(k.lower() in t_lower or k.lower() in skills for k in keywords):
                if title not in seen_titles:
                    seen_titles.add(title)
                    enr = enrolled_by_name.get(t_lower)
                    results.append({
                        "title": title,
                        "provider": "Coursera",
                        "organization": c.get("course_organization", "Accredited University"),
                        "difficulty": c.get("course_difficulty", "Beginner"),
                        "rating": c.get("course_rating", "4.8"),
                        "url": c.get("course_url", "https://coursera.org"),
                        "is_enrolled": enr is not None,
                        "enrollment_id": enr.id if enr else None,
                        "progress_percentage": enr.progress_percentage if enr else 0.0,
                        "status": enr.status if enr else "AVAILABLE",
                    })
                    if len(results) >= limit:
                        break

        if len(results) < limit:
            for d in datacamp_rows:
                title = d.get("course_name", "").strip()
                topic = d.get("topic", "").lower()
                tech = d.get("technology", "").lower()
                t_lower = title.lower()
                if any(k.lower() in t_lower or k.lower() in topic or k.lower() in tech for k in keywords):
                    if title not in seen_titles:
                        seen_titles.add(title)
                        enr = enrolled_by_name.get(t_lower)
                        results.append({
                            "title": title,
                            "provider": "DataCamp",
                            "organization": "DataCamp Professional Track",
                            "difficulty": d.get("topic", "Intermediate"),
                            "rating": "4.7",
                            "url": d.get("link", "https://datacamp.com"),
                            "is_enrolled": enr is not None,
                            "enrollment_id": enr.id if enr else None,
                            "progress_percentage": enr.progress_percentage if enr else 0.0,
                            "status": enr.status if enr else "AVAILABLE",
                        })
                        if len(results) >= limit:
                            break
        return results

    role_lower = target_role.lower()
    if "ai" in role_lower or "machine" in role_lower or "data science" in role_lower:
        p1_keys = ["python", "statistics", "mathematics"]
        p2_keys = ["data analysis", "pandas", "machine learning"]
        p3_keys = ["deep learning", "neural network", "tensorflow", "pytorch"]
        p4_keys = ["mlops", "generative ai", "large language", "capstone"]
    elif "cloud" in role_lower or "devops" in role_lower:
        p1_keys = ["linux", "python", "networking"]
        p2_keys = ["aws", "cloud", "azure", "docker"]
        p3_keys = ["kubernetes", "terraform", "ci/cd", "devops"]
        p4_keys = ["cloud architect", "security", "microservices"]
    else:
        p1_keys = ["python", "javascript", "sql", "git"]
        p2_keys = ["react", "web development", "backend", "api"]
        p3_keys = ["fastapi", "database", "docker", "cloud"]
        p4_keys = ["full stack", "software engineering", "system design", "capstone"]

    p1_courses = find_courses(p1_keys, limit=3)
    p2_courses = find_courses(p2_keys, limit=3)
    p3_courses = find_courses(p3_keys, limit=3)
    p4_courses = find_courses(p4_keys, limit=3)

    phases = [
        {
            "phase_number": 1,
            "phase_title": "Phase 1: Foundations & Core Architecture",
            "focus_area": "Foundational programming languages, standard data structures, and database principles.",
            "duration": "Weeks 1 – 4 (40 Hours)",
            "targeted_skills": [k.title() for k in p1_keys],
            "courses": p1_courses,
            "status": "COMPLETED" if any(k in cand_set for k in p1_keys) else "IN_PROGRESS",
            "milestone": "Baseline Competency Assessment Passed",
        },
        {
            "phase_number": 2,
            "phase_title": "Phase 2: Core Engineering & Frameworks",
            "focus_area": f"Professional frameworks, API integrations, and workflows for {target_role}.",
            "duration": "Weeks 5 – 8 (50 Hours)",
            "targeted_skills": [k.title() for k in p2_keys],
            "courses": p2_courses,
            "status": "IN_PROGRESS" if any(k in cand_set for k in p1_keys) else "UPCOMING",
            "milestone": "Full Module Mini-Project Deployed",
        },
        {
            "phase_number": 3,
            "phase_title": "Phase 3: Advanced Specialization & Cloud Scaling",
            "focus_area": "Distributed systems, cloud deployment, and containerized orchestration.",
            "duration": "Weeks 9 – 12 (60 Hours)",
            "targeted_skills": [k.title() for k in p3_keys],
            "courses": p3_courses,
            "status": "UPCOMING",
            "milestone": "End-to-End System Evaluation & Security Audit",
        },
        {
            "phase_number": 4,
            "phase_title": "Phase 4: Production Capstone & Industry Placement",
            "focus_area": "Comprehensive industry-grade capstone project, portfolio verification, and hiring readiness.",
            "duration": "Weeks 13 – 16 (50 Hours)",
            "targeted_skills": [k.title() for k in p4_keys],
            "courses": p4_courses,
            "status": "UPCOMING",
            "milestone": "National Skill Credential Issuance & Direct Employer Matching",
        },
    ]

    return {
        "success": True,
        "student_id": user.id,
        "student_name": user.name,
        "target_role": target_role,
        "known_skills": list(cand_set),
        "total_phases": 4,
        "roadmap": phases,
    }


@router.post("/me/roadmap/enroll")
def enroll_roadmap_course(
    body: RoadmapEnrollRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == user.id,
        CourseEnrollment.external_course_title == body.course_title,
    ).first()

    if existing:
        return {
            "success": True,
            "message": f"Already enrolled in {existing.external_course_title}",
            "data": {
                "enrollment_id": existing.id,
                "course_title": existing.external_course_title,
                "provider": existing.provider,
                "progress_percentage": existing.progress_percentage,
                "status": existing.status,
            },
        }

    enrollment = CourseEnrollment(
        user_id=user.id,
        course_id=None,
        external_course_title=body.course_title,
        provider=body.provider or "Coursera",
        status="IN_PROGRESS",
        attendance_percentage=100.0,
        progress_percentage=0.0,
        grade="In Progress",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": f"Successfully enrolled in {body.course_title}",
        "data": {
            "enrollment_id": enrollment.id,
            "course_title": enrollment.external_course_title,
            "provider": enrollment.provider,
            "progress_percentage": 0.0,
            "status": enrollment.status,
        },
    }


@router.put("/me/progress/{enrollment_id}")
@router.post("/me/progress/{enrollment_id}")
def update_enrollment_progress(
    enrollment_id: int,
    body: DirectProgressUpdateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.id == enrollment_id,
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    user_id = enrollment.user_id

    new_pct = max(0.0, min(100.0, round(body.progress_percentage, 1)))
    enrollment.progress_percentage = new_pct

    certificate_issued = False
    cert_code = None

    if new_pct >= 100.0:
        enrollment.status = "Completed"
        enrollment.grade = "A+"
        from datetime import datetime
        enrollment.completed_at = datetime.utcnow()

        course_title = enrollment.external_course_title
        if not course_title and enrollment.course_id:
            c = db.query(Course).filter(Course.id == enrollment.course_id).first()
            if c:
                course_title = c.name
        if not course_title:
            course_title = "Technical Competency Program"

        # Check if already issued
        existing_cert = db.query(Certificate).filter(
            Certificate.user_id == user_id,
            Certificate.course_name == course_title,
        ).first()

        if not existing_cert:
            user = db.query(User).filter(User.id == user_id).first()
            cert_code = f"SARATHI-CERT-2026-{user_id:03d}{enrollment.id:02d}"
            db.add(Certificate(
                certificate_number=cert_code,
                user_id=user_id,
                course_id=enrollment.course_id,
                institute_name="National Skill Training Institute, Ministry of Skill Development",
                trainer_name="Prof. Rajesh Verma",
                student_name=user.name if user else "Certified Scholar",
                course_name=course_title,
                grade="A+",
                skills="Full Stack Development & System Competencies",
                verification_code=cert_code,
                status="Verified",
            ))
            db.add(VerificationRecord(
                certificate_code=cert_code,
                is_valid=True,
                verifier_info="Automated Completion Verification System",
            ))
            certificate_issued = True

    # Recalculate metrics
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if profile:
        recalculate_student_metrics(profile, db)

    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": f"Course progress updated to {new_pct}%" + (" · Official Certificate Issued!" if certificate_issued else ""),
        "data": {
            "enrollment_id": enrollment.id,
            "progress_percentage": enrollment.progress_percentage,
            "status": enrollment.status,
            "grade": enrollment.grade,
            "certificate_issued": certificate_issued,
            "certificate_number": cert_code,
        },
    }