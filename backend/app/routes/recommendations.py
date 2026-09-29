from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    StudentProfile,
    Course,
    Skill,
    AIRecommendation,
    StudentSkillGap,
)

router = APIRouter()


class RecommendationRequest(BaseModel):
    student_id: Optional[int] = None
    course: Optional[str] = None
    skills: List[str] = []


# ============================================================
# GET ALL AI RECOMMENDATIONS
# ============================================================

@router.get("/")
def get_all_recommendations(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    recs = {}
    for c in courses:
        recs[c.name] = ["Cloud Deployment", "FastAPI APIs", "Generative AI", "Database Optimization"]

    ai_recs = db.query(AIRecommendation).all()
    items = [
        {
            "id": r.id,
            "title": r.title,
            "recommendation": r.recommendation,
            "reason": r.reason,
            "priority": r.priority,
            "confidence_score": r.confidence_score,
            "status": r.status,
            "generated_at": r.generated_at.strftime("%d %b %Y"),
        }
        for r in ai_recs
    ]

    return {
        "success": True,
        "data": recs,
        "ai_recommendations": items,
    }


# ============================================================
# GET RECOMMENDATIONS FOR A STUDENT
# ============================================================

@router.get("/student/{student_id}")
def get_student_recommendations(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    gaps = db.query(StudentSkillGap).filter(StudentSkillGap.user_id == user.id).all()
    user_skills = [s.strip() for s in (profile.skills or "").split(",") if s.strip()] if profile else []

    recommended = []
    for g in gaps:
        recommended.append(f"{g.skill_name} ({g.recommended_course or 'Skill Course'})")

    if not recommended:
        recommended = ["Cloud Computing (AWS / Docker)", "FastAPI REST Framework", "Generative AI Fundamentals"]

    return {
        "success": True,
        "student": {
            "id": user.id,
            "name": user.name,
            "course": profile.course if profile else "Computer Science",
        },
        "current_skills": user_skills,
        "recommended_skills": recommended,
        "count": len(recommended),
    }


# ============================================================
# GET RECOMMENDATIONS BY COURSE
# ============================================================

@router.get("/course/{course_name}")
def get_course_recommendations(course_name: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.name.ilike(f"%{course_name}%")).first()
    if not course:
        return {
            "success": False,
            "message": "Course not found",
        }

    return {
        "success": True,
        "course": course.name,
        "recommended_skills": ["Production Containerization", "Enterprise Microservices", "CI/CD Deployment"],
        "count": 3,
    }


# ============================================================
# SKILL GAP RECOMMENDATIONS
# ============================================================

@router.get("/skill-gap/{student_id}")
def get_skill_gap_recommendations(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    gaps = db.query(StudentSkillGap).filter(StudentSkillGap.user_id == user.id).all()
    return {
        "success": True,
        "student_id": user.id,
        "gaps": [
            {
                "skill": g.skill_name,
                "gap": g.gap_score,
                "priority": g.priority,
                "recommended_course": g.recommended_course,
            }
            for g in gaps
        ],
    }