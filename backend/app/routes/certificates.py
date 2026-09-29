from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Course,
    CourseEnrollment,
    Certificate,
    VerificationRecord,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class IssueCertificateRequest(BaseModel):
    user_id: int
    course_id: int
    grade: Optional[str] = "A"


# ============================================================
# MY CERTIFICATES (Requirement 46)
# ============================================================

@router.get("/my")
def get_my_certificates(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    certs = db.query(Certificate).filter(Certificate.user_id == user_id).all()

    return {
        "success": True,
        "count": len(certs),
        "data": [
            {
                "id": c.id,
                "certificate_number": c.certificate_number,
                "verification_code": c.verification_code,
                "student_name": c.student_name,
                "course_name": c.course_name,
                "institute_name": c.institute_name,
                "trainer_name": c.trainer_name,
                "grade": c.grade,
                "skills": c.skills,
                "status": c.status,
                "issue_date": c.issue_date.strftime("%d %B %Y") if c.issue_date else "",
            }
            for c in certs
        ],
    }


# ============================================================
# VERIFY CERTIFICATE (Requirement 46)
# ============================================================

@router.get("/verify/{certificate_id}")
def verify_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
):
    clean_id = certificate_id.strip()
    cert = (
        db.query(Certificate)
        .filter(
            (Certificate.certificate_number.ilike(clean_id))
            | (Certificate.verification_code.ilike(clean_id))
        )
        .first()
    )

    if not cert:
        # Record failed attempt
        db.add(VerificationRecord(
            certificate_code=clean_id,
            is_valid=False,
            verifier_info="Public Verification Portal",
        ))
        db.commit()

        raise HTTPException(
            status_code=404,
            detail=f"Certificate '{clean_id}' was not found in the official registry or is invalid.",
        )

    # Record successful verification in DB
    db.add(VerificationRecord(
        certificate_code=cert.certificate_number,
        is_valid=True,
        verifier_info="Public Verification Portal",
    ))
    db.commit()

    return {
        "success": True,
        "status": "Verified",
        "message": "Certificate authenticity successfully verified in the database",
        "data": {
            "is_valid": True,
            "certificate_number": cert.certificate_number,
            "verification_code": cert.verification_code,
            "verification_hash": cert.verification_code,
            "student_name": cert.student_name,
            "course_name": cert.course_name,
            "institute_name": cert.institute_name,
            "trainer_name": cert.trainer_name,
            "issue_date": cert.issue_date.strftime("%d %B %Y") if cert.issue_date else "",
            "grade": cert.grade,
            "skills": [s.strip() for s in cert.skills.split(",") if s.strip()],
            "status": cert.status,
            "verification_timestamp": datetime.utcnow().strftime("%d %B %Y, %I:%M %p UTC"),
        },
    }


# ============================================================
# ISSUE CERTIFICATE
# ============================================================

@router.post("/issue")
def issue_certificate(
    body: IssueCertificateRequest,
    db: Session = Depends(get_db),
):
    student = db.query(User).filter(User.id == body.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    course = db.query(Course).filter(Course.id == body.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check eligibility
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == student.id,
        CourseEnrollment.course_id == course.id,
    ).first()

    if not enrollment:
        raise HTTPException(status_code=400, detail="Student is not enrolled in this course")

    cert_code = f"SARATHI-CERT-2026-{student.id:03d}{course.id:02d}"
    existing = db.query(Certificate).filter(Certificate.certificate_number == cert_code).first()
    if existing:
        return {
            "success": True,
            "message": "Certificate already issued",
            "data": {
                "certificate_number": existing.certificate_number,
                "verification_code": existing.verification_code,
            },
        }

    cert = Certificate(
        certificate_number=cert_code,
        user_id=student.id,
        course_id=course.id,
        institute_name="National Skill Training Institute",
        trainer_name="Prof. Rajesh Verma",
        student_name=student.name,
        course_name=course.name,
        grade=body.grade or "A+",
        skills="Verified Core Competencies",
        verification_code=cert_code,
        status="Verified",
    )
    db.add(cert)
    db.add(VerificationRecord(
        certificate_code=cert_code,
        is_valid=True,
        verifier_info="Issued by Training Institute",
    ))
    db.commit()
    db.refresh(cert)

    return {
        "success": True,
        "message": "Certificate generated and persisted in database",
        "data": {
            "id": cert.id,
            "certificate_number": cert.certificate_number,
            "verification_code": cert.verification_code,
            "student_name": cert.student_name,
            "course_name": cert.course_name,
            "status": cert.status,
        },
    }
