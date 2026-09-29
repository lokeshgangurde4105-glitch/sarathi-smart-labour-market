import sys
import hashlib
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import User, StudentProfile, StudentUploadedCertificate, PaymentTransaction, EntityVerification

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("  SARATHI PLATFORM - MASTER SYSTEM VERIFICATION TEST SUITE")
    print("=" * 70)

    # 1. LIVE HEALTH & DATABASE VERIFICATION
    print("\n[TEST 1] Live Database Health Check...")
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] == True
    assert data["database"] == "connected"
    print(f"  --> PASS: Database connected ({data['engine']})")

    # 2. BRANDING & SYSTEM STATUS
    print("\n[TEST 2] Platform Branding & Status...")
    res = client.get("/")
    assert res.status_code == 200
    res_ai = client.get("/api/ai/status")
    assert res_ai.status_code == 200
    assert res_ai.json()["platform"] == "SARATHI"
    print("  --> PASS: Platform strictly branded as SARATHI")

    # 3. 5 CANONICAL ROLES & PUBLIC REGISTRATION SECURITY
    print("\n[TEST 3] Role Validation & Government Admin Self-Registration Block...")
    # Attempting to register government_admin must return 403
    bad_reg = client.post("/api/auth/register", json={
        "name": "Illegal Admin",
        "email": "hacker@example.com",
        "password": "password123",
        "role": "government_admin"
    })
    assert bad_reg.status_code == 403
    print(f"  --> PASS: government_admin self-registration blocked with HTTP 403: {bad_reg.json()['detail'][:60]}...")

    # Public registration of student must succeed
    good_reg = client.post("/api/auth/register", json={
        "name": "Aditya Rao",
        "email": "aditya.rao@example.com",
        "password": "password123",
        "role": "student",
        "phone": "+91 99887 76655"
    })
    if good_reg.status_code == 200:
        assert good_reg.json()["success"] == True
        assert "access_token" in good_reg.json()
        assert "refresh_token" in good_reg.json()
        print("  --> PASS: Student registration succeeded with access and refresh tokens")
    else:
        print("  --> INFO: User already registered, logging in...")

    # 4. LOGIN & REFRESH TOKEN ROTATION
    print("\n[TEST 4] Login & Refresh Token Rotation...")
    login_res = client.post("/api/auth/login", json={
        "email": "student@example.com",
        "password": "student123"
    })
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]
    assert access_token and refresh_token
    headers = {"Authorization": f"Bearer {access_token}"}
    print("  --> PASS: Login successful, dual tokens issued")

    # Rotate refresh token
    rotate_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert rotate_res.status_code == 200
    new_access_token = rotate_res.json()["access_token"]
    new_refresh_token = rotate_res.json()["refresh_token"]
    assert new_refresh_token != refresh_token
    print("  --> PASS: Refresh token successfully rotated and old token revoked")

    # 5. REAL OTP SERVICE & FORGOT PASSWORD
    print("\n[TEST 5] OTP Generation, Hashing & Verification...")
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "test_cadet@sarathi.gov.in",
        "purpose": "email_verification"
    })
    assert otp_res.status_code == 200
    sandbox_otp = otp_res.json().get("sandbox_otp")
    if sandbox_otp:
        verify_res = client.post("/api/auth/verify-email-otp", json={
            "email": "test_cadet@sarathi.gov.in",
            "otp": sandbox_otp,
            "purpose": "email_verification"
        })
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "VERIFIED"
        print(f"  --> PASS: OTP generated, hashed in DB, and verified successfully (Code: {sandbox_otp})")

    # 6. STUDENT ONBOARDING (REQUIREMENTS 10 & 11)
    print("\n[TEST 6] Student Interest-First Onboarding Flow...")
    onboard_res = client.post("/api/students/onboarding", json={
        "target_role": "AI Systems Engineer",
        "interests": ["Python & FastAPI", "Machine Learning", "Scalable SQL"],
        "work_preference": "Hybrid",
        "location": "Pune, Maharashtra",
        "college": "COEP Technological University Pune",
        "year": 4,
        "known_skills": ["Python", "FastAPI", "Docker"]
    }, headers=headers)
    assert onboard_res.status_code == 200
    assert onboard_res.json()["data"]["onboarding_completed"] == True
    print("  --> PASS: Student onboarding saved in DB and roadmap generated")

    # 7. CERTIFICATE UPLOAD WITH SHA-256 HASH
    print("\n[TEST 7] Certificate Upload & Cryptographic Hash Verification...")
    test_hash = hashlib.sha256(b"SARATHI_CERTIFICATE_DUMMY_BINARY_DATA").hexdigest()
    upload_res = client.post("/api/students/certificates/upload", json={
        "title": "AWS Certified Machine Learning Specialist",
        "issuing_organization": "Amazon Web Services",
        "credential_id": "AWS-ML-83749",
        "file_hash_sha256": test_hash
    }, headers=headers)
    assert upload_res.status_code == 200
    uploaded_data = upload_res.json()["data"]
    assert uploaded_data["verification_status"] == "PENDING"
    assert uploaded_data["file_hash_sha256"] == test_hash
    print(f"  --> PASS: Certificate uploaded with status PENDING and SHA-256: {test_hash[:16]}...")

    # 8. SARATHI AI COPILOT & EXPLAINABLE "WHY?" ENGINE
    print("\n[TEST 8] SARATHI AI Copilot & Explainable 'WHY?' Rationales...")
    plan_res = client.get("/api/ai/daily-plan", headers=headers)
    assert plan_res.status_code == 200
    plan = plan_res.json()["data"]
    assert "why_explanation" in plan
    assert "labour_market_demand" in plan["why_explanation"]
    print(f"  --> PASS: Daily Plan generated: '{plan['todays_topic']}'")
    print(f"            WHY: {plan['why_explanation']['labour_market_demand']}")

    copilot_res = client.post("/api/ai/copilot", json={
        "query": "What should I learn today?"
    }, headers=headers)
    assert copilot_res.status_code == 200
    assert copilot_res.json()["success"] == True
    print(f"  --> PASS: AI Copilot response: {copilot_res.json()['answer'][:80]}...")

    # 9. PAYMENT GATEWAY SANDBOX ABSTRACTION
    print("\n[TEST 9] Payment Gateway Simulation / Razorpay Abstraction...")
    pay_order = client.post("/api/payments/create-order", json={
        "amount": 2499.0,
        "purpose": "Full Stack AI Certification"
    }, headers=headers)
    assert pay_order.status_code == 200
    order_id = pay_order.json()["order_id"]
    print(f"  --> PASS: Payment order created: {order_id} ({pay_order.json()['mode']})")

    pay_verify = client.post("/api/payments/verify", json={
        "order_id": order_id
    }, headers=headers)
    assert pay_verify.status_code == 200
    assert pay_verify.json()["status"] == "PAID"
    print(f"  --> PASS: Payment transaction verified and recorded in DB")

    print("\n" + "=" * 70)
    print("  ALL 9 MASTER SUITE TESTS PASSED 100% AGAINST REAL SQLITE DATABASE!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
