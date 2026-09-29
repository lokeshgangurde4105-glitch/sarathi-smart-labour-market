import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    StudentProfile,
    Skill,
    Course,
    StudentSkillGap,
    CareerRoadmap,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


class CalculateGapRequest(BaseModel):
    target_role: Optional[str] = "Full Stack AI Engineer"
    skills: Optional[List[str]] = None


# ============================================================
# STUDENT PERSONAL SKILL GAP & ROADMAP (Requirement 43)
# ============================================================

@router.get("/me")
def get_my_skill_gaps(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    target_role = profile.target_role if profile and profile.target_role else "Full Stack Developer"

    # Gaps from database
    gaps = db.query(StudentSkillGap).filter(StudentSkillGap.user_id == user.id).all()

    # Roadmap from database
    roadmap = db.query(CareerRoadmap).filter(CareerRoadmap.user_id == user.id).first()
    roadmap_steps = []
    if roadmap and roadmap.steps_json:
        try:
            roadmap_steps = json.loads(roadmap.steps_json)
        except Exception:
            pass

    if not roadmap_steps:
        # Default milestones
        roadmap_steps = [
            {"step": 1, "phase": "Foundation", "title": "Core Python & Data Structures", "duration": "4 Weeks", "status": "Completed", "skills": ["Python", "Algorithms"]},
            {"step": 2, "phase": "Specialization", "title": "FastAPI & Relational Database Architecture", "duration": "4 Weeks", "status": "In Progress", "skills": ["FastAPI", "SQL", "SQLAlchemy"]},
            {"step": 3, "phase": "Cloud Scaling", "title": "Docker Containerization & CI/CD Pipelines", "duration": "3 Weeks", "status": "Upcoming", "skills": ["Docker", "Linux", "DevOps"]},
            {"step": 4, "phase": "AI Integration", "title": "Applied Generative AI & Vector Search", "duration": "5 Weeks", "status": "Upcoming", "skills": ["GenAI", "Embeddings", "RAG"]},
            {"step": 5, "phase": "Capstone & Placement", "title": "Production Deployment & Mock Technical Interviews", "duration": "2 Weeks", "status": "Upcoming", "skills": ["System Design", "Cloud"]},
        ]

    return {
        "success": True,
        "data": {
            "student_id": user.id,
            "target_role": target_role,
            "current_skill_score": profile.skill_score if profile else 78.0,
            "industry_readiness": profile.industry_readiness if profile else 75.0,
            "skill_gaps": [
                {
                    "id": g.id,
                    "skill_name": g.skill_name,
                    "current_score": g.current_score,
                    "required_score": g.required_score,
                    "gap_score": g.gap_score,
                    "priority": g.priority,
                    "recommended_course": g.recommended_course,
                }
                for g in gaps
            ],
            "roadmap": {
                "target_role": target_role,
                "milestones": roadmap_steps,
            },
        },
    }


# ============================================================
# CALCULATE SKILL GAP & SAVE TO DATABASE (Requirement 43)
# ============================================================

ROLE_SKILL_REQUIREMENTS = {
    "Full Stack AI Engineer": [
        ("Python", 90.0, "Full Stack Python & Cloud Development"),
        ("FastAPI", 85.0, "Full Stack Python & Cloud Development"),
        ("React", 85.0, "Full Stack Python & Cloud Development"),
        ("SQL", 85.0, "Data Analytics & Business Intelligence"),
        ("Cloud Computing", 80.0, "Enterprise Cloud & DevOps Engineering"),
        ("Docker", 80.0, "Enterprise Cloud & DevOps Engineering"),
        ("Generative AI", 85.0, "Applied AI & Machine Learning Systems"),
    ],
    "Data Analyst": [
        ("SQL", 90.0, "Data Analytics & Business Intelligence"),
        ("Python", 85.0, "Full Stack Python & Cloud Development"),
        ("Statistics", 80.0, "Data Analytics & Business Intelligence"),
        ("Power BI", 85.0, "Data Analytics & Business Intelligence"),
    ],
    "Cloud & DevOps Engineer": [
        ("Cloud Computing", 90.0, "Enterprise Cloud & DevOps Engineering"),
        ("Docker", 90.0, "Enterprise Cloud & DevOps Engineering"),
        ("Linux", 85.0, "Enterprise Cloud & DevOps Engineering"),
        ("CI/CD", 80.0, "Enterprise Cloud & DevOps Engineering"),
    ],
}

@router.post("/calculate")
def calculate_skill_gaps(
    body: CalculateGapRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    current_skills_text = (profile.skills if profile and profile.skills else "Python, SQL, React").lower()
    
    target_role = body.target_role or (profile.target_role if profile and profile.target_role else "Full Stack AI Engineer")
    requirements = ROLE_SKILL_REQUIREMENTS.get(target_role, ROLE_SKILL_REQUIREMENTS["Full Stack AI Engineer"])

    identified_gaps = []
    for skill_name, req_score, rec_course in requirements:
        has_skill = skill_name.lower() in current_skills_text
        curr_score = 75.0 if has_skill else 45.0
        gap = round(req_score - curr_score, 1)

        if gap > 0:
            priority = "Critical" if gap >= 35.0 else ("High" if gap >= 20.0 else "Medium")

            # Save / update in DB
            db_gap = db.query(StudentSkillGap).filter(
                StudentSkillGap.user_id == user.id,
                StudentSkillGap.skill_name == skill_name,
            ).first()

            if db_gap:
                db_gap.current_score = curr_score
                db_gap.required_score = req_score
                db_gap.gap_score = gap
                db_gap.priority = priority
                db_gap.recommended_course = rec_course
            else:
                db_gap = StudentSkillGap(
                    user_id=user.id,
                    skill_name=skill_name,
                    current_score=curr_score,
                    required_score=req_score,
                    gap_score=gap,
                    priority=priority,
                    recommended_course=rec_course,
                )
                db.add(db_gap)

            identified_gaps.append({
                "skill_name": skill_name,
                "current_score": curr_score,
                "required_score": req_score,
                "gap_score": gap,
                "priority": priority,
                "recommended_course": rec_course,
            })

    # Save career roadmap in database
    roadmap_milestones = [
        {"step": 1, "phase": "Bridge Current Gaps", "title": f"Upskill in {identified_gaps[0]['skill_name'] if identified_gaps else 'Core Skills'}", "duration": "4 Weeks", "status": "In Progress"},
        {"step": 2, "phase": "Practical Projects", "title": "Build End-to-End Enterprise Project", "duration": "4 Weeks", "status": "Upcoming"},
        {"step": 3, "phase": "Certification", "title": "Earn Industry Verified Credential", "duration": "2 Weeks", "status": "Upcoming"},
        {"step": 4, "phase": "Job Application", "title": f"Apply for {target_role} Roles with 85%+ Match", "duration": "Ongoing", "status": "Upcoming"},
    ]

    existing_roadmap = db.query(CareerRoadmap).filter(CareerRoadmap.user_id == user.id).first()
    if existing_roadmap:
        existing_roadmap.target_role = target_role
        existing_roadmap.steps_json = json.dumps(roadmap_milestones)
    else:
        db.add(CareerRoadmap(
            user_id=user.id,
            target_role=target_role,
            current_level="Developing",
            steps_json=json.dumps(roadmap_milestones),
        ))

    db.commit()

    return {
        "success": True,
        "message": "Skill gaps and career roadmap successfully computed and persisted in database",
        "data": {
            "target_role": target_role,
            "gaps_count": len(identified_gaps),
            "skill_gaps": identified_gaps,
            "roadmap": roadmap_milestones,
        },
    }


# ============================================================
# MACRO SKILL GAPS (For Government / Planners)
# ============================================================

@router.get("/")
@router.get("/analysis")
def get_macro_skill_gaps(
    course: Optional[str] = None,
    skill: Optional[str] = None,
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).all()
    results = []
    for s in skills:
        gaps = db.query(StudentSkillGap).filter(StudentSkillGap.skill_name == s.name).all()
        avg_gap = round(sum(g.gap_score for g in gaps) / len(gaps), 1) if gaps else 25.0

        item = {
            "skill": s.name,
            "skill_name": s.name,
            "category": s.category,
            "demand": 92 if s.is_emerging else 84,
            "supply": 58 if s.is_emerging else 72,
            "skill_gap": avg_gap,
            "gap_score": avg_gap,
            "priority": "Critical" if avg_gap >= 35 else ("High" if avg_gap >= 20 else "Moderate"),
            "status": "Critical Gap" if avg_gap >= 35 else "High Demand",
            "recommended_course": f"Advanced {s.name} Industrial Curriculum",
        }

        if skill and skill.lower() not in s.name.lower():
            continue

        results.append(item)

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }