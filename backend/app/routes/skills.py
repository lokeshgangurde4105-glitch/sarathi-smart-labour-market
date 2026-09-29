from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Skill

router = APIRouter()


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = "General"
    description: Optional[str] = None
    is_emerging: Optional[bool] = False


# ============================================================
# GET ALL SKILLS FROM DATABASE
# ============================================================

@router.get("/")
def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category == category)
    skills = query.all()

    results = []
    for s in skills:
        item = {
            "id": s.id,
            "name": s.name,
            "category": s.category or "General",
            "demand_score": 94 if s.is_emerging else 86,
            "supply_score": 58 if s.is_emerging else 72,
            "gap_score": 36 if s.is_emerging else 14,
            "status": "Critical Gap" if s.is_emerging else "High Demand",
            "trend": "Surging" if s.is_emerging else "Rising",
            "is_emerging": s.is_emerging,
        }

        if search:
            if (
                search.lower() not in s.name.lower()
                and search.lower() not in (s.category or "").lower()
            ):
                continue

        results.append(item)

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# GET EMERGING SKILLS
# ============================================================

@router.get("/emerging")
def get_emerging_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).filter(Skill.is_emerging == True).all()
    return {
        "success": True,
        "count": len(skills),
        "data": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "demand_score": 96,
                "trend": "Surging",
            }
            for s in skills
        ],
    }


# ============================================================
# GET SINGLE SKILL
# ============================================================

@router.get("/{skill_id}")
def get_skill_by_id(skill_id: int, db: Session = Depends(get_db)):
    s = db.query(Skill).filter(Skill.id == skill_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Skill not found")

    return {
        "success": True,
        "data": {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "is_emerging": s.is_emerging,
            "created_at": s.created_at.strftime("%d %b %Y"),
        },
    }


# ============================================================
# CREATE SKILL
# ============================================================

@router.post("/")
def create_skill(body: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(Skill.name == body.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists in database")

    skill = Skill(
        name=body.name.strip(),
        category=body.category,
        description=body.description,
        is_emerging=body.is_emerging or False,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)

    return {
        "success": True,
        "message": "Skill created and saved in database",
        "data": {"id": skill.id, "name": skill.name, "category": skill.category},
    }