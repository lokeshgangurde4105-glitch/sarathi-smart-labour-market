from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ============================================================
# CURRICULUM DATA
# ============================================================

CURRICULUM = [
    {
        "id": 1,
        "course": "Computer Engineering",
        "subject": "Programming Fundamentals",
        "institution": "Engineering Program",
        "alignment_score": 82,
        "industry_demand": 92,
        "skill_gap": 10,
        "status": "Good Alignment",
        "skills": [
            "Python",
            "Java",
            "Problem Solving",
        ],
        "recommended_skills": [
            "Advanced Python",
            "Generative AI",
        ],
    },
    {
        "id": 2,
        "course": "Computer Engineering",
        "subject": "Database Management",
        "institution": "Engineering Program",
        "alignment_score": 76,
        "industry_demand": 88,
        "skill_gap": 12,
        "status": "Needs Improvement",
        "skills": [
            "SQL",
            "DBMS",
        ],
        "recommended_skills": [
            "Cloud Databases",
            "Data Analytics",
        ],
    },
    {
        "id": 3,
        "course": "Information Technology",
        "subject": "Web Development",
        "institution": "Engineering Program",
        "alignment_score": 71,
        "industry_demand": 84,
        "skill_gap": 13,
        "status": "Needs Improvement",
        "skills": [
            "HTML",
            "CSS",
            "JavaScript",
            "React",
        ],
        "recommended_skills": [
            "Next.js",
            "API Development",
            "Cloud Deployment",
        ],
    },
    {
        "id": 4,
        "course": "Computer Science",
        "subject": "Artificial Intelligence",
        "institution": "Engineering Program",
        "alignment_score": 63,
        "industry_demand": 89,
        "skill_gap": 26,
        "status": "Needs Update",
        "skills": [
            "Machine Learning",
            "Python",
        ],
        "recommended_skills": [
            "Generative AI",
            "LLMs",
            "AI Agents",
        ],
    },
]


# ============================================================
# REQUEST MODELS
# ============================================================

class CurriculumCreate(BaseModel):
    course: str
    subject: str
    institution: str = "Engineering Program"
    alignment_score: int = 50
    industry_demand: int = 50
    skills: list[str] = []
    recommended_skills: list[str] = []


class CurriculumUpdate(BaseModel):
    course: Optional[str] = None
    subject: Optional[str] = None
    institution: Optional[str] = None
    alignment_score: Optional[int] = None
    industry_demand: Optional[int] = None
    skills: Optional[list[str]] = None
    recommended_skills: Optional[list[str]] = None


# ============================================================
# GET ALL CURRICULUM
# ============================================================

@router.get("/")
def get_curriculum(
    search: Optional[str] = None,
    course: Optional[str] = None,
):
    results = CURRICULUM

    if search:
        text = search.lower()

        results = [
            item
            for item in results
            if text in item["course"].lower()
            or text in item["subject"].lower()
            or text in item["institution"].lower()
        ]

    if course:
        results = [
            item
            for item in results
            if item["course"].lower() == course.lower()
        ]

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# CURRICULUM SUMMARY
# ============================================================

@router.get("/analytics/summary")
def curriculum_summary():

    if not CURRICULUM:
        return {
            "success": True,
            "data": {
                "total_courses": 0,
                "average_alignment": 0,
                "average_skill_gap": 0,
                "courses_needing_update": 0,
            },
        }

    average_alignment = round(
        sum(
            item["alignment_score"]
            for item in CURRICULUM
        ) / len(CURRICULUM)
    )

    average_gap = round(
        sum(
            item["skill_gap"]
            for item in CURRICULUM
        ) / len(CURRICULUM)
    )

    needs_update = sum(
        1
        for item in CURRICULUM
        if item["alignment_score"] < 70
    )

    return {
        "success": True,
        "data": {
            "total_courses": len(CURRICULUM),
            "average_alignment": average_alignment,
            "average_skill_gap": average_gap,
            "courses_needing_update": needs_update,
        },
    }


# ============================================================
# COURSES NEEDING UPDATE
# ============================================================

@router.get("/analytics/needs-update")
def courses_needing_update():

    results = [
        item
        for item in CURRICULUM
        if item["alignment_score"] < 70
    ]

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# TOP ALIGNED COURSES
# ============================================================

@router.get("/analytics/top-aligned")
def top_aligned_courses():

    results = sorted(
        CURRICULUM,
        key=lambda item: item["alignment_score"],
        reverse=True,
    )

    return {
        "success": True,
        "data": results,
    }


# ============================================================
# MODULE STATUS
# ============================================================

@router.get("/status/check")
def curriculum_status():

    return {
        "success": True,
        "module": "curriculum",
        "status": "working",
    }


# ============================================================
# GET CURRICULUM BY ID
# ============================================================
# YES — THIS IS THE @router.get("/{curriculum_id}")
# ============================================================

@router.get("/{curriculum_id}")
def get_curriculum_by_id(curriculum_id: int):

    item = next(
        (
            curriculum
            for curriculum in CURRICULUM
            if curriculum["id"] == curriculum_id
        ),
        None,
    )

    if item is None:
        return {
            "success": False,
            "message": "Curriculum record not found",
        }

    return {
        "success": True,
        "data": item,
    }


# ============================================================
# CREATE CURRICULUM
# ============================================================

@router.post("/")
def create_curriculum(
    request: CurriculumCreate,
):

    new_id = (
        max(
            item["id"]
            for item in CURRICULUM
        ) + 1
        if CURRICULUM
        else 1
    )

    skill_gap = max(
        0,
        request.industry_demand
        - request.alignment_score,
    )

    if request.alignment_score >= 80:
        status = "Good Alignment"

    elif request.alignment_score >= 70:
        status = "Needs Improvement"

    else:
        status = "Needs Update"

    new_item = {
        "id": new_id,
        "course": request.course,
        "subject": request.subject,
        "institution": request.institution,
        "alignment_score": request.alignment_score,
        "industry_demand": request.industry_demand,
        "skill_gap": skill_gap,
        "status": status,
        "skills": request.skills,
        "recommended_skills": request.recommended_skills,
    }

    CURRICULUM.append(new_item)

    return {
        "success": True,
        "message": "Curriculum record created successfully",
        "data": new_item,
    }


# ============================================================
# UPDATE CURRICULUM
# ============================================================

@router.put("/{curriculum_id}")
def update_curriculum(
    curriculum_id: int,
    request: CurriculumUpdate,
):

    item = next(
        (
            curriculum
            for curriculum in CURRICULUM
            if curriculum["id"] == curriculum_id
        ),
        None,
    )

    if item is None:
        return {
            "success": False,
            "message": "Curriculum record not found",
        }

    update_data = request.model_dump(
        exclude_none=True
    )

    for key, value in update_data.items():
        item[key] = value

    item["skill_gap"] = max(
        0,
        item["industry_demand"]
        - item["alignment_score"],
    )

    if item["alignment_score"] >= 80:
        item["status"] = "Good Alignment"

    elif item["alignment_score"] >= 70:
        item["status"] = "Needs Improvement"

    else:
        item["status"] = "Needs Update"

    return {
        "success": True,
        "message": "Curriculum updated successfully",
        "data": item,
    }


# ============================================================
# DELETE CURRICULUM
# ============================================================

@router.delete("/{curriculum_id}")
def delete_curriculum(curriculum_id: int):

    item = next(
        (
            curriculum
            for curriculum in CURRICULUM
            if curriculum["id"] == curriculum_id
        ),
        None,
    )

    if item is None:
        return {
            "success": False,
            "message": "Curriculum record not found",
        }

    CURRICULUM.remove(item)

    return {
        "success": True,
        "message": "Curriculum record deleted successfully",
    }