from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    Course,
    CourseModule,
    CourseEnrollment,
    CourseProgress,
    Certificate,
    VerificationRecord,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class CourseCreate(BaseModel):
    name: str
    qualification: Optional[str] = "All Disciplines"
    duration_months: Optional[int] = 3
    training_capacity: Optional[int] = 50
    demand_level: Optional[str] = "High"
    description: Optional[str] = None
    modules: Optional[List[str]] = []


class ProgressUpdateRequest(BaseModel):
    module_id: Optional[int] = None
    is_completed: Optional[bool] = None
    completed: Optional[bool] = None
    attendance_percentage: Optional[float] = None
    score: Optional[float] = None


# ============================================================
# LIST ALL COURSES (Requirement 44)
# ============================================================

@router.get("/")
@router.get("")
@router.get("/catalog")
def get_all_courses(
    search: Optional[str] = None,
    demand_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Course)
    if demand_level:
        query = query.filter(Course.demand_level == demand_level)
    courses = query.all()

    result = []
    for c in courses:
        modules = (
            db.query(CourseModule)
            .filter(CourseModule.course_id == c.id)
            .order_by(CourseModule.order_num)
            .all()
        )
        available_seats = max(0, c.training_capacity - c.enrolled_students)

        item = {
            "id": c.id,
            "name": c.name,
            "qualification": c.qualification,
            "duration_months": c.duration_months,
            "training_capacity": c.training_capacity,
            "enrolled_students": c.enrolled_students,
            "seats_available": available_seats,
            "placement_rate": c.placement_rate,
            "alignment_score": c.alignment_score,
            "demand_level": c.demand_level,
            "description": c.description,
            "modules_count": len(modules),
            "modules": [
                {
                    "id": m.id,
                    "title": m.title,
                    "order_num": m.order_num,
                    "duration_hours": m.duration_hours,
                }
                for m in modules
            ],
        }

        if search:
            s_lower = search.lower()
            if (
                s_lower not in c.name.lower()
                and s_lower not in (c.description or "").lower()
            ):
                continue

        result.append(item)

    return {
        "success": True,
        "count": len(result),
        "data": result,
    }


# ============================================================
# GET SINGLE COURSE
# ============================================================

@router.get("/{course_id}")
def get_course_by_id(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    modules = (
        db.query(CourseModule)
        .filter(CourseModule.course_id == course.id)
        .order_by(CourseModule.order_num)
        .all()
    )

    return {
        "success": True,
        "data": {
            "id": course.id,
            "name": course.name,
            "qualification": course.qualification,
            "duration_months": course.duration_months,
            "training_capacity": course.training_capacity,
            "enrolled_students": course.enrolled_students,
            "seats_available": max(0, course.training_capacity - course.enrolled_students),
            "placement_rate": course.placement_rate,
            "alignment_score": course.alignment_score,
            "demand_level": course.demand_level,
            "description": course.description,
            "modules": [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "order_num": m.order_num,
                    "duration_hours": m.duration_hours,
                }
                for m in modules
            ],
        },
    }


# ============================================================
# ENROLL IN COURSE (Requirement 44)
# ============================================================

@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check duplicate enrollment
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == user.id,
        CourseEnrollment.course_id == course.id,
    ).first()

    if existing:
        return {
            "success": True,
            "message": "Student is already enrolled in this course",
            "data": {
                "enrollment_id": existing.id,
                "course_id": course.id,
                "course_name": course.name,
                "status": existing.status,
                "progress_percentage": existing.progress_percentage,
                "attendance_percentage": existing.attendance_percentage,
                "enrolled_at": existing.enrolled_at.strftime("%d %b %Y") if existing.enrolled_at else None,
            },
        }

    # Check seats available
    if course.enrolled_students >= course.training_capacity:
        raise HTTPException(
            status_code=400,
            detail="No seats available in this course batch",
        )

    # Create enrollment
    enrollment = CourseEnrollment(
        user_id=user.id,
        course_id=course.id,
        status="In Progress",
        attendance_percentage=100.0,
        progress_percentage=0.0,
        grade="In Progress",
    )
    db.add(enrollment)
    course.enrolled_students += 1
    db.flush()

    # Initialize progress for all course modules
    modules = db.query(CourseModule).filter(CourseModule.course_id == course.id).all()
    for m in modules:
        db.add(CourseProgress(
            enrollment_id=enrollment.id,
            module_id=m.id,
            is_completed=False,
            score=0.0,
        ))

    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": f"Successfully enrolled in {course.name}",
        "data": {
            "enrollment_id": enrollment.id,
            "course_id": course.id,
            "course_name": course.name,
            "status": enrollment.status,
            "enrolled_at": enrollment.enrolled_at.strftime("%d %b %Y"),
            "seats_remaining": max(0, course.training_capacity - course.enrolled_students),
        },
    }


# ============================================================
# GET STUDENT ENROLLMENTS WITH PROGRESS (Requirement 44 & 45)
# ============================================================

