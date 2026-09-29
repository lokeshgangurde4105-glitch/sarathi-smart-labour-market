"""
SARATHI Complete Audit Test Suite (Phase 13 Compliance)
Tests all 13 criteria against the FastAPI backend, SQLite database,
and the 6 real SIH-134 datasets.
"""

import sys
import time
from starlette.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("SARATHI PHASE 13 AUDIT TEST SUITE: 13-POINT VERIFICATION")
    print("=" * 70)

    with TestClient(app) as client:
        passed_tests = 0
        total_tests = 13

        # -------------------------------------------------------------
        # Test 1: Backend health check
        # -------------------------------------------------------------
        print("\n[TEST 1/13] Backend health check...")
        res = client.get("/api/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("status") in ("healthy", "ok", "HEALTHY", "OK"), f"Unexpected health response: {data}"
        print("  PASS: Health check returned 200 OK and healthy status.")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 2: Login with valid credentials
        # -------------------------------------------------------------
        print("\n[TEST 2/13] Login with valid credentials...")
        login_payload = {"email": "student@example.com", "password": "student123"}
        res = client.post("/api/auth/login", json=login_payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        login_data = res.json()
        student_token = login_data.get("access_token")
        assert student_token, "Access token missing in login response"
        assert login_data.get("data", {}).get("user", {}).get("role") == "student"
        print("  PASS: Valid login returned 200 OK and issued JWT access token.")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 3: Login with wrong password (must return 401)
        # -------------------------------------------------------------
        print("\n[TEST 3/13] Login with wrong password (must return 401)...")
        res = client.post("/api/auth/login", json={"email": "student@example.com", "password": "incorrect_password_999"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"  PASS: Login with wrong password returned 401 Unauthorized ({res.json().get('detail')}).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 4: Login with nonexistent email (must return 401)
        # -------------------------------------------------------------
        print("\n[TEST 4/13] Login with nonexistent email (must return 401)...")
        res = client.post("/api/auth/login", json={"email": "nonexistent_auditor_xyz_888@example.com", "password": "password123"})
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"  PASS: Nonexistent email returned 401 Unauthorized ({res.json().get('detail')}).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 5: Registration with new user
        # -------------------------------------------------------------
        print("\n[TEST 5/13] Registration with new user...")
        test_email = f"audit_student_{int(time.time())}@example.com"
        reg_payload = {
            "name": "Audit Student",
            "email": test_email,
            "password": "strongPassword123",
            "role": "student",
            "phone": "+919876543210",
            "country": "India"
        }
        res = client.post("/api/auth/register", json=reg_payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        reg_data = res.json()
        assert reg_data.get("success") is True, f"Registration failed: {reg_data}"
        assert reg_data.get("data", {}).get("email") == test_email
        print(f"  PASS: Registered new user successfully ({test_email}).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 6: Registration with duplicate email (must return 400)
        # -------------------------------------------------------------
        print("\n[TEST 6/13] Registration with duplicate email (must return 400)...")
        res = client.post("/api/auth/register", json=reg_payload)
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"  PASS: Duplicate registration returned 400 Bad Request ({res.json().get('detail')}).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 7: Accessing protected route without token (must return 401)
        # -------------------------------------------------------------
        print("\n[TEST 7/13] Accessing protected route without token (must return 401)...")
        res = client.get("/api/auth/me")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}: {res.text}"
        print(f"  PASS: Unauthenticated call to /api/auth/me returned 401 ({res.json().get('detail')}).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 8: Accessing role-protected route with wrong role (must return 403)
        # -------------------------------------------------------------
        print("\n[TEST 8/13] Accessing role-protected route with wrong role (must return 403)...")
        # Student token attempting admin-check
        headers_student = {"Authorization": f"Bearer {student_token}"}
        res = client.get("/api/auth/admin-check", headers=headers_student)
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
        print(f"  PASS: Student access to admin route returned 403 Forbidden ({res.json().get('detail')}).")

        # Verify admin token succeeds on admin-check
        admin_login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        res_admin = client.get("/api/auth/admin-check", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_admin.status_code == 200, f"Admin check failed: {res_admin.text}"
        print("  VERIFIED: Admin token successfully accessed /api/auth/admin-check (200 OK).")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 9: Each of the 6 dataset endpoints returns data
        # -------------------------------------------------------------
        print("\n[TEST 9/13] Each of the 6 dataset endpoints returns data...")
        dataset_endpoints = [
            ("/api/real-data/indian-jobs", "indian_job_market_2025.csv"),
            ("/api/real-data/skills", "skills_rows.csv"),
            ("/api/real-data/job-recommendations", "job_recommendation_dataset.csv"),
            ("/api/real-data/ai-jobs", "ai_job_market_dataset.csv"),
            ("/api/real-data/coursera-courses", "Coursera_catalog.csv"),
            ("/api/real-data/datacamp-courses", "datacamp_courses.csv"),
        ]
        for endpoint, filename in dataset_endpoints:
            res = client.get(f"{endpoint}?limit=5")
            assert res.status_code == 200, f"Failed {endpoint}: {res.status_code}"
            d = res.json()
            assert d.get("success") is True, f"{endpoint} returned success: False"
            assert len(d.get("data", [])) > 0, f"{endpoint} returned 0 records"
            assert d.get("total", 0) > 0, f"{endpoint} total count is 0"
            print(f"  OK: {endpoint} -> {len(d['data'])} records (total: {d['total']:,} rows from {filename})")

        # Check malformed route alias fix (/api/real-data/=1)
        res_alias = client.get("/api/real-data/=1")
        assert res_alias.status_code == 200, f"Malformed alias /api/real-data/=1 failed with {res_alias.status_code}"
        print("  OK: Malformed request /api/real-data/=1 correctly handled with 200 OK.")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 10: Dataset pagination works (page 1 != page 2)
        # -------------------------------------------------------------
        print("\n[TEST 10/13] Dataset pagination works (page 1 != page 2)...")
        res_p1 = client.get("/api/real-data/indian-jobs?page=1&limit=5")
        res_p2 = client.get("/api/real-data/indian-jobs?page=2&limit=5")
        assert res_p1.status_code == 200 and res_p2.status_code == 200
        p1_data = res_p1.json().get("data", [])
        p2_data = res_p2.json().get("data", [])
        assert len(p1_data) == 5, f"Expected 5 items on page 1, got {len(p1_data)}"
        assert len(p2_data) == 5, f"Expected 5 items on page 2, got {len(p2_data)}"
        assert p1_data != p2_data, "Page 1 and Page 2 data are unexpectedly identical!"
        p1_title = p1_data[0].get("title") or p1_data[0].get("Job Title")
        p2_title = p2_data[0].get("title") or p2_data[0].get("Job Title")
        print(f"  PASS: Page 1 items != Page 2 items. P1[0]: '{p1_title}' vs P2[0]: '{p2_title}'")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 11: Dataset search/filter works
        # -------------------------------------------------------------
        print("\n[TEST 11/13] Dataset search/filter works...")
        search_keyword = "Python"
        res_search = client.get(f"/api/real-data/indian-jobs?search={search_keyword}&limit=10")
        assert res_search.status_code == 200, f"Search failed: {res_search.text}"
        search_data = res_search.json().get("data", [])
        assert len(search_data) > 0, f"No records found for keyword '{search_keyword}'"
        for r in search_data:
            haystack = " ".join(str(v) for v in r.values()).lower()
            assert search_keyword.lower() in haystack, f"Search keyword '{search_keyword}' not found in record: {r}"
        print(f"  PASS: Search filter correctly matched {len(search_data)} records containing '{search_keyword}'.")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 12: Skill gap analysis returns matched and missing skills
        # -------------------------------------------------------------
        print("\n[TEST 12/13] Skill gap analysis returns matched and missing skills...")
        res_match = client.get("/api/real-data/match-skills?skills=Python,SQL&target_role=Developer&limit=5")
        assert res_match.status_code == 200, f"Skill matching failed: {res_match.text}"
        match_data = res_match.json()
        assert match_data.get("success") is True
        ranked_jobs = match_data.get("ranked_jobs", [])
        assert len(ranked_jobs) > 0, "No ranked jobs returned from skill match engine"
        sample_job = ranked_jobs[0]
        assert "matched_skills" in sample_job, "matched_skills field missing"
        assert "missing_skills" in sample_job, "missing_skills field missing"
        assert "match_percentage" in sample_job, "match_percentage field missing"
        print(f"  PASS: Match score: {sample_job['match_percentage']}%. Matched: {sample_job['matched_skills']}, Missing: {sample_job['missing_skills']}")
        passed_tests += 1

        # -------------------------------------------------------------
        # Test 13: Course recommendations return real courses for missing skills
        # -------------------------------------------------------------
        print("\n[TEST 13/13] Course recommendations return real courses for missing skills...")
        rec_courses = match_data.get("recommended_courses", [])
        assert len(rec_courses) > 0, "No recommended courses returned for missing skills"
        sample_skill_group = rec_courses[0]
        missing_skill = sample_skill_group.get("missing_skill")
        courses = sample_skill_group.get("courses", [])
        assert len(courses) > 0, f"No courses attached to missing skill {missing_skill}"
        course_sample = courses[0]
        assert course_sample.get("provider") in ("Coursera", "DataCamp"), f"Unexpected provider: {course_sample.get('provider')}"
        assert course_sample.get("title"), "Course title is empty"
        print(f"  PASS: Real course found for missing skill '{missing_skill}': '{course_sample.get('title')}' by {course_sample.get('provider')}")
        passed_tests += 1

        # -------------------------------------------------------------
        # Summary
        # -------------------------------------------------------------
        print("\n" + "=" * 70)
        print(f"AUDIT SUITE EXECUTION COMPLETE: {passed_tests}/{total_tests} TESTS PASSED (100%)")
        print("=" * 70)

if __name__ == "__main__":
    run_tests()
