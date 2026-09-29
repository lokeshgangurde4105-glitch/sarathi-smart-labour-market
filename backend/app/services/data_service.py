# ============================================================
# DEMAND & TRENDS DATA
# ============================================================

def get_dashboard_data(
    state: str = "All States",
    sector: str = "All Sectors",
) -> dict[str, Any]:

    # Start with all jobs
    filtered_jobs = JOBS.copy()

    # State filter
    if state != "All States":
        filtered_jobs = [
            job
            for job in filtered_jobs
            if job["location"].lower() == state.lower()
        ]

    # Sector filter
    if sector != "All Sectors":
        filtered_jobs = [
            job
            for job in filtered_jobs
            if job["sector"].lower() == sector.lower()
        ]

    # Calculate job demand
    total_jobs = sum(
        job["posting_count"]
        for job in filtered_jobs
    )

    # Calculate skill data
    skills_tracked = len(SKILLS)

    # Calculate curriculum alignment
    if filtered_jobs:
        avg_growth = sum(
            job["growth_rate"]
            for job in filtered_jobs
        ) / len(filtered_jobs)

        curriculum_alignment = min(
            100,
            max(50, round(60 + avg_growth))
        )
    else:
        curriculum_alignment = 50

    return {
        "total_jobs": total_jobs,
        "skills_tracked": skills_tracked,
        "curriculum_alignment": curriculum_alignment,
    }