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
    StudentProfile,
    StudentSkillGap,
    AssessmentQuestion,
    AssessmentAttempt,
    AIRecommendation,
    Trainer,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class MarkAttendanceRequest(BaseModel):
    enrollment_id: int
    attendance_percentage: float


class UpdateProgressRequest(BaseModel):
    enrollment_id: int
    module_id: int
    is_completed: bool
    score: Optional[float] = 90.0


class TrainerFeedbackRequest(BaseModel):
    student_id: int
    skill_name: str
    feedback: str
    gap_score: Optional[float] = 25.0
    priority: Optional[str] = "High"


class CreateQuestionRequest(BaseModel):
    skill_name: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    category: Optional[str] = "Technical"


# ============================================================
# TRAINER PROFILE & ASSIGNMENTS (Requirement 50)
# ============================================================

@router.get("/trainer/me")
def get_trainer_me(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    courses = db.query(Course).all()
    enrollments_count = db.query(CourseEnrollment).count()

    return {
        "success": True,
        "data": {
            "name": "Prof. Rajesh Verma",
            "email": "trainer@example.com",
            "designation": "Lead Master Trainer",
            "institute": "National Skill Training Institute, Pune",
            "skills": ["Python", "FastAPI", "Cloud Systems", "Docker", "Database Architecture"],
            "stats": {
                "assigned_courses": len(courses),
                "total_students": enrollments_count,
                "active_batches": 3,
                "avg_class_attendance": 88.5,
                "satisfaction_rating": 4.9,
            },
            "assigned_courses": [
                {
                    "id": c.id,
                    "name": c.name,
                    "enrolled": c.enrolled_students,
                    "capacity": c.training_capacity,
                    "status": c.status,
                }
                for c in courses[:3]
            ],
        },
    }


# ============================================================
# TRAINER ASSIGNED STUDENTS (Requirement 50)
# ============================================================

@router.get("/trainer/students")
def get_trainer_students(db: Session = Depends(get_db)):
    enrollments = db.query(CourseEnrollment).all()

    results = []
    for enr in enrollments:
        student = db.query(User).filter(User.id == enr.user_id).first()
        course = db.query(Course).filter(Course.id == enr.course_id).first()
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == enr.user_id).first()

        modules = (
            db.query(CourseModule)
            .filter(CourseModule.course_id == enr.course_id)
            .order_by(CourseModule.order_num)
            .all()
        )

        mod_status = []
        for m in modules:
            p = db.query(CourseProgress).filter(
                CourseProgress.enrollment_id == enr.id,
                CourseProgress.module_id == m.id,
            ).first()

            mod_status.append({
                "module_id": m.id,
                "title": m.title,
                "completed": p.is_completed if p else False,
                "score": p.score if p else 0.0,
            })

        results.append({
            "enrollment_id": enr.id,
            "student_id": enr.user_id,
            "name": student.name if student else "Candidate",
            "email": student.email if student else "",
            "course": course.name if course else "Engineering Course",
            "course_id": course.id if course else 1,
            "attendance": enr.attendance_percentage,
            "progress": enr.progress_percentage,
            "grade": enr.grade,
            "status": enr.status,
            "modules": mod_status,
        })

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# MARK ATTENDANCE (Requirement 50)
# ============================================================

@router.post("/attendance")
def mark_student_attendance(
    body: MarkAttendanceRequest,
    db: Session = Depends(get_db),
):
    enr = db.query(CourseEnrollment).filter(CourseEnrollment.id == body.enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    enr.attendance_percentage = max(0.0, min(100.0, body.attendance_percentage))
    db.commit()
    db.refresh(enr)

    return {
        "success": True,
        "message": f"Attendance updated to {enr.attendance_percentage}% in database",
        "data": {
            "enrollment_id": enr.id,
            "attendance_percentage": enr.attendance_percentage,
        },
    }


# ============================================================
# UPDATE MODULE PROGRESS (Requirement 50)
# ============================================================

@router.post("/progress")
def update_module_progress(
    body: UpdateProgressRequest,
    db: Session = Depends(get_db),
):
    enr = db.query(CourseEnrollment).filter(CourseEnrollment.id == body.enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    prog = db.query(CourseProgress).filter(
        CourseProgress.enrollment_id == enr.id,
        CourseProgress.module_id == body.module_id,
    ).first()

    if prog:
        prog.is_completed = body.is_completed
        prog.score = body.score or 90.0
    else:
        prog = CourseProgress(
            enrollment_id=enr.id,
            module_id=body.module_id,
            is_completed=body.is_completed,
            score=body.score or 90.0,
        )
        db.add(prog)

    # Recalculate enrollment progress
    all_mods = db.query(CourseModule).filter(CourseModule.course_id == enr.course_id).all()
    completed_mods = (
        db.query(CourseProgress)
        .filter(
            CourseProgress.enrollment_id == enr.id,
            CourseProgress.is_completed == True,
        )
        .count()
    )

    if all_mods:
        enr.progress_percentage = round((completed_mods / len(all_mods)) * 100, 1)

    db.commit()
    db.refresh(enr)

    return {
        "success": True,
        "message": "Module progress updated successfully in database",
        "data": {
            "enrollment_id": enr.id,
            "module_id": body.module_id,
            "is_completed": body.is_completed,
            "overall_progress": enr.progress_percentage,
        },
    }


# ============================================================
# TRAINER FEEDBACK & WEAK SKILL IDENTIFICATION (Requirement 50)
# ============================================================

@router.post("/feedback")
def add_trainer_feedback(
    body: TrainerFeedbackRequest,
    db: Session = Depends(get_db),
):
    student = db.query(User).filter(User.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Save weak skill in StudentSkillGap
    existing_gap = db.query(StudentSkillGap).filter(
        StudentSkillGap.user_id == student.id,
        StudentSkillGap.skill_name == body.skill_name,
    ).first()

    if existing_gap:
        existing_gap.gap_score = body.gap_score or 30.0
        existing_gap.priority = body.priority or "High"
    else:
        db.add(StudentSkillGap(
            user_id=student.id,
            skill_name=body.skill_name,
            current_score=55.0,
            required_score=85.0,
            gap_score=body.gap_score or 30.0,
            priority=body.priority or "High",
            recommended_course="Specialized Upskilling Module",
        ))

    # Add AI Recommendation
    db.add(AIRecommendation(
        user_id=student.id,
        title=f"Trainer Recommendation: {body.skill_name}",
        recommendation=body.feedback,
        reason="Direct trainer assessment and practical performance review",
        priority=body.priority or "High",
        confidence_score=98.0,
        status="Active",
    ))

    db.commit()

    return {
        "success": True,
        "message": f"Trainer feedback on '{body.skill_name}' recorded and persisted in database",
    }


# ============================================================
# TRAINER CREATES ASSESSMENT QUESTION (Requirement 50)
# ============================================================

@router.post("/assessment")
def create_assessment_question(
    body: CreateQuestionRequest,
    db: Session = Depends(get_db),
):
    q = AssessmentQuestion(
        skill_name=body.skill_name.strip(),
        question=body.question.strip(),
        option_a=body.option_a.strip(),
        option_b=body.option_b.strip(),
        option_c=body.option_c.strip(),
        option_d=body.option_d.strip(),
        correct_option=body.correct_option.strip().upper(),
        explanation=body.explanation,
        difficulty=body.difficulty or "Medium",
        category=body.category or "Technical",
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    return {
        "success": True,
        "message": "Assessment question successfully added to question pool in database",
        "data": {"id": q.id, "skill_name": q.skill_name, "question": q.question},
    }


# ============================================================
# COMPATIBILITY: LIST TRAINING PROGRAMS
# ============================================================

@router.get("/")
def get_all_training_programs(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return {
        "success": True,
        "count": len(courses),
        "data": [
            {
                "id": c.id,
                "title": c.name,
                "provider": "National Skill Training Institute",
                "category": "Technology & Engineering",
                "duration": f"{c.duration_months} Months",
                "enrolled": c.enrolled_students,
                "completion_rate": int(c.placement_rate),
                "industry_alignment": int(c.alignment_score),
                "status": c.status,
                "skills": ["Python", "FastAPI", "SQL", "Cloud"] if "Python" in c.name else ["Machine Learning", "AI", "Data"],
            }
            for c in courses
        ],
    }