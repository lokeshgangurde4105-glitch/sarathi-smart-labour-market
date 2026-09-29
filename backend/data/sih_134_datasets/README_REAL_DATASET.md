# SARATHI - Real Dataset Integration (SIH 26134)

The real datasets supplied with the SARATHI project are stored in:

`backend/data/sih_134_datasets/`

## What was added

- `indian-job-market-dataset-2025 (1).xlsx` - supplied Indian job-market dataset.
- `indian_job_market_2025.csv` - CSV copy of the above, created so the FastAPI backend can read it without an Excel library.
- `ai_job_market_dataset.csv`
- `job_recommendation_dataset.csv`
- `skills_rows.csv`
- `Coursera_catalog.csv`
- `datacamp_courses.csv`
- `most-in-demand-job-skills-of-2026-analysis.ipynb`
- `DATASET_MANIFEST.json`

## Backend API

The backend now exposes:

- `GET /api/real-data/summary`
- `GET /api/real-data/indian-jobs?limit=50`
- `GET /api/real-data/skills?limit=50`
- `GET /api/real-data/job-recommendations?limit=50`
- `GET /api/real-data/ai-jobs?limit=50`

Optional filters are documented in the route file.

## Important

The existing SARATHI screens are intentionally not overwritten with the new dataset automatically. The existing UI can keep running while the real-data API is tested. Once the team confirms the correct columns for each screen, the frontend can replace individual mock arrays with these API responses safely.

## How to test

1. Open a terminal in the SARATHI project folder.
2. Start the backend using the existing `run_backend.bat`.
3. Open:
   `http://127.0.0.1:8000/docs`
4. Look for the **Real Dataset** section.
5. Test `/api/real-data/summary` first.
6. Then test `/api/real-data/indian-jobs`.

