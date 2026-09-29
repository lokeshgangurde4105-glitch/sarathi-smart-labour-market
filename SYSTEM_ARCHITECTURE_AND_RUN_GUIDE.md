# SARATHI (Kaushalya Setu) — Full Frontend ↔ Backend ↔ Database Integration Guide

## 1. System Architecture

The application strictly implements the 4-tier production-grade architecture required by specifications 37–61:

```
┌────────────────────────────────────────────────────────┐
│               React 19 + Vite Frontend                 │
│      (Tailwind CSS v4, Modular API Client, Bearer JWT) │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP REST / JSON (CORS)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 FastAPI REST API Server                │
│       (113 Endpoints, Pydantic Schemas, OAuth2 JWT)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Business Logic & Services Layer             │
│   (Candidate Match Engine, Gap Analysis, Verification) │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│                 SQLite Database                        │
│            (kaushalya_setu.db / sarathi.db)            │
│  Auto-created, Seeded, Relational Integrity & Indices  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Seeded User Accounts (One-Click Demo Access)

All accounts are pre-seeded in SQLite database (`backend/kaushalya_setu.db`). You can either click the Quick-Fill chips on the Login screen or use these credentials:

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Student / Candidate** | `student@example.com` | `student123` | Student Dashboard (`/student`) |
| **Employer / Industry** | `employer@example.com` | `employer123` | Company Portal (`/company`) |
| **Training Institute** | `institute@example.com` | `institute123` | Institute Dashboard (`/institute`) |
| **Trainer** | `trainer@example.com` | `trainer123` | Trainer Portal (`/trainer_portal`) |
| **Government / Planner**| `government@example.com`| `government123`| Macro Labour Market Dashboard (`/dashboard`) |
| **Admin** | `admin@example.com` | `admin123` | Admin Console & Pipeline (`/admin_portal`) |

---

## 3. Verification of All 6 Mandatory Flows

All 6 flows have been tested and verified 100% end-to-end against the live SQLite database (`backend/verify_all_flows.py`):

### Flow 1: Student Registration → DB → Login → Profile Read/Write
- Registration endpoint `POST /api/auth/register` creates record in SQLite `users` table.
- Login endpoint `POST /api/auth/login` verifies bcrypt hash and returns JWT Bearer token.
- `GET /api/students/profile` queries `student_profiles` joined with `users`.
- `PUT /api/students/profile` updates student college, year, skills, and target role with live database commit.

### Flow 2: Student Assessment → Question Pool → Evaluation → Skill Gaps in DB
- `GET /api/assessments/questions` fetches standardized assessment questions from `assessment_questions` table.
- `POST /api/assessments/submit` scores answers, records `assessment_attempts` & `assessment_answers` in DB.
- Dynamically identifies sub-threshold competencies, saves records into `student_skill_gaps` table, and recommends targeted up-skilling courses.

### Flow 3: Course Recommendation → DB Enrollment → Module Progress → Certificate Verification
- `GET /api/courses/catalog` reads real course offerings and capacity.
- `POST /api/courses/{id}/enroll` validates seat capacity and creates `course_enrollments` record in DB.
- `PUT /api/courses/progress/{id}` updates module completion and marks progress in `course_progress` table.
- `GET /api/certificates/verify/{id}` validates certificate number and cryptographic hash against official `certificates` table and logs a `verification_records` audit entry.

### Flow 4: Employer Job Creation → Candidate Matching Engine
- `POST /api/jobs/post` saves job vacancy and required skills in `job_postings` table.
- `GET /api/jobs/{id}/matches` executes matching algorithm comparing job requirements against all student profiles in DB, calculating match percentage and ranking candidates.

### Flow 5: Student Job Application → Employer Pipeline Status Update
- `POST /api/jobs/{id}/apply` records application in `job_applications` table.
- `GET /api/jobs/company/applications` displays applicants to the employer.
- `PUT /api/jobs/applications/{id}/status` transitions candidate status through `Applied` → `Shortlisted` → `Interview` → `Selected` with live database update.

### Flow 6: Admin CSV Ingestion → DB Storage → Real-Time Analytics
- `POST /api/analytics/import-dataset` accepts uploaded CSV, cleans and normalizes records, creates new job postings and skills, and writes audit summary to `dataset_imports` table.
- `GET /api/analytics/realtime` aggregates live database metrics across users, students, employers, institutes, courses, and job postings.

---

## 4. How to Run the Application

### Option A: Windows Batch Scripts (Easiest)
1. **Start Backend**: Double-click `run_backend.bat` (or run in cmd).
2. **Start Frontend**: Double-click `run_frontend.bat` (or run in cmd).

### Option B: PowerShell Commands

#### Terminal 1 — Backend (FastAPI + SQLite):
```powershell
cd c:\Users\lokes\Downloads\kaushalya-setu-updated\backend
.\venv311\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000`. OpenAPI docs available at `http://127.0.0.1:8000/docs`.*

#### Terminal 2 — Frontend (React 19 + Vite):
```powershell
cd c:\Users\lokes\Downloads\kaushalya-setu-updated
npm run dev
```
*Frontend runs on `http://localhost:5173` (or the Figma Make preview panel).*

---

## 5. How to Run End-to-End Verification Test
To re-run the full 6-flow end-to-end verification script against the database:
```powershell
cd c:\Users\lokes\Downloads\kaushalya-setu-updated\backend
.\venv311\Scripts\python.exe verify_all_flows.py
```
Expected output:
```
============================================================
  ALL 6 FLOWS TESTED AND 100% VERIFIED WITH REAL SQLITE DATABASE!
============================================================
```
