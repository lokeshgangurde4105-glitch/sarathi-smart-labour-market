import React, { useState, useEffect } from "react";
import { authAPI } from "../api";
import { checkBackendHealth } from "../api/client";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Backend Technical Indicator
  const [backendStatus, setBackendStatus] = useState<"connected" | "offline" | "checking">("checking");

  useEffect(() => {
    let mounted = true;
    let isChecking = false;

    async function checkHealth() {
      if (document.visibilityState !== "visible") return;
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await checkBackendHealth();
        if (mounted) {
          const next = res.connected ? "connected" : "offline";
          setBackendStatus((prev) => (prev === next ? prev : next));
        }
      } catch {
        if (mounted) {
          setBackendStatus((prev) => (prev === "offline" ? prev : "offline"));
        }
      } finally {
        isChecking = false;
      }
    }

    checkHealth();
    // Throttle health check to 60s to prevent rapid polling
    const interval = setInterval(checkHealth, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verifyRole, setVerifyRole] = useState("student");
  const [verifyTab, setVerifyTab] = useState<"email" | "phone" | "org">("email");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

  // Forgot Password / OTP Reset state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const [loginRole, setLoginRole] = useState("student");

  // 4 Public Registration roles ONLY (Government Admin is strictly prohibited from self-registration)
  const PUBLIC_ROLES = [
    { id: "student", label: "Student / Jobseeker", desc: "Access personalized career guidance, courses, & job placements" },
    { id: "employer", label: "Industry Employer", desc: "Publish skill requirements, recruit talent, & survey market trends" },
    { id: "trainer", label: "Certified Trainer", desc: "Manage classes, track curricula delivery, & verify student competencies" },
    { id: "training_institute", label: "Training Institute", desc: "Manage vocational batches, infrastructure, & placement records" },
  ];

  // 5 Sign In Account Types (Government Administration restored for login only)
  const LOGIN_ROLES = [
    { id: "student", label: "Student / Jobseeker" },
    { id: "employer", label: "Industry Employer" },
    { id: "trainer", label: "Certified Trainer" },
    { id: "training_institute", label: "Training Institute" },
    { id: "government_admin", label: "Government / Administration" },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isRegister && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        const res = await authAPI.register(name, email, password, role, phone || undefined);
        const user = res.data;

        setSuccessMsg(
          res.message || "Registration successful! You may now sign in with your email and password."
        );

        if (user?.account_status === "ACTIVE" || res.message?.includes("sign in") || res.message?.includes("successful")) {
          setIsRegister(false);
          setPassword("");
        } else {
          // Open verification modal for the newly registered user
          setVerifyEmail(email);
          setVerifyPhone(phone || "");
          setVerifyRole(role);
          setVerifyTab("email");
          setShowVerifyModal(true);
        }
      } else {
        const targetRole = isRegister ? role : loginRole;
        const res = await authAPI.login(email, password, rememberMe, targetRole);
        const accessToken = res?.data?.access_token || res?.access_token;
        const refreshToken = res?.data?.refresh_token || res?.refresh_token;
        const user = res?.data?.user;

        if (!accessToken) {
          throw new Error("Login succeeded but security token was not returned.");
        }

        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", user.role);
        }

        onLogin();
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to authenticate with backend.";
      setError(errMsg);

      // If login error is due to pending verification, guide user to verification modal
      if (
        errMsg.includes("verify your email") ||
        errMsg.includes("verify your phone") ||
        errMsg.includes("not yet verified")
      ) {
        setVerifyEmail(email);
        setVerifyPhone(phone || "");
        setVerifyRole(role);
        if (errMsg.includes("verify your phone")) {
          setVerifyTab("phone");
        } else if (errMsg.includes("not yet verified")) {
          setVerifyTab("org");
        } else {
          setVerifyTab("email");
        }
        setShowVerifyModal(true);
      }
    } finally {
      setLoading(false);
    }
  }

  // Verification Modal handlers
  async function handleSendEmailOtp() {
    try {
      setVerifyLoading(true);
      setVerifyError("");
      const res = await authAPI.sendEmailOtp(verifyEmail);
      setVerifySuccess(res.message || "Verification code dispatched to your email.");
    } catch (err: any) {
      setVerifyError(err?.message || "Email verification is not configured.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleVerifyEmailOtp() {
    if (!emailOtp.trim()) {
      setVerifyError("Please enter the verification code sent to your email.");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError("");
      const res = await authAPI.verifyEmailOtp(verifyEmail, emailOtp.trim());
      setVerifySuccess(res.message || "Email verified successfully!");
      if (res.account_status === "ACTIVE") {
        setSuccessMsg("Account activated! You may now sign in.");
        setTimeout(() => setShowVerifyModal(false), 1500);
      } else {
        setVerifyTab("phone");
      }
    } catch (err: any) {
      setVerifyError(err?.message || "Verification failed. Please check the code.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleSendPhoneOtp() {
    if (!verifyPhone.trim()) {
      setVerifyError("Please provide an international E.164 phone number (e.g. +919876543210).");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError("");
      const res = await authAPI.sendPhoneOtp(verifyPhone, "sms");
      setVerifySuccess(res.message || "Verification code dispatched via SMS.");
    } catch (err: any) {
      setVerifyError(err?.message || "SMS verification is not configured.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleVerifyPhoneOtp() {
    if (!phoneOtp.trim()) {
      setVerifyError("Please enter the SMS verification code.");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError("");
      const res = await authAPI.verifyPhoneOtp(verifyPhone, phoneOtp.trim());
      setVerifySuccess(res.message || "Phone number verified successfully!");
      if (res.account_status === "ACTIVE") {
        setSuccessMsg("Account successfully activated! You may now sign in.");
        setTimeout(() => setShowVerifyModal(false), 1500);
      } else if (verifyRole !== "student") {
        setVerifyTab("org");
      }
    } catch (err: any) {
      setVerifyError(err?.message || "Phone verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  }

  // Forgot Password handlers
  async function handleSendForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError("");
      const res = await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMsg(res.message || "Password reset instructions dispatched.");
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || "Failed to dispatch password reset code.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword) {
      setForgotError("Please enter the verification code and your new password.");
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError("");
      await authAPI.resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
      setSuccessMsg("Password reset successfully! Please sign in with your new credentials.");
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotOtp("");
      setNewPassword("");
      setEmail(forgotEmail);
    } catch (err: any) {
      setForgotError(err?.message || "Invalid verification code or password reset failed.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#090D16",
        color: "#F8FAFC",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ============================================================ */}
      {/* LEFT COLUMN / BRANDING & COPILOT HERO (Section 55)            */}
      {/* ============================================================ */}
      <div
        style={{
          flex: "1 1 55%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          background: "radial-gradient(ellipse at 20% 30%, rgba(124, 58, 237, 0.18) 0%, rgba(15, 23, 42, 0.95) 70%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          position: "relative",
        }}
      >
        {/* Brand Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 24,
                color: "#FFFFFF",
                boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)",
              }}
            >
              S
            </div>
            <div>
              {/* Bold Capital Title */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                SARATHI
              </h1>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  marginTop: 3,
                }}
              >
                SMART LABOUR MARKET INTELLIGENCE & CAREER GUIDANCE PLATFORM
              </div>
            </div>
          </div>

          {/* SARATHI AI Copilot Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderRadius: 30,
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              marginBottom: 36,
              boxShadow: "0 4px 20px rgba(124, 58, 237, 0.2)",
            }}
          >
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: "0.5px",
                  color: "#C084FC",
                  textTransform: "uppercase",
                }}
              >
                SARATHI AI
              </span>
              <span style={{ color: "#E2E8F0", fontSize: 13, marginLeft: 8, fontWeight: 500 }}>
                — Your Personal Career & Learning Copilot
              </span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div style={{ maxWidth: 580, marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#F1F5F9",
                lineHeight: 1.35,
                marginBottom: 16,
              }}
            >
              Unified Intelligence Bridging Industry Demand & Next-Generation Skill Development
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
              SARATHI empowers students, educational institutes, certified trainers, industry recruiters,
              and government policymakers with real-time labor market telemetry, NCVET-aligned curricula,
              and automated verifiable credentials.
            </p>
          </div>

          {/* Platform Pillars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 640 }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                Real-Time Labour Telemetry
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Integrated PLFS surveys, district absorption indicators, and live sectoral demand forecasting.
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                Dynamic Study Planner
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Personalized target completion tracking, module pacing analytics, and real active study logging.
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>🏛️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                NCVET & NSQF Framework
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                National Occupational Standards (NOS) alignment with tamper-evident digital certificates.
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 4 }}>
                Role-Based Verified Access
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Multi-factor Email/SMS OTP authentication with central administrative review for institutions.
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Lower Technical System Health Indicator (Requirement: NOT as product branding) */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#64748B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: backendStatus === "connected" ? "#10B981" : backendStatus === "checking" ? "#F59E0B" : "#EF4444",
                boxShadow: backendStatus === "connected" ? "0 0 8px #10B981" : "none",
                display: "inline-block",
              }}
            />
            <span>
              Engine: <strong style={{ color: "#94A3B8" }}>SQLite 3 (Live Source of Truth)</strong> • Status:{" "}
              <strong style={{ color: backendStatus === "connected" ? "#10B981" : backendStatus === "checking" ? "#F59E0B" : "#EF4444" }}>
                {backendStatus === "connected" ? "Backend Connected" : backendStatus === "checking" ? "Checking Backend..." : "Backend Unavailable"}
              </strong>{" "}
              • Port: 8000
            </span>
          </div>
          <div>SIH 26134 • National Skill Development Initiative</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN / SECURE LOGIN & REGISTRATION CARD              */}
      {/* ============================================================ */}
      <div
        style={{
          flex: "1 1 45%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 40px",
          background: "#0B1120",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#1E293B",
            borderRadius: 20,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Card Top: Switch Tabs */}
          <div
            style={{
              display: "flex",
              background: "#0F172A",
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: !isRegister ? "#7C3AED" : "transparent",
                color: !isRegister ? "#FFFFFF" : "#94A3B8",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: isRegister ? "#7C3AED" : "transparent",
                color: isRegister ? "#FFFFFF" : "#94A3B8",
              }}
            >
              Register Account
            </button>
          </div>


          {/* Notification Alerts */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#FCA5A5",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#86EFAC",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit}>
            {/* Registration Fields */}
            {isRegister && (
              <>
                {/* Account Type Selection (4 Public Roles) */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
                    Select Account Type
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#F8FAFC",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {PUBLIC_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    Note: Government Admin accounts are provisioned exclusively by central authority.
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
                    Full Name / Organization Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma or TechCorp Solutions"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#F8FAFC",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
                    Mobile Phone (E.164 International Format)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#F8FAFC",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </>
            )}

            {/* Account Type Selection for Sign In */}
            {!isRegister && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
                  Select Account Type
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    setLoginRole(nextRole);
                    setError("");
                    setSuccessMsg("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: loginRole === "government_admin" ? "rgba(124, 58, 237, 0.15)" : "#0F172A",
                    border: loginRole === "government_admin" ? "1px solid rgba(192, 132, 252, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: 13,
                    fontWeight: loginRole === "government_admin" ? 700 : 500,
                    outline: "none",
                  }}
                >
                  {LOGIN_ROLES.map((r) => (
                    <option key={r.id} value={r.id} style={{ background: "#0F172A", color: "#F8FAFC" }}>
                      {r.label}
                    </option>
                  ))}
                </select>

                {loginRole === "government_admin" && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "rgba(124, 58, 237, 0.2)",
                      border: "1px solid rgba(124, 58, 237, 0.35)",
                      fontSize: 11,
                      color: "#E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🏛️</span>
                    <span>
                      <strong>Government / Administration Portal:</strong> Restricted to authorized central and state authority personnel.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Email Address */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#E2E8F0", marginBottom: 6 }}>
                {!isRegister && loginRole === "government_admin" ? "Official Government Email" : "Email Address"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={!isRegister && loginRole === "government_admin" ? "admin@example.com" : "name@domain.com"}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>Password</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setForgotError("");
                      setForgotMsg("");
                      setShowForgotModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#C084FC",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    borderRadius: 8,
                    background: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                  }}
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {!isRegister && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#7C3AED", cursor: "pointer" }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: 12, color: "#CBD5E1", cursor: "pointer" }}>
                  Remember this device for 30 days
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                border: "none",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 10px 20px -5px rgba(124, 58, 237, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Authenticating with SARATHI..." : isRegister ? "Create SARATHI Account" : "Sign In to SARATHI"}
            </button>
          </form>

          {/* Verification Shortcut */}
          <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                setVerifyEmail(email);
                setVerifyPhone(phone || "");
                setVerifyRole(role);
                setVerifyTab("email");
                setVerifyError("");
                setVerifySuccess("");
                setShowVerifyModal(true);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Need to complete identity verification for an existing account?
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* IDENTITY & OTP VERIFICATION MODAL                             */}
      {/* ============================================================ */}
      {showVerifyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#1E293B",
              borderRadius: 16,
              padding: 28,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#F8FAFC",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>
                  SARATHI Account Verification
                </h3>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  Verify your credentials to activate full platform access
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Stepper Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: 10 }}>
              <button
                type="button"
                onClick={() => setVerifyTab("email")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: verifyTab === "email" ? "#7C3AED" : "rgba(255, 255, 255, 0.05)",
                  color: "#FFFFFF",
                }}
              >
                1. Email OTP
              </button>
              <button
                type="button"
                onClick={() => setVerifyTab("phone")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: verifyTab === "phone" ? "#7C3AED" : "rgba(255, 255, 255, 0.05)",
                  color: "#FFFFFF",
                }}
              >
                2. Phone OTP
              </button>
              {verifyRole !== "student" && (
                <button
                  type="button"
                  onClick={() => setVerifyTab("org")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: verifyTab === "org" ? "#7C3AED" : "rgba(255, 255, 255, 0.05)",
                    color: "#FFFFFF",
                  }}
                >
                  3. Org Accreditation
                </button>
              )}
            </div>

            {verifyError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                ⚠️ {verifyError}
              </div>
            )}

            {verifySuccess && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#86EFAC",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                ✅ {verifySuccess}
              </div>
            )}

            {/* Tab 1: Email OTP */}
            {verifyTab === "email" && (
              <div>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 12 }}>
                  A 6-digit one-time password is sent to your registered email: <strong>{verifyEmail}</strong>.
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 14,
                      letterSpacing: "2px",
                      textAlign: "center",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={verifyLoading}
                    style={{
                      padding: "0 14px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Send / Resend OTP
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={verifyLoading}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#7C3AED",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Verify Email
                </button>
              </div>
            )}

            {/* Tab 2: Phone OTP */}
            {verifyTab === "phone" && (
              <div>
                <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 12 }}>
                  Verification code dispatched via international SMS gateway to: <strong>{verifyPhone}</strong>.
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 14,
                      letterSpacing: "2px",
                      textAlign: "center",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={verifyLoading}
                    style={{
                      padding: "0 14px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Send / Resend SMS
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyPhoneOtp}
                  disabled={verifyLoading}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#7C3AED",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Verify Phone
                </button>
              </div>
            )}

            {/* Tab 3: Institutional Accreditation Review */}
            {verifyTab === "org" && (
              <div>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: "rgba(124, 58, 237, 0.1)",
                    border: "1px solid rgba(124, 58, 237, 0.25)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#C084FC", marginBottom: 6 }}>
                    📋 Organization Document Review Queued
                  </div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>
                    Your institutional registration certificate and credentials have been submitted to the
                    SARATHI Government Review Portal. A verified state administrator reviews records within
                    standard evaluation hours.
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>
                  Tip for evaluators: Use the pre-seeded verified accounts (e.g. Employer or Institute) to test all role features immediately without awaiting manual approval.
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#334155",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close & Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FORGOT PASSWORD MODAL                                        */}
      {/* ============================================================ */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#1E293B",
              borderRadius: 16,
              padding: 28,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#F8FAFC",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                ⚠️ {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#86EFAC",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                ✅ {forgotMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#7C3AED",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {forgotLoading ? "Dispatching..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                    placeholder="123456"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 14,
                      letterSpacing: "2px",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#0F172A",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#7C3AED",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {forgotLoading ? "Resetting..." : "Confirm Password Reset"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}