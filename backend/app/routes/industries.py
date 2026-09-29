from fastapi import APIRouter
from typing import Optional

router = APIRouter()


# ============================================================
# INDUSTRY DATA
# ============================================================

INDUSTRIES = [
    {
        "id": 1,
        "name": "Information Technology",
        "short_name": "IT",
        "demand": 92,
        "growth": "+18%",
        "jobs": 4250,
        "top_skills": [
            "Python",
            "Cloud Computing",
            "SQL",
            "React",
            "Generative AI",
        ],
        "status": "High Demand",
    },
    {
        "id": 2,
        "name": "Banking & Financial Services",
        "short_name": "BFSI",
        "demand": 84,
        "growth": "+12%",
        "jobs": 3180,
        "top_skills": [
            "SQL",
            "Data Analytics",
            "Python",
            "Cybersecurity",
            "Cloud Computing",
        ],
        "status": "Growing",
    },
    {
        "id": 3,
        "name": "Healthcare",
        "short_name": "Healthcare",
        "demand": 78,
        "growth": "+15%",
        "jobs": 2640,
        "top_skills": [
            "Data Analytics",
            "AI",
            "Healthcare Technology",
            "Python",
            "Cloud Computing",
        ],
        "status": "Growing",
    },
    {
        "id": 4,
        "name": "Manufacturing",
        "short_name": "Manufacturing",
        "demand": 74,
        "growth": "+9%",
        "jobs": 2875,
        "top_skills": [
            "IoT",
            "Automation",
            "Data Analytics",
            "Robotics",
            "Cloud Computing",
        ],
        "status": "Stable",
    },
    {
        "id": 5,
        "name": "Telecommunications",
        "short_name": "Telecom",
        "demand": 81,
        "growth": "+13%",
        "jobs": 1920,
        "top_skills": [
            "Cloud Computing",
            "Networking",
            "Cybersecurity",
            "Python",
            "5G Technology",
        ],
        "status": "Growing",
    },
]


# ============================================================
# GET ALL INDUSTRIES
# ============================================================

@router.get("/")
def get_industries(
    search: Optional[str] = None,
):

    results = INDUSTRIES

    if search:
        search_text = search.lower()

        results = [
            industry
            for industry in results
            if search_text in industry["name"].lower()
            or search_text in industry["short_name"].lower()
        ]

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# GET INDUSTRY BY ID
# ============================================================

@router.get("/{industry_id}")
def get_industry(industry_id: int):

    industry = next(
        (
            item
            for item in INDUSTRIES
            if item["id"] == industry_id
        ),
        None,
    )

    if industry is None:
        return {
            "success": False,
            "message": "Industry not found",
        }

    return {
        "success": True,
        "data": industry,
    }


# ============================================================
# TOP INDUSTRIES
# ============================================================

@router.get("/analytics/top")
def get_top_industries():

    results = sorted(
        INDUSTRIES,
        key=lambda x: x["demand"],
        reverse=True,
    )

    return {
        "success": True,
        "data": results,
    }


# ============================================================
# FASTEST GROWING INDUSTRIES
# ============================================================

@router.get("/analytics/growth")
def get_industry_growth():

    def growth_value(item):
        return float(
            item["growth"]
            .replace("+", "")
            .replace("%", "")
        )

    results = sorted(
        INDUSTRIES,
        key=growth_value,
        reverse=True,
    )

    return {
        "success": True,
        "data": results,
    }


# ============================================================
# INDUSTRY SKILLS
# ============================================================

@router.get("/{industry_id}/skills")
def get_industry_skills(industry_id: int):

    industry = next(
        (
            item
            for item in INDUSTRIES
            if item["id"] == industry_id
        ),
        None,
    )

    if industry is None:
        return {
            "success": False,
            "message": "Industry not found",
        }

    return {
        "success": True,
        "industry": industry["name"],
        "data": industry["top_skills"],
    }


# ============================================================
# INDUSTRY SUMMARY
# ============================================================

@router.get("/analytics/summary")
def get_industry_summary():

    total_jobs = sum(
        item["jobs"]
        for item in INDUSTRIES
    )

    average_demand = round(
        sum(
            item["demand"]
            for item in INDUSTRIES
        )
        / len(INDUSTRIES)
    )

    highest_demand = max(
        INDUSTRIES,
        key=lambda x: x["demand"],
    )

    fastest_growth = max(
        INDUSTRIES,
        key=lambda x: float(
            x["growth"]
            .replace("+", "")
            .replace("%", "")
        ),
    )

    return {
        "success": True,
        "data": {
            "industries_tracked": len(INDUSTRIES),
            "total_jobs": total_jobs,
            "average_demand": average_demand,
            "highest_demand_industry": highest_demand["name"],
            "fastest_growing_industry": fastest_growth["name"],
        },
    }


# ============================================================
# MODULE STATUS
# ============================================================

@router.get("/status/check")
def industries_status():

    return {
        "success": True,
        "module": "industries",
        "status": "working",
    }