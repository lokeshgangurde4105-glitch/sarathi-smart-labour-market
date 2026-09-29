from fastapi import APIRouter, Query
from typing import Dict, List, Any

router = APIRouter()


# ============================================================
# DASHBOARD DATA
# ============================================================

DASHBOARD_DATA = {

    "All States": {
        "All Sectors": {
            "total_jobs": 1248,
            "active_jobs": 856,
            "skills_tracked": 126,
            "emerging_skills": 18,
            "students_analyzed": 3420,
            "industry_partners": 74,
            "overall_skill_gap": 32,
            "curriculum_alignment": 68,
        },

        "IT & Software": {
            "total_jobs": 720,
            "active_jobs": 510,
            "skills_tracked": 82,
            "emerging_skills": 14,
            "students_analyzed": 1840,
            "industry_partners": 42,
            "overall_skill_gap": 38,
            "curriculum_alignment": 64,
        },

        "Healthcare": {
            "total_jobs": 310,
            "active_jobs": 208,
            "skills_tracked": 46,
            "emerging_skills": 7,
            "students_analyzed": 820,
            "industry_partners": 18,
            "overall_skill_gap": 29,
            "curriculum_alignment": 72,
        },

        "Manufacturing": {
            "total_jobs": 218,
            "active_jobs": 138,
            "skills_tracked": 38,
            "emerging_skills": 5,
            "students_analyzed": 560,
            "industry_partners": 14,
            "overall_skill_gap": 35,
            "curriculum_alignment": 66,
        },
    },


    # ========================================================
    # MAHARASHTRA
    # ========================================================

    "Maharashtra": {

        "All Sectors": {
            "total_jobs": 428,
            "active_jobs": 292,
            "skills_tracked": 74,
            "emerging_skills": 11,
            "students_analyzed": 1180,
            "industry_partners": 31,
            "overall_skill_gap": 34,
            "curriculum_alignment": 66,
        },

        "IT & Software": {
            "total_jobs": 265,
            "active_jobs": 184,
            "skills_tracked": 51,
            "emerging_skills": 9,
            "students_analyzed": 720,
            "industry_partners": 22,
            "overall_skill_gap": 39,
            "curriculum_alignment": 63,
        },

        "Healthcare": {
            "total_jobs": 86,
            "active_jobs": 57,
            "skills_tracked": 24,
            "emerging_skills": 4,
            "students_analyzed": 260,
            "industry_partners": 6,
            "overall_skill_gap": 28,
            "curriculum_alignment": 73,
        },

        "Manufacturing": {
            "total_jobs": 77,
            "active_jobs": 51,
            "skills_tracked": 19,
            "emerging_skills": 3,
            "students_analyzed": 200,
            "industry_partners": 7,
            "overall_skill_gap": 36,
            "curriculum_alignment": 65,
        },
    },


    # ========================================================
    # KARNATAKA
    # ========================================================

    "Karnataka": {

        "All Sectors": {
            "total_jobs": 386,
            "active_jobs": 271,
            "skills_tracked": 69,
            "emerging_skills": 13,
            "students_analyzed": 980,
            "industry_partners": 27,
            "overall_skill_gap": 29,
            "curriculum_alignment": 71,
        },

        "IT & Software": {
            "total_jobs": 292,
            "active_jobs": 210,
            "skills_tracked": 57,
            "emerging_skills": 11,
            "students_analyzed": 760,
            "industry_partners": 21,
            "overall_skill_gap": 31,
            "curriculum_alignment": 70,
        },

        "Healthcare": {
            "total_jobs": 52,
            "active_jobs": 34,
            "skills_tracked": 19,
            "emerging_skills": 3,
            "students_analyzed": 120,
            "industry_partners": 4,
            "overall_skill_gap": 25,
            "curriculum_alignment": 75,
        },

        "Manufacturing": {
            "total_jobs": 42,
            "active_jobs": 27,
            "skills_tracked": 15,
            "emerging_skills": 2,
            "students_analyzed": 100,
            "industry_partners": 2,
            "overall_skill_gap": 30,
            "curriculum_alignment": 69,
        },
    },


    # ========================================================
    # DELHI
    # ========================================================

    "Delhi": {

        "All Sectors": {
            "total_jobs": 224,
            "active_jobs": 151,
            "skills_tracked": 52,
            "emerging_skills": 8,
            "students_analyzed": 640,
            "industry_partners": 16,
            "overall_skill_gap": 31,
            "curriculum_alignment": 69,
        },

        "IT & Software": {
            "total_jobs": 128,
            "active_jobs": 91,
            "skills_tracked": 37,
            "emerging_skills": 6,
            "students_analyzed": 350,
            "industry_partners": 9,
            "overall_skill_gap": 34,
            "curriculum_alignment": 67,
        },

        "Healthcare": {
            "total_jobs": 58,
            "active_jobs": 37,
            "skills_tracked": 18,
            "emerging_skills": 3,
            "students_analyzed": 180,
            "industry_partners": 4,
            "overall_skill_gap": 27,
            "curriculum_alignment": 74,
        },

        "Manufacturing": {
            "total_jobs": 38,
            "active_jobs": 23,
            "skills_tracked": 13,
            "emerging_skills": 2,
            "students_analyzed": 110,
            "industry_partners": 3,
            "overall_skill_gap": 33,
            "curriculum_alignment": 68,
        },
    },


    # ========================================================
    # TAMIL NADU
    # ========================================================

    "Tamil Nadu": {

        "All Sectors": {
            "total_jobs": 342,
            "active_jobs": 224,
            "skills_tracked": 64,
            "emerging_skills": 10,
            "students_analyzed": 910,
            "industry_partners": 24,
            "overall_skill_gap": 33,
            "curriculum_alignment": 67,
        },

        "IT & Software": {
            "total_jobs": 192,
            "active_jobs": 132,
            "skills_tracked": 43,
            "emerging_skills": 8,
            "students_analyzed": 510,
            "industry_partners": 15,
            "overall_skill_gap": 36,
            "curriculum_alignment": 65,
        },

        "Healthcare": {
            "total_jobs": 76,
            "active_jobs": 48,
            "skills_tracked": 17,
            "emerging_skills": 3,
            "students_analyzed": 220,
            "industry_partners": 5,
            "overall_skill_gap": 28,
            "curriculum_alignment": 72,
        },

        "Manufacturing": {
            "total_jobs": 74,
            "active_jobs": 44,
            "skills_tracked": 16,
            "emerging_skills": 3,
            "students_analyzed": 180,
            "industry_partners": 4,
            "overall_skill_gap": 35,
            "curriculum_alignment": 64,
        },
    },
}


# ============================================================
# ROLE DATA
# ============================================================

ROLE_DATA = {

    "IT & Software": {
        "salary": [
            {"role": "AI/ML Engineer", "min": 12, "mid": 18, "max": 32},
            {"role": "Cloud Architect", "min": 10, "mid": 16, "max": 28},
            {"role": "Data Engineer", "min": 8, "mid": 14, "max": 22},
            {"role": "Cybersecurity Analyst", "min": 7, "mid": 12, "max": 20},
            {"role": "Full Stack Developer", "min": 6, "mid": 10, "max": 18},
            {"role": "Data Analyst", "min": 5, "mid": 8, "max": 14},
        ],

        "emerging": [
            {"tech": "Generative AI / LLMs", "growth": 127, "jobs": 1840},
            {"tech": "Cloud-Native / K8s", "growth": 84, "jobs": 1620},
            {"tech": "Cybersecurity / Zero Trust", "growth": 62, "jobs": 1380},
            {"tech": "Data Engineering", "growth": 58, "jobs": 1120},
        ],

        "declining": [
            {"role": "Basic Data Entry", "change": -28, "jobs": 220},
            {"role": "Manual Testing", "change": -18, "jobs": 480},
            {"role": "Desktop Support", "change": -15, "jobs": 380},
            {"role": "Traditional Tele-sales", "change": -22, "jobs": 340},
        ],
    },

    "Healthcare": {
        "salary": [
            {"role": "Clinical Data Analyst", "min": 6, "mid": 10, "max": 18},
            {"role": "Health Informatics", "min": 7, "mid": 12, "max": 20},
            {"role": "Medical AI", "min": 9, "mid": 15, "max": 26},
            {"role": "Healthcare Admin", "min": 4, "mid": 7, "max": 12},
            {"role": "Lab Technician", "min": 3, "mid": 5, "max": 9},
        ],

        "emerging": [
            {"tech": "Digital Health", "growth": 72, "jobs": 920},
            {"tech": "Health Informatics", "growth": 61, "jobs": 780},
            {"tech": "Medical AI", "growth": 55, "jobs": 620},
            {"tech": "Telemedicine", "growth": 43, "jobs": 510},
        ],

        "declining": [
            {"role": "Manual Records", "change": -24, "jobs": 180},
            {"role": "Basic Data Entry", "change": -20, "jobs": 140},
            {"role": "Manual Scheduling", "change": -16, "jobs": 120},
        ],
    },

    "Manufacturing": {
        "salary": [
            {"role": "Automation Engineer", "min": 6, "mid": 11, "max": 18},
            {"role": "Robotics Engineer", "min": 7, "mid": 13, "max": 22},
            {"role": "EV Technician", "min": 4, "mid": 8, "max": 14},
            {"role": "Industrial IoT", "min": 6, "mid": 12, "max": 20},
            {"role": "Production Engineer", "min": 4, "mid": 8, "max": 13},
        ],

        "emerging": [
            {"tech": "Industrial IoT", "growth": 76, "jobs": 980},
            {"tech": "Robotics", "growth": 64, "jobs": 840},
            {"tech": "EV Manufacturing", "growth": 59, "jobs": 740},
            {"tech": "Green Manufacturing", "growth": 38, "jobs": 620},
        ],

        "declining": [
            {"role": "Manual Assembly", "change": -21, "jobs": 420},
            {"role": "Basic Inspection", "change": -18, "jobs": 280},
            {"role": "Manual Inventory", "change": -14, "jobs": 210},
        ],
    },
}


# ============================================================
# DISTRICT DATA
# ============================================================

DISTRICT_DATA = {

    "Maharashtra": [
        {
            "district": "Pune",
            "sector": "IT",
            "topRole": "Data Engineer",
            "demand": 2840,
            "supply": 1920,
            "gap": "High",
            "placement": "72%",
            "salaryRange": "₹6L–₹22L",
        },
        {
            "district": "Mumbai",
            "sector": "BFSI",
            "topRole": "Data Analyst",
            "demand": 1800,
            "supply": 1200,
            "gap": "Medium",
            "placement": "74%",
            "salaryRange": "₹5L–₹14L",
        },
        {
            "district": "Nashik",
            "sector": "Manufacturing",
            "topRole": "Automation Engineer",
            "demand": 920,
            "supply": 510,
            "gap": "High",
            "placement": "66%",
            "salaryRange": "₹4L–₹15L",
        },
    ],

    "Karnataka": [
        {
            "district": "Bengaluru",
            "sector": "IT",
            "topRole": "AI/ML Engineer",
            "demand": 4200,
            "supply": 2400,
            "gap": "Critical",
            "placement": "78%",
            "salaryRange": "₹8L–₹32L",
        },
        {
            "district": "Mysuru",
            "sector": "IT",
            "topRole": "Full Stack Developer",
            "demand": 980,
            "supply": 620,
            "gap": "High",
            "placement": "69%",
            "salaryRange": "₹5L–₹18L",
        },
    ],

    "Delhi": [
        {
            "district": "New Delhi",
            "sector": "IT",
            "topRole": "Cloud Architect",
            "demand": 1600,
            "supply": 900,
            "gap": "High",
            "placement": "71%",
            "salaryRange": "₹7L–₹28L",
        },
        {
            "district": "Central Delhi",
            "sector": "Healthcare",
            "topRole": "Health Informatics",
            "demand": 720,
            "supply": 510,
            "gap": "Medium",
            "placement": "73%",
            "salaryRange": "₹6L–₹18L",
        },
    ],

    "Tamil Nadu": [
        {
            "district": "Chennai",
            "sector": "IT",
            "topRole": "Cloud Engineer",
            "demand": 1900,
            "supply": 1180,
            "gap": "High",
            "placement": "70%",
            "salaryRange": "₹6L–₹24L",
        },
        {
            "district": "Coimbatore",
            "sector": "Manufacturing",
            "topRole": "Automation Engineer",
            "demand": 1100,
            "supply": 680,
            "gap": "High",
            "placement": "67%",
            "salaryRange": "₹4L–₹16L",
        },
    ],
}


# ============================================================
# HELPERS
# ============================================================

def get_dashboard_data(state: str, sector: str):

    state_data = DASHBOARD_DATA.get(
        state,
        DASHBOARD_DATA["All States"]
    )

    return state_data.get(
        sector,
        state_data["All Sectors"]
    )


def get_sector_role_data(sector: str):

    if sector in ROLE_DATA:
        return ROLE_DATA[sector]

    return ROLE_DATA["IT & Software"]


def get_all_sector_names():

    return [
        "IT & Software",
        "Healthcare",
        "Manufacturing",
    ]


# ============================================================
# SUMMARY
# ============================================================

@router.get("/summary")
def get_dashboard_summary(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
    search: str = Query(""),
):

    data = get_dashboard_data(state, sector)

    return {
        "success": True,
        "data": {
            **data,
            "selected_state": state,
            "selected_sector": sector,
            "search": search.strip(),
        },
    }


# ============================================================
# JOB MARKET
# ============================================================

@router.get("/job-market")
def get_job_market(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    data = get_dashboard_data(state, sector)

    total_jobs = data["total_jobs"]

    return {
        "success": True,
        "data": {
            "total_jobs": total_jobs,
            "new_jobs_this_month": round(total_jobs * 0.147),
            "growth_rate": round(
                12 + data["emerging_skills"] * 0.4,
                1
            ),
            "top_category": (
                sector
                if sector != "All Sectors"
                else "IT & Software"
            ),
            "market_status": "Growing",
            "selected_state": state,
            "selected_sector": sector,
        },
    }


# ============================================================
# SKILL GAP
# ============================================================

@router.get("/skill-gap")
def get_skill_gap(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    data = get_dashboard_data(state, sector)

    overall_gap = data["overall_skill_gap"]

    return {
        "success": True,
        "data": {
            "overall_gap": overall_gap,
            "technical_gap": max(0, overall_gap - 4),
            "soft_skill_gap": max(0, overall_gap - 11),
            "emerging_skill_gap": min(
                60,
                overall_gap + 13
            ),
            "status": (
                "Critical"
                if overall_gap >= 40
                else "High"
                if overall_gap >= 35
                else "Moderate"
            ),
            "selected_state": state,
            "selected_sector": sector,
        },
    }


# ============================================================
# CURRICULUM
# ============================================================

@router.get("/curriculum")
def get_curriculum_alignment(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    data = get_dashboard_data(state, sector)

    alignment = data["curriculum_alignment"]

    return {
        "success": True,
        "data": {
            "alignment_score": alignment,
            "aligned_courses": round(
                alignment * 0.62
            ),
            "courses_needing_update": max(
                1,
                round(
                    (100 - alignment) * 0.55
                )
            ),
            "outdated_courses": max(
                1,
                round(
                    (100 - alignment) * 0.20
                )
            ),
            "status": (
                "Strong Alignment"
                if alignment >= 75
                else "Partial Alignment"
                if alignment >= 60
                else "Needs Improvement"
            ),
            "selected_state": state,
            "selected_sector": sector,
        },
    }


# ============================================================
# TRENDS
# ============================================================

@router.get("/trends")
def get_dashboard_trends(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
    period: str = Query("12M"),
):

    data = get_dashboard_data(state, sector)

    total_jobs = data["total_jobs"]
    skills = data["skills_tracked"]
    alignment = data["curriculum_alignment"]
    active_jobs = data["active_jobs"]
    emerging_skills = data["emerging_skills"]

    all_months = [
        ("Jan", 0.66, 0.75, 10),
        ("Feb", 0.70, 0.79, 8),
        ("Mar", 0.76, 0.83, 6),
        ("Apr", 0.82, 0.88, 4),
        ("May", 0.91, 0.94, 2),
        ("Jun", 1.00, 1.00, 0),
        ("Jul", 1.04, 1.03, -1),
        ("Aug", 1.08, 1.06, -2),
        ("Sep", 1.12, 1.09, -3),
        ("Oct", 1.16, 1.12, -4),
        ("Nov", 1.20, 1.15, -5),
        ("Dec", 1.24, 1.18, -6),
    ]

    if period == "3M":
        selected_months = all_months[-3:]
    elif period == "6M":
        selected_months = all_months[-6:]
    else:
        selected_months = all_months

    result = []

    for month, job_factor, skill_factor, alignment_change in selected_months:

        postings = round(total_jobs * job_factor)

        high_demand = round(
            active_jobs * (
                0.72 + (job_factor - 0.66) * 0.30
            )
        )

        emerging = round(
            emerging_skills * (
                0.65 + (skill_factor - 0.75) * 0.35
            )
        )

        result.append({
            "month": month,
            "postings": postings,
            "highDemand": high_demand,
            "emerging": emerging,
            "jobs": postings,
            "skills": round(skills * skill_factor),
            "alignment": max(
                45,
                min(
                    100,
                    alignment + alignment_change
                )
            ),
        })

    return {
        "success": True,
        "data": result,
        "selected_state": state,
        "selected_sector": sector,
        "period": period,
    }


# ============================================================
# SECTOR DISTRIBUTION
# ============================================================

@router.get("/sector-distribution")
def get_sector_distribution(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    state_data = DASHBOARD_DATA.get(
        state,
        DASHBOARD_DATA["All States"]
    )

    if sector != "All Sectors":

        selected = state_data.get(
            sector,
            {}
        )

        return {
            "success": True,
            "data": [
                {
                    "name": sector,
                    "value": 100,
                    "color": "#1D4ED8",
                }
            ],
        }

    sector_colors = {
        "IT & Software": "#1D4ED8",
        "Healthcare": "#0D9488",
        "Manufacturing": "#7C3AED",
        "BFSI": "#D97706",
        "Others": "#64748B",
    }

    values = {}

    for sector_name in get_all_sector_names():

        values[sector_name] = state_data.get(
            sector_name,
            {}
        ).get(
            "total_jobs",
            0
        )

    # Add BFSI and Others only for broader All-State data.
    if state == "All States":

        values["BFSI"] = 175
        values["Others"] = 100

    total = sum(values.values())

    result = []

    for name, value in values.items():

        percentage = round(
            (value / total) * 100
        ) if total else 0

        result.append({
            "name": name,
            "value": percentage,
            "jobs": value,
            "color": sector_colors.get(
                name,
                "#64748B"
            ),
        })

    return {
        "success": True,
        "data": result,
        "selected_state": state,
        "selected_sector": sector,
    }


# ============================================================
# TOP GROWING ROLES
# ============================================================

@router.get("/top-roles")
def get_top_roles(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
    search: str = Query(""),
):

    result = []

    sector_list = (
        get_all_sector_names()
        if sector == "All Sectors"
        else [sector]
    )

    for sector_name in sector_list:

        sector_data = get_sector_role_data(
            sector_name
        )

        for index, item in enumerate(
            sector_data["emerging"]
        ):

            result.append({
                "role": item["tech"],
                "sector": sector_name,
                "demand": item["jobs"],
                "growth": f'+{item["growth"]}%',
                "gap": (
                    "Critical"
                    if item["growth"] >= 100
                    else "High"
                    if item["growth"] >= 60
                    else "Medium"
                ),
            })

    # Scale roles according to selected state.
    if state != "All States":

        state_total = DASHBOARD_DATA.get(
            state,
            {}
        ).get(
            "All Sectors",
            {}
        ).get(
            "total_jobs",
            1
        )

        national_total = DASHBOARD_DATA[
            "All States"
        ]["All Sectors"]["total_jobs"]

        multiplier = state_total / national_total

        for item in result:
            item["demand"] = round(
                item["demand"] * multiplier
            )

    search_text = search.strip().lower()

    if search_text:

        result = [
            item
            for item in result
            if search_text in item["role"].lower()
            or search_text in item["sector"].lower()
        ]

    result.sort(
        key=lambda x: x["demand"],
        reverse=True
    )

    return {
        "success": True,
        "data": result[:8],
        "selected_state": state,
        "selected_sector": sector,
    }


# ============================================================
# EMERGING TECHNOLOGIES
# ============================================================

@router.get("/emerging")
def get_emerging_technologies(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    sector_names = (
        get_all_sector_names()
        if sector == "All Sectors"
        else [sector]
    )

    result = []

    for sector_name in sector_names:

        sector_data = get_sector_role_data(
            sector_name
        )

        for item in sector_data["emerging"]:

            result.append({
                "tech": item["tech"],
                "growth": f'+{item["growth"]}%',
                "jobs": item["jobs"],
                "sector": sector_name,
            })

    if state != "All States":

        state_total = get_dashboard_data(
            state,
            "All Sectors"
        )["total_jobs"]

        national_total = DASHBOARD_DATA[
            "All States"
        ]["All Sectors"]["total_jobs"]

        multiplier = (
            state_total /
            national_total
        )

        for item in result:
            item["jobs"] = round(
                item["jobs"] * multiplier
            )

    result.sort(
        key=lambda x: x["jobs"],
        reverse=True
    )

    return {
        "success": True,
        "data": result[:8],
    }


# ============================================================
# SALARY
# ============================================================

@router.get("/salary")
def get_salary_trends(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    if sector == "All Sectors":

        combined = []

        for sector_name in get_all_sector_names():

            combined.extend(
                get_sector_role_data(
                    sector_name
                )["salary"]
            )

        return {
            "success": True,
            "data": combined[:8],
        }

    return {
        "success": True,
        "data": get_sector_role_data(
            sector
        )["salary"],
    }


# ============================================================
# DECLINING ROLES
# ============================================================

@router.get("/declining")
def get_declining_roles(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    sector_names = (
        get_all_sector_names()
        if sector == "All Sectors"
        else [sector]
    )

    result = []

    for sector_name in sector_names:

        for item in get_sector_role_data(
            sector_name
        )["declining"]:

            result.append({
                **item,
                "change": f'{item["change"]}%',
                "sector": sector_name,
            })

    result.sort(
        key=lambda x: x["jobs"],
        reverse=True
    )

    return {
        "success": True,
        "data": result[:8],
    }


# ============================================================
# DISTRICTS
# ============================================================

@router.get("/districts")
def get_district_intelligence(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    if state != "All States":

        districts = DISTRICT_DATA.get(
            state,
            []
        )

    else:

        districts = []

        for state_districts in DISTRICT_DATA.values():

            districts.extend(
                state_districts
            )

    if sector != "All Sectors":

        sector_short = {
            "IT & Software": "IT",
            "Healthcare": "Healthcare",
            "Manufacturing": "Manufacturing",
        }.get(
            sector,
            sector
        )

        districts = [
            row
            for row in districts
            if row["sector"] == sector_short
            or row["sector"] == sector
        ]

    return {
        "success": True,
        "data": districts,
    }


# ============================================================
# AI ALERTS
# ============================================================

@router.get("/alerts")
def get_dashboard_alerts(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    data = get_dashboard_data(
        state,
        sector
    )

    alerts = []

    gap = data["overall_skill_gap"]
    alignment = data["curriculum_alignment"]

    if gap >= 35:

        alerts.append({
            "type": "critical",
            "text": (
                f"Skill gap is {gap}% in "
                f"{state} for {sector}."
            ),
        })

    elif gap >= 30:

        alerts.append({
            "type": "high",
            "text": (
                f"Skill gap is {gap}% and "
                f"requires targeted training."
            ),
        })

    if alignment < 68:

        alerts.append({
            "type": "high",
            "text": (
                f"Curriculum alignment is only "
                f"{alignment}%."
            ),
        })

    if data["emerging_skills"] >= 10:

        alerts.append({
            "type": "medium",
            "text": (
                f"{data['emerging_skills']} emerging "
                f"skills identified in the selected market."
            ),
        })

    alerts.append({
        "type": "info",
        "text": (
            f"{data['active_jobs']:,} active jobs are "
            f"currently tracked."
        ),
    })

    return {
        "success": True,
        "data": alerts[:4],
        "selected_state": state,
        "selected_sector": sector,
    }


# ============================================================
# DATA SOURCES
# ============================================================

@router.get("/sources")
def get_dashboard_sources(
    state: str = Query("All States"),
    sector: str = Query("All Sectors"),
):

    data = get_dashboard_data(
        state,
        sector
    )

    return {
        "success": True,
        "data": [
            {
                "name": "Job Portal APIs",
                "records": f'{data["total_jobs"]:,}',
                "updated": "2 min ago",
                "status": "live",
            },
            {
                "name": "Employer Surveys",
                "records": f'{data["industry_partners"] * 11:,}',
                "updated": "1 hr ago",
                "status": "live",
            },
            {
                "name": "Industry Consultations",
                "records": f'{data["industry_partners"] * 2:,}',
                "updated": "1 day ago",
                "status": "live",
            },
            {
                "name": "Placement Outcomes",
                "records": f'{data["students_analyzed"] * 2:,}',
                "updated": "6 hrs ago",
                "status": "live",
            },
            {
                "name": "Emerging Tech Reports",
                "records": f'{data["emerging_skills"] * 13:,}',
                "updated": "3 hrs ago",
                "status": "live",
            },
            {
                "name": "Govt. Census Data",
                "records": "52M+",
                "updated": "30 days ago",
                "status": "cached",
            },
        ],
    }