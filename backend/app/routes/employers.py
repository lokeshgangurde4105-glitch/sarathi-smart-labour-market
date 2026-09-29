from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ============================================================
# EMPLOYER DATA
# ============================================================

EMPLOYERS = [
    {
        "id": 1,
        "name": "Tech Solutions Pvt Ltd",
        "industry": "Information Technology",
        "location": "Pune",
        "open_positions": 42,
        "top_skills": [
            "Python",
            "React",
            "SQL",
            "Cloud Computing",
        ],
        "hiring_status": "Active",
    },
    {
        "id": 2,
        "name": "Digital Innovations Ltd",
        "industry": "Information Technology",
        "location": "Mumbai",
        "open_positions": 31,
        "top_skills": [
            "Java",
            "Data Structures",
            "SQL",
            "Machine Learning",
        ],
        "hiring_status": "Active",
    },
    {
        "id": 3,
        "name": "AI Systems India",
        "industry": "Artificial Intelligence",
        "location": "Bangalore",
        "open_positions": 25,
        "top_skills": [
            "Python",
            "Machine Learning",
            "Generative AI",
            "Deep Learning",
        ],
        "hiring_status": "Active",
    },
    {
        "id": 4,
        "name": "CloudWorks Technologies",
        "industry": "Cloud & Infrastructure",
        "location": "Pune",
        "open_positions": 18,
        "top_skills": [
            "Cloud Computing",
            "Docker",
            "Kubernetes",
            "Linux",
        ],
        "hiring_status": "Active",
    },
]


# ============================================================
# EMPLOYER REQUEST MODEL
# ============================================================

class EmployerRequest(BaseModel):
    name: str
    industry: str
    location: str
    open_positions: int = 0
    top_skills: list[str] = []


# ============================================================
# GET ALL EMPLOYERS
# ============================================================

@router.get("/")
def get_employers(
    industry: Optional[str] = None,
    location: Optional[str] = None,
):
    """
    Return employers.

    Optional filters:
    ?industry=Information Technology
    ?location=Pune
    """

    results = EMPLOYERS

    if industry:
        results = [
            employer
            for employer in results
            if employer["industry"].lower()
            == industry.lower()
        ]

    if location:
        results = [
            employer
            for employer in results
            if employer["location"].lower()
            == location.lower()
        ]

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# GET EMPLOYER BY ID
# ============================================================

@router.get("/{employer_id}")
def get_employer(employer_id: int):

    for employer in EMPLOYERS:
        if employer["id"] == employer_id:
            return {
                "success": True,
                "data": employer,
            }

    raise HTTPException(
        status_code=404,
        detail="Employer not found",
    )


# ============================================================
# EMPLOYER SKILL DEMAND
# ============================================================

@router.get("/{employer_id}/skills")
def get_employer_skills(employer_id: int):

    for employer in EMPLOYERS:

        if employer["id"] == employer_id:

            return {
                "success": True,
                "employer": employer["name"],
                "skills": employer["top_skills"],
            }

    raise HTTPException(
        status_code=404,
        detail="Employer not found",
    )


# ============================================================
# EMPLOYER SUMMARY
# ============================================================

@router.get("/summary/overview")
def employer_summary():

    total_employers = len(EMPLOYERS)

    total_positions = sum(
        employer["open_positions"]
        for employer in EMPLOYERS
    )

    active_employers = sum(
        1
        for employer in EMPLOYERS
        if employer["hiring_status"] == "Active"
    )

    return {
        "success": True,
        "data": {
            "total_employers": total_employers,
            "active_employers": active_employers,
            "total_open_positions": total_positions,
        },
    }


# ============================================================
# EMPLOYER MODULE STATUS
# ============================================================

@router.get("/status/check")
def employer_status():

    return {
        "success": True,
        "module": "employers",
        "status": "working",
    }