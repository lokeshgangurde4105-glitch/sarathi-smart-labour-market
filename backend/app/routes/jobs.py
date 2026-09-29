from datetime import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    StudentProfile,
    JobPosting,
    JobApplication,
    CandidateJobMatch,
    PlacementOutcome,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class JobCreateRequest(BaseModel):
    title: str
    company_name: str
    location: Optional[str] = "Pune, Maharashtra"
    job_type: Optional[str] = "Full Time"
    experience: Optional[str] = "0-2 Years"
    experience_level: Optional[str] = None
    vacancies: Optional[int] = 5
    salary_range: Optional[str] = "₹4.5 - 7.5 LPA"
    description: Optional[str] = None
    required_skills: Optional[str] = None
    skills: Optional[Any] = None


class JobApplyRequest(BaseModel):
    cover_note: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


# ============================================================
# LIST JOBS (Requirement 47)
# ============================================================

@router.get("/")
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(JobPosting).filter(JobPosting.status == "Active")
    jobs = query.order_by(JobPosting.created_at.desc()).all()

    result = []
    for j in jobs:
        skill_list = [s.strip() for s in (j.required_skills or "").split(",") if s.strip()]
        applicants_count = db.query(JobApplication).filter(JobApplication.job_id == j.id).count()

        item = {
            "id": j.id,
            "title": j.title,
            "company": j.company_name,
            "company_name": j.company_name,
            "location": j.location,
            "job_type": j.job_type,
            "experience": j.experience,
            "vacancies": j.vacancies,
            "salary_range": j.salary_range,
            "description": j.description,
            "skills": skill_list,
            "required_skills": skill_list,
            "applicants_count": applicants_count,
            "posted_date": j.created_at.strftime("%d %b %Y"),
        }

        if search:
            s_lower = search.lower()
            if (
                s_lower not in j.title.lower()
                and s_lower not in j.company_name.lower()
                and not any(s_lower in sk.lower() for sk in skill_list)
            ):
                continue

        if location and location.lower() not in j.location.lower():
            continue

        if job_type and job_type.lower() not in j.job_type.lower():
            continue

        result.append(item)

    return {
        "success": True,
        "count": len(result),
        "data": result,
    }


# ============================================================
# GET SINGLE JOB
# ============================================================

@router.get("/{job_id}")
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    j = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")

    skill_list = [s.strip() for s in (j.required_skills or "").split(",") if s.strip()]
    applicants_count = db.query(JobApplication).filter(JobApplication.job_id == j.id).count()

    return {
        "success": True,
        "data": {
            "id": j.id,
            "title": j.title,
            "company_name": j.company_name,
            "location": j.location,
            "job_type": j.job_type,
            "experience": j.experience,
            "vacancies": j.vacancies,
            "salary_range": j.salary_range,
            "description": j.description,
            "required_skills": skill_list,
            "applicants_count": applicants_count,
            "posted_date": j.created_at.strftime("%d %b %Y"),
        },
    }


# ============================================================
# CREATE JOB (Requirement 47)
# ============================================================

@router.post("/")
@router.post("")
@router.post("/post")
def create_job(
    body: JobCreateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)

    # Format skills
    raw_skills = body.required_skills
    if not raw_skills and body.skills is not None:
        if isinstance(body.skills, list):
            raw_skills = ", ".join(str(s) for s in body.skills)
        else:
            raw_skills = str(body.skills)
    if not raw_skills:
        raw_skills = "Python, SQL, Machine Learning"

    exp = body.experience or body.experience_level or "0-2 Years"

    job = JobPosting(
        employer_user_id=user_id,
        title=body.title.strip(),
        company_name=body.company_name.strip(),
        location=body.location or "Pune, Maharashtra",
        job_type=body.job_type or "Full Time",
        experience=exp,
        vacancies=body.vacancies or 1,
        salary_range=body.salary_range or "₹4.5 - 7.5 LPA",
        description=body.description or f"Job position for {body.title.strip()} at {body.company_name.strip()}",
        required_skills=raw_skills,
        status="Active",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    skill_list = [s.strip() for s in job.required_skills.split(",") if s.strip()]

    return {
        "success": True,
        "message": "Job posted and stored in database successfully",
        "data": {
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "location": job.location,
            "required_skills": skill_list,
            "skills": skill_list,
        },
    }


# ============================================================
# CANDIDATE MATCHING ENGINE (Requirement 47)
# ============================================================

@router.get("/{job_id}/matches")
def get_job_candidate_matches(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_skills = [s.strip().lower() for s in (job.required_skills or "").split(",") if s.strip()]

    # Query all students from DB
    students = db.query(User).filter(User.role == "student").all()
    candidates_ranked = []

    for s in students:
        p = db.query(StudentProfile).filter(StudentProfile.user_id == s.id).first()
        student_skills = []
        if p and p.skills:
            student_skills = [sk.strip().lower() for sk in p.skills.split(",") if sk.strip()]

        matching = [sk for sk in job_skills if sk in student_skills]
        missing = [sk for sk in job_skills if sk not in student_skills]

        # Calculate match percentage
        skill_ratio = len(matching) / max(len(job_skills), 1)
        readiness_score = (p.industry_readiness if p else 70.0) / 100.0

        match_pct = round((skill_ratio * 70.0) + (readiness_score * 30.0), 1)
        match_pct = min(98.5, max(40.0, match_pct))

        # Check existing application status if any
        app = db.query(JobApplication).filter(
            JobApplication.job_id == job.id,
            JobApplication.user_id == s.id,
        ).first()

        # Update candidate match in DB
        existing_match = db.query(CandidateJobMatch).filter(
            CandidateJobMatch.job_id == job.id,
            CandidateJobMatch.user_id == s.id,
        ).first()

        if existing_match:
            existing_match.match_percentage = match_pct
            existing_match.matching_skills = ", ".join(matching)
            existing_match.missing_skills = ", ".join(missing)
        else:
            db.add(CandidateJobMatch(
                job_id=job.id,
                user_id=s.id,
                match_percentage=match_pct,
                matching_skills=", ".join(matching),
                missing_skills=", ".join(missing),
            ))

        # Privacy Filter: Mask email in talent pool discovery until shortlisted/interviewed
        is_contact_revealed = app is not None and app.status in ["Shortlisted", "Interview", "Selected"]
        masked_email = s.email if is_contact_revealed else f"{s.email[:2]}***@{s.email.split('@')[-1]}"

        candidates_ranked.append({
            "student_id": s.id,
            "name": s.name,
            "student_name": s.name,
            "email": masked_email,
            "is_contact_revealed": is_contact_revealed,
            "college": p.college if p else "Government Engineering College",
            "course": p.course if p else "Computer Science",
            "year": p.year if p else 3,
            "match_percentage": match_pct,
            "matching_skills": matching,
            "matched_skills": matching,
            "missing_skills": missing,
            "skill_score": p.skill_score if p else 75.0,
            "industry_readiness": p.industry_readiness if p else 70.0,
            "application_status": app.status if app else "Not Applied",
        })


    db.commit()

    # Sort candidates by match percentage descending
    candidates_ranked.sort(key=lambda x: x["match_percentage"], reverse=True)

    return {
        "success": True,
        "job_id": job.id,
        "job_title": job.title,
        "required_skills": job_skills,
        "total_candidates": len(candidates_ranked),
        "data": candidates_ranked,
    }


# ============================================================
# APPLY FOR JOB (Requirement 48)
# ============================================================

@router.post("/{job_id}/apply")
def apply_for_job(
    job_id: int,
    body: JobApplyRequest = JobApplyRequest(),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Prevent duplicate application
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job.id,
        JobApplication.user_id == user.id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"You have already applied for '{job.title}'. Current status: {existing.status}",
        )

    # Save application
    app = JobApplication(
        job_id=job.id,
        user_id=user.id,
        status="Applied",
        cover_note=body.cover_note or "Applied via SARATHI Student Portal",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return {
        "success": True,
        "message": f"Successfully applied for '{job.title}' at {job.company_name}",
        "data": {
            "application_id": app.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_name": job.company_name,
            "status": app.status,
            "applied_at": app.applied_at.strftime("%d %b %Y, %I:%M %p"),
        },
    }


# ============================================================
# STUDENT MY APPLICATIONS (Requirement 48)
# ============================================================

@router.get("/my/applications")
def get_my_applications(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user_id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )

    result = []
    for a in apps:
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        result.append({
            "id": a.id,
            "application_id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else "Software Engineer",
            "company_name": job.company_name if job else "Enterprise Tech",
            "location": job.location if job else "Pune",
            "salary_range": job.salary_range if job else "₹5 - 8 LPA",
            "status": a.status,
            "applied_at": a.applied_at.strftime("%d %b %Y"),
        })

    return {
        "success": True,
        "count": len(result),
        "data": result,
    }


# ============================================================
# EMPLOYER / COMPANY APPLICATIONS (Requirement 48)
# ============================================================

@router.get("/company/applications")
def get_company_applications(
    db: Session = Depends(get_db),
):
    apps = db.query(JobApplication).order_by(JobApplication.applied_at.desc()).all()

    result = []
    for a in apps:
        job = db.query(JobPosting).filter(JobPosting.id == a.job_id).first()
        student = db.query(User).filter(User.id == a.user_id).first()
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == a.user_id).first() if student else None

        result.append({
            "id": a.id,
            "application_id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else "Role",
            "company_name": job.company_name if job else "Company",
            "student_id": a.user_id,
            "student_name": student.name if student else "Candidate",
            "student_email": student.email if student else "",
            "college": profile.college if profile else "Engineering College",
            "course": profile.course if profile else "B.Tech CSE",
            "skills": [s.strip() for s in (profile.skills or "").split(",") if s.strip()] if profile else [],
            "status": a.status,
            "applied_at": a.applied_at.strftime("%d %b %Y"),
            "cover_note": a.cover_note,
        })

    return {
        "success": True,
        "count": len(result),
        "data": result,
    }


# ============================================================
# UPDATE APPLICATION STATUS (Requirement 48)
# ============================================================

VALID_STATUSES = {"Applied", "Shortlisted", "Interview", "Selected", "Rejected"}

@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    body: StatusUpdateRequest,
    db: Session = Depends(get_db),
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_status = body.status.strip()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {sorted(VALID_STATUSES)}",
        )

    app.status = new_status
    app.updated_at = datetime.utcnow()

    # If Selected, create PlacementOutcome record in database
    if new_status == "Selected":
        job = db.query(JobPosting).filter(JobPosting.id == app.job_id).first()
        student = db.query(User).filter(User.id == app.user_id).first()
        existing_placement = db.query(PlacementOutcome).filter(
            PlacementOutcome.candidate_id == app.user_id,
        ).first()

        if not existing_placement:
            db.add(PlacementOutcome(
                candidate_id=app.user_id,
                employer_name=job.company_name if job else "Leading Enterprise",
                placed=True,
                salary=650000.0,
                skill_match_score=92.0,
                retention_months=12,
                employer_satisfaction=4.8,
                placement_date=datetime.utcnow(),
            ))

    db.commit()
    db.refresh(app)

    return {
        "success": True,
        "message": f"Application status updated to '{app.status}' in database",
        "data": {
            "application_id": app.id,
            "status": app.status,
            "updated_at": app.updated_at.strftime("%d %b %Y, %I:%M %p"),
        },
    }