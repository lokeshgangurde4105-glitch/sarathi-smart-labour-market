import React, { useState, useEffect } from "react";
import { certificatesAPI, CertificateData, VerificationResponse } from "../api";
import { IcoCheck, IcoAlert } from "../components/Icons";

interface CertificateVerificationProps {
  onNavigate?: (page: string) => void;
}

export default function CertificateVerification({ onNavigate }: CertificateVerificationProps = {}) {
  const [certIdInput, setCertIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationData, setVerificationData] = useState<VerificationResponse["data"] | null>(null);
  const [myCerts, setMyCerts] = useState<CertificateData[]>([]);
  const [loadingMyCerts, setLoadingMyCerts] = useState(false);

  useEffect(() => {
    loadMyCerts();
  }, []);

  async function loadMyCerts() {
    try {
      setLoadingMyCerts(true);
      const res = await certificatesAPI.getMyCertificates();
      if (res.data) {
        setMyCerts(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMyCerts(false);
    }
  }

  async function handleVerify(idToVerify?: string) {
    const code = (idToVerify || certIdInput).trim();
    if (!code) {
      setError("Please enter a Certificate ID or verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setVerificationData(null);

      const res = await certificatesAPI.verify(code);
      if (res.data) {
        setVerificationData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || `Certificate '${code}' was not found in the official registry or is invalid.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            National Skill Credential Verification
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Live Database Registry · Cryptographic Hash Verification · Requirement 46
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("student")}
            className="btn-secondary"
            style={{ fontSize: 12, padding: "8px 14px" }}
          >
            ← Return to Portal
          </button>
        )}
      </div>

      {/* VERIFICATION SEARCH CARD */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
          Verify Certificate Authenticity
        </h2>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={certIdInput}
            onChange={(e) => setCertIdInput(e.target.value)}
            placeholder="e.g. SARATHI-CERT-2026-001"
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 14,
              fontFamily: "monospace",
              outline: "none",
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => handleVerify()}
            className="btn-primary"
            style={{ padding: "11px 22px", fontSize: 14 }}
          >
            {loading ? "Verifying with Database..." : "Verify Credential"}
          </button>
        </div>

      </div>

      {/* ERROR / INVALID */}
      {error && (
        <div className="chart-card" style={{ background: "#FEF2F2", border: "1px solid #FECACA", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>❌</span>
            <div>
              <strong style={{ fontSize: 15, color: "#991B1B" }}>Verification Failed / Invalid Certificate</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#B91C1C" }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED SUCCESS CARD */}
      {verificationData && (
        <div
          className="chart-card"
          style={{
            background: "#FFFFFF",
            border: "2px solid #059669",
            borderRadius: 16,
            padding: 28,
            boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.15)",
            marginBottom: 24,
          }}
        >
          {/* BADGE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#DCFCE7",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#059669" }}>
                  OFFICIALLY VERIFIED CREDENTIAL
                </h3>
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  Registered in Government Skill Repository · ID: {verificationData.certificate_number}
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                Grade: {verificationData.grade}
              </span>
            </div>
          </div>

          {/* DETAILS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Recipient Student
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {verificationData.student_name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Certified Course
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {verificationData.course_name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Training Institute
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                {verificationData.institute_name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Authorized Trainer
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                {verificationData.trainer_name || "Lead Master Trainer"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Issue Date
              </div>
              <div style={{ fontSize: 14, color: "#334155", marginTop: 2 }}>
                {verificationData.issue_date}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                Verification Audit Timestamp
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                {verificationData.verification_timestamp}
              </div>
            </div>
          </div>

          {/* VERIFIED SKILLS */}
          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
              Endorsed Competencies & Technical Skills:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {verificationData.skills.map((sk) => (
                <span
                  key={sk}
                  style={{
                    padding: "4px 10px",
                    background: "#F1F5F9",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1E293B",
                  }}
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MY CERTIFICATES SECTION */}
      <div className="chart-card">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
          Your Issued Certificates in Database
        </h2>
        {loadingMyCerts ? (
          <p style={{ color: "#64748B", fontSize: 13 }}>Loading certificates from database...</p>
        ) : myCerts.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>No certificates yet. Complete an enrolled course to earn your first certificate.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myCerts.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 14, color: "#0F172A" }}>{c.course_name}</strong>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#DCFCE7", color: "#166534", padding: "2px 6px", borderRadius: 4 }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                    Issued by {c.institute_name} on {c.issue_date} · ID: <code style={{ color: "#1D4ED8" }}>{c.certificate_number}</code>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCertIdInput(c.certificate_number);
                    handleVerify(c.certificate_number);
                  }}
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  Verify Now →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