@router.get("/my/enrollments")
def get_my_enrollments(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.user_id == user_id).all()

    results = []
    for enr in enrollments:
        course = db.query(Course).filter(Course.id == enr.course_id).first()
        if not course:
            continue

        modules = (
            db.query(CourseModule)
            .filter(CourseModule.course_id == course.id)
            .order_by(CourseModule.order_num)
            .all()
        )

        mod_progress = []
        completed_count = 0
        all_prev_completed = True
        for idx, m in enumerate(modules):
            p = db.query(CourseProgress).filter(
                CourseProgress.enrollment_id == enr.id,
                CourseProgress.module_id == m.id,
            ).first()

            is_done = p.is_completed if p else False
            if is_done:
                completed_count += 1

            # Module 1 is unlocked by default; subsequent modules require previous to be completed
            is_locked = False if idx == 0 else (not all_prev_completed)
            if not is_done:
                all_prev_completed = False

            mod_progress.append({
                "module_id": m.id,
                "title": m.title,
                "order_num": m.order_num,
                "duration_hours": m.duration_hours,
                "is_completed": is_done,
                "is_locked": is_locked,
                "score": p.score if p else 0.0,
            })

        # Calculate progress
        calc_progress = round((completed_count / max(len(modules), 1)) * 100, 1) if modules else enr.progress_percentage

        results.append({
            "enrollment_id": enr.id,
            "course_id": course.id,
            "course_name": course.name,
            "status": enr.status,
            "attendance_percentage": enr.attendance_percentage,
            "progress_percentage": calc_progress,
            "grade": enr.grade,
            "enrolled_at": enr.enrolled_at.strftime("%d %b %Y") if enr.enrolled_at else "",
            "modules": mod_progress,
        })

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# UPDATE COURSE PROGRESS (Requirement 45)
# ============================================================

@router.put("/progress/{enrollment_id}")
def update_course_progress(
    enrollment_id: int,
    body: ProgressUpdateRequest,
    db: Session = Depends(get_db),
):
    enrollment = db.query(CourseEnrollment).filter(CourseEnrollment.id == enrollment_id).first()
    target_mod_id = body.module_id

    if not enrollment:
        # Check if enrollment_id passed was a module_id
        mod = db.query(CourseModule).filter(CourseModule.id == enrollment_id).first()
        if mod:
            enrollment = (
                db.query(CourseEnrollment)
                .filter(CourseEnrollment.course_id == mod.course_id)
                .order_by(CourseEnrollment.id.desc())
                .first()
            )
            if target_mod_id is None:
                target_mod_id = mod.id

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    if body.attendance_percentage is not None:
        enrollment.attendance_percentage = body.attendance_percentage

    comp_val = body.is_completed if body.is_completed is not None else body.completed

    if target_mod_id is not None:
        target_mod = db.query(CourseModule).filter(CourseModule.id == target_mod_id).first()
        if not target_mod:
            raise HTTPException(status_code=404, detail="Target module not found")

        # Enforce prerequisite lock: Module N requires Module N-1 to be completed
        if target_mod.order_num > 1:
            prev_mod = db.query(CourseModule).filter(
                CourseModule.course_id == enrollment.course_id,
                CourseModule.order_num == target_mod.order_num - 1,
            ).first()

            if prev_mod:
                prev_prog = db.query(CourseProgress).filter(
                    CourseProgress.enrollment_id == enrollment.id,
                    CourseProgress.module_id == prev_mod.id,
                ).first()

                if not prev_prog or not prev_prog.is_completed:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Prerequisite module not completed. "
                            f"You must complete Module {prev_mod.order_num} ('{prev_mod.title}') "
                            f"before unlocking Module {target_mod.order_num} ('{target_mod.title}')."
                        ),
                    )

        prog = db.query(CourseProgress).filter(
            CourseProgress.enrollment_id == enrollment.id,
            CourseProgress.module_id == target_mod.id,
        ).first()

        if prog:
            if comp_val is not None:
                prog.is_completed = comp_val
            if body.score is not None:
                prog.score = body.score
        else:
            prog = CourseProgress(
                enrollment_id=enrollment.id,
                module_id=target_mod.id,
                is_completed=comp_val or False,
                score=body.score or 0.0,
            )
            db.add(prog)

    # Recalculate overall progress
    all_modules = db.query(CourseModule).filter(CourseModule.course_id == enrollment.course_id).all()
    completed_modules = (
        db.query(CourseProgress)
        .filter(
            CourseProgress.enrollment_id == enrollment.id,
            CourseProgress.is_completed == True,
        )
        .count()
    )

    if all_modules:
        new_progress = round((completed_modules / len(all_modules)) * 100, 1)
        enrollment.progress_percentage = new_progress

        if new_progress >= 100.0:
            enrollment.status = "Completed"
            enrollment.completed_at = datetime.utcnow()
            enrollment.grade = "A+"

            # Auto-issue Certificate if not already issued
            existing_cert = db.query(Certificate).filter(
                Certificate.user_id == enrollment.user_id,
                Certificate.course_id == enrollment.course_id,
            ).first()

            if not existing_cert:
                student = db.query(User).filter(User.id == enrollment.user_id).first()
                course = db.query(Course).filter(Course.id == enrollment.course_id).first()
                cert_code = f"SARATHI-CERT-2026-{enrollment.user_id:03d}{course.id:02d}"
                db.add(Certificate(
                    certificate_number=cert_code,
                    user_id=enrollment.user_id,
                    course_id=course.id,
                    institute_name="National Skill Training Institute",
                    trainer_name="Prof. Rajesh Verma",
                    student_name=student.name if student else "Certified Scholar",
                    course_name=course.name if course else "Skill Development Course",
                    grade="A+",
                    skills="Advanced Competencies Verified",
                    verification_code=cert_code,
                    status="Verified",
                ))
                db.add(VerificationRecord(
                    certificate_code=cert_code,
                    is_valid=True,
                    verifier_info="Automated Completion Verification System",
                ))

    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": "Course progress updated successfully in database",
        "data": {
            "enrollment_id": enrollment.id,
            "progress_percentage": enrollment.progress_percentage,
            "attendance_percentage": enrollment.attendance_percentage,
            "status": enrollment.status,
            "grade": enrollment.grade,
        },
    }
