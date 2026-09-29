import React, { useState, useEffect } from "react";
import { jobsAPI, realDataAPI, JobData } from "../api";
import { IcoUser, IcoZap, IcoCheck, IcoAlert } from "../components/Icons";

export default function CompanyDashboard() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [matchingJobTitle, setMatchingJobTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Real datasets states (Requirement 4A: Indian Jobs & AI Jobs)
  const [realIndianJobs, setRealIndianJobs] = useState<any[]>([]);
  const [realAiJobs, setRealAiJobs] = useState<any[]>([]);
  const [realJobsLoading, setRealJobsLoading] = useState(false);
  const [realJobsError, setRealJobsError] = useState("");

  // Post Job Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("Tata Consultancy Services");
  const [location, setLocation] = useState("Pune, Maharashtra");
  const [jobType, setJobType] = useState("Full Time");
  const [experience, setExperience] = useState("0-2 Years");
  const [vacancies, setVacancies] = useState(5);
  const [salaryRange, setSalaryRange] = useState("₹5.0 - 8.0 LPA");
  const [requiredSkills, setRequiredSkills] = useState("Python, FastAPI, SQL, Docker");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);

  // Status updating
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(false);
    setError("");

    // Load jobs & applications in background
    jobsAPI.getAll().then((jobsRes) => {
      if (jobsRes?.data) {
        setJobs(jobsRes.data);
        if (jobsRes.data.length > 0 && selectedJobId === null) {
          handleSelectJobForMatching(jobsRes.data[0]);
        }
      }
    }).catch((err) => console.warn("Notice: Jobs fetch:", err));

    jobsAPI.getCompanyApplications().then((appsRes) => {
      if (appsRes?.data) {
        setApplications(appsRes.data);
      }
    }).catch((err) => console.warn("Notice: Applications fetch:", err));

    // Load real datasets (Requirement 4A: Indian Jobs & AI Jobs)
    setRealJobsLoading(true);
    Promise.allSettled([
      realDataAPI.indianJobs({ limit: 6 }),
      realDataAPI.aiJobs({ limit: 4 }),
    ]).then(([indRes, aiRes]) => {
      if (indRes.status === "fulfilled" && indRes.value?.data) {
        setRealIndianJobs(indRes.value.data);
      }
      if (aiRes.status === "fulfilled" && aiRes.value?.data) {
        setRealAiJobs(aiRes.value.data);
      }
    }).catch((err) => {
      console.warn("Notice: Real jobs fetch error:", err);
      setRealJobsError("Dataset currently unavailable.");
    }).finally(() => {
      setRealJobsLoading(false);
    });
  }

  async function handleSelectJobForMatching(job: JobData) {
    try {
      setSelectedJobId(job.id);
      setMatchingJobTitle(job.title);
      setLoadingMatches(true);

      const res = await jobsAPI.getMatches(job.id);
      if (res.data) {
        setCandidates(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to run matching engine.");
    } finally {
      setLoadingMatches(false);
    }
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !requiredSkills.trim()) {
      setError("Please provide a job title and required skills.");
      return;
    }

    try {
      setPosting(true);
      setError("");

      const res = await jobsAPI.create({
        title,
        company_name: companyName,
        location,
        job_type: jobType,
        experience,
        vacancies,
        salary_range: salaryRange,
        required_skills: requiredSkills,
        description,
      });

      setSuccessMsg(`Job '${title}' created successfully and saved in database!`);
      setShowPostModal(false);
      setTitle("");
      setDescription("");

      // Reload jobs
      const updated = await jobsAPI.getAll();
      if (updated.data) {
        setJobs(updated.data);
        if (res.data?.id) {
          const newJob = updated.data.find((j) => j.id === res.data.id) || updated.data[0];
          handleSelectJobForMatching(newJob);
        }
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create job.");
    } finally {
      setPosting(false);
    }
  }

  async function handleUpdateStatus(appId: number, newStatus: string) {
    try {
      setUpdatingAppId(appId);
      setError("");

      await jobsAPI.updateApplicationStatus(appId, newStatus);
      setSuccessMsg(`Candidate application updated to '${newStatus}' in database.`);

      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus } : a))
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to update application status.");
    } finally {
      setUpdatingAppId(null);
    }
  }


  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            Employer Portal & Candidate Matching
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Post Jobs · AI Matching Engine · Pipeline Status Management (Requirements 47 & 48)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPostModal(true)}
          className="btn-primary"
          style={{ padding: "10px 18px", fontSize: 13 }}
        >
          + Post New Job Opening
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 8, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 8, fontSize: 13 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* POST JOB MODAL */}
      {showPostModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Post Job to SQLite Database
              </h2>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Job Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Python / Cloud Developer"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box", background: "white" }}
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Vacancies</label>
                  <input
                    type="number"
                    min={1}
                    value={vacancies}
                    onChange={(e) => setVacancies(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Required Skills (comma separated) *</label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Python, FastAPI, SQL, Docker, React"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Salary Range</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Job Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe responsibilities, role expectations, and prerequisites..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                >
                  {posting ? "Saving Job to DB..." : "Publish Job to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOBS TABS & CANDIDATE MATCHING ENGINE (Requirement 47) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Live Candidate Matching Engine
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
              Select a job to calculate real-time candidate skill alignment from database records
            </p>
          </div>
        </div>

        {/* JOB SELECTOR PILLS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {jobs.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => handleSelectJobForMatching(j)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: selectedJobId === j.id ? "2px solid #1D4ED8" : "1px solid #CBD5E1",
                background: selectedJobId === j.id ? "#EFF6FF" : "#FFFFFF",
                color: selectedJobId === j.id ? "#1D4ED8" : "#475569",
                fontWeight: selectedJobId === j.id ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {j.title} ({j.company_name})
            </button>
          ))}
        </div>

        {/* CANDIDATES MATCH LIST */}
        {loadingMatches ? (
          <div style={{ padding: 30, textAlign: "center", color: "#64748B", fontSize: 13 }}>
            Calculating matches across student database...
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 13 }}>
            No registered students currently match this role.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              Ranked Candidates for: <strong>{matchingJobTitle}</strong>
            </div>

            {candidates.map((c) => (
              <div
                key={c.student_id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  background: "#F8FAFC",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <strong style={{ fontSize: 15, color: "#0F172A" }}>{c.name}</strong>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{c.email}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    {c.course} · Year {c.year} · {c.college}
                  </div>

                  {/* MATCHING & MISSING SKILLS TAGS */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {c.matching_skills.map((s: string) => (
                      <span
                        key={s}
                        style={{
                          background: "#DCFCE7",
                          color: "#166534",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        ✓ {s}
                      </span>
                    ))}
                    {c.missing_skills.map((s: string) => (
                      <span
                        key={s}
                        style={{
                          background: "#FEE2E2",
                          color: "#991B1B",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        Missing: {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.match_percentage >= 80 ? "#059669" : "#1D4ED8" }}>
                    {c.match_percentage}%
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    Match Score
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: "#475569" }}>
                    Status: {c.application_status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPLICANT REVIEW & PIPELINE (Requirement 48) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Job Applications Pipeline & Status Manager
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
              Update application status across Applied → Shortlisted → Interview → Selected → Rejected (Requirement 48)
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
            {applications.length} Total Applicants
          </span>
        </div>

        {applications.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 13 }}>
            No applicants have applied yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                  <th style={{ padding: "10px 8px" }}>Candidate</th>
                  <th style={{ padding: "10px 8px" }}>Applied Job</th>
                  <th style={{ padding: "10px 8px" }}>Skills</th>
                  <th style={{ padding: "10px 8px" }}>Date</th>
                  <th style={{ padding: "10px 8px" }}>Current Status</th>
                  <th style={{ padding: "10px 8px" }}>Update Pipeline Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.application_id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 8px" }}>
                      <strong style={{ color: "#0F172A" }}>{app.student_name}</strong>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{app.college}</div>
                    </td>

                    <td style={{ padding: "12px 8px", color: "#1E293B" }}>
                      {app.job_title}
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(app.skills || []).slice(0, 3).map((sk: string) => (
                          <span key={sk} style={{ background: "#F1F5F9", color: "#334155", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: "12px 8px", color: "#64748B", fontSize: 12 }}>
                      {app.applied_at}
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            app.status === "Selected"
                              ? "#DCFCE7"
                              : app.status === "Interview"
                              ? "#FEF3C7"
                              : app.status === "Shortlisted"
                              ? "#EFF6FF"
                              : "#F1F5F9",
                          color:
                            app.status === "Selected"
                              ? "#166534"
                              : app.status === "Interview"
                              ? "#B45309"
                              : app.status === "Shortlisted"
                              ? "#1D4ED8"
                              : "#475569",
                        }}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <select
                        value={app.status}
                        disabled={updatingAppId === app.application_id}
                        onChange={(e) => handleUpdateStatus(app.application_id, e.target.value)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #CBD5E1",
                          fontSize: 12,
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REAL INDIAN JOBS & AI JOBS MARKET (Requirement 4A) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🇮🇳</span> National Labour Market Intelligence & AI Jobs (Real Datasets)
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
              Live telemetry from indian_job_market_2025.csv (97k listings) and ai_job_market_dataset.csv
            </p>
          </div>
          {realJobsLoading && <span style={{ fontSize: 11, color: "#64748B" }}>Loading real dataset records...</span>}
        </div>

        {realJobsError ? (
          <div style={{ padding: 12, background: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 12 }}>
            {realJobsError}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Indian Jobs 2025 Subset */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                  Indian Enterprise Openings (97k Dataset)
                </span>
                <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  2025 Verified
                </span>
              </div>
              {realIndianJobs.length === 0 && !realJobsLoading ? (
                <div style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: 16 }}>No matching records found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {realIndianJobs.map((j, idx) => (
                    <div key={idx} style={{ padding: 10, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 12, color: "#0F172A" }}>{j.title}</strong>
                        <span style={{ fontSize: 10, color: "#64748B" }}>{j.location}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#1D4ED8", marginTop: 2 }}>{j.companyName}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                        Tags: {j.tagsAndSkills ? j.tagsAndSkills.slice(0, 70) + "..." : "General"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Jobs Market Dataset */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                  Emerging AI & ML Roles (ai_job_market.csv)
                </span>
                <span style={{ fontSize: 10, background: "#F5F3FF", color: "#7C3AED", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  AI Intelligence
                </span>
              </div>
              {realAiJobs.length === 0 && !realJobsLoading ? (
                <div style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: 16 }}>No matching records found.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {realAiJobs.map((j, idx) => (
                    <div key={idx} style={{ padding: 10, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 12, color: "#0F172A" }}>{j.title}</strong>
                        <span style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600 }}>{j.category || "AI"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        {j.company} · {j.location || j.country_name || "Global"}
                      </div>
                      <div style={{ fontSize: 10, color: "#059669", marginTop: 2 }}>
                        Avg Salary: {j.salary_avg ? `${j.currency || "₹"} ${j.salary_avg}` : "Industry Competitive"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
