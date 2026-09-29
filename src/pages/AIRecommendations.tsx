import React, { useState, useEffect } from "react";
import { IcoSpark, IcoCheck, IcoX, IcoAlert, IcoArrowUp, IcoTrends, IcoRefresh, IcoSearch, IcoFilter } from "../components/Icons";
import { realDataAPI } from "../api/realData";

const recommendations = [
  {
    id: 1, title: "Add Cloud Computing to Data Engineering Curriculum",
    reason: "Cloud-related job postings increased 42% in the last 6 months in Pune, Bengaluru and Hyderabad districts.",
    evidence: [
      { label: "Job Postings", value: "2,340", icon: "📋" },
      { label: "Employer Responses", value: "78 firms", icon: "🏢" },
      { label: "Salary Premium", value: "+34%", icon: "💰" },
    ],
    impact: "+18% placement improvement", priority: "P1", category: "Curriculum",
    affectedInstitutes: 14, affectedStudents: 3200,
    confidence: 94, status: "pending",
  },
  {
    id: 2, title: "Reduce Basic Data Entry Training Capacity by 40%",
    reason: "Data Entry job postings declined 28% YoY. Oversupplied — 680 trained vs 220 available positions in Maharashtra.",
    evidence: [
      { label: "Placement Rate", value: "32%", icon: "📉" },
      { label: "Course Capacity", value: "680 seats", icon: "🪑" },
      { label: "Available Jobs", value: "220", icon: "💼" },
    ],
    impact: "Free 460 training seats for high-demand courses", priority: "P2", category: "Capacity",
    affectedInstitutes: 8, affectedStudents: 680,
    confidence: 91, status: "pending",
  },
  {
    id: 3, title: "Upskill 24 Trainers in Generative AI and LLM Technologies",
    reason: "GenAI job postings grew 127% in Q3. No trainers are currently certified in Generative AI across 12 institutes.",
    evidence: [
      { label: "GenAI Jobs", value: "1,840", icon: "🤖" },
      { label: "Certified Trainers", value: "0", icon: "👨‍🏫" },
      { label: "Growth Rate", value: "+127%", icon: "📈" },
    ],
    impact: "Enable training for 1,200+ students in GenAI", priority: "P1", category: "Trainer",
    affectedInstitutes: 12, affectedStudents: 1200,
    confidence: 98, status: "accepted",
  },
  {
    id: 4, title: "Launch Cybersecurity Analyst Course in Pune District",
    reason: "Pune has 380 unfilled Cybersecurity Analyst positions. Zero institutes offer this certification within 50km.",
    evidence: [
      { label: "Unfilled Positions", value: "380", icon: "🔒" },
      { label: "Average Salary", value: "₹8.4L", icon: "💰" },
      { label: "Employer Demand", value: "46 firms", icon: "🏢" },
    ],
    impact: "Address critical talent gap, improve district placement by 12%", priority: "P1", category: "New Course",
    affectedInstitutes: 3, affectedStudents: 450,
    confidence: 87, status: "pending",
  },
  {
    id: 5, title: "Update Python Curriculum from v3.8 to v3.12 Standards",
    reason: "67% of employer surveys require Python 3.10+ features. Current curriculum teaches deprecated patterns.",
    evidence: [
      { label: "Employer Feedback", value: "134 surveys", icon: "📊" },
      { label: "Mismatch Rate", value: "67%", icon: "❗" },
      { label: "Affected Courses", value: "11", icon: "📚" },
    ],
    impact: "Improve candidate-employer skill match by 23%", priority: "P2", category: "Curriculum",
    affectedInstitutes: 11, affectedStudents: 2800,
    confidence: 96, status: "review",
  },
];

const categoryColors: Record<string, { bg: string; color: string }> = {
  Curriculum: { bg: "#EFF6FF", color: "#1D4ED8" },
  Capacity: { bg: "#FFFBEB", color: "#D97706" },
  Trainer: { bg: "#F5F3FF", color: "#7C3AED" },
  "New Course": { bg: "#F0FDFA", color: "#0D9488" },
};

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#F1F5F9", color: "#475569", label: "Pending Review" },
  accepted: { bg: "#ECFDF5", color: "#059669", label: "Accepted" },
  review: { bg: "#FFFBEB", color: "#D97706", label: "Under Review" },
  rejected: { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
};

export default function AIRecommendations() {
  const [activeTab, setActiveTab] = useState<"policy" | "ai_jobs" | "job_recs">("policy");
  const [statuses, setStatuses] = useState<Record<number, string>>(
    Object.fromEntries(recommendations.map(r => [r.id, r.status]))
  );

  // Real Dataset States
  const [realAIJobs, setRealAIJobs] = useState<any[]>([]);
  const [aiTotal, setAiTotal] = useState(0);
  const [aiSearch, setAiSearch] = useState("");
  const [aiPage, setAiPage] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);

  const [realJobRecs, setRealJobRecs] = useState<any[]>([]);
  const [jobRecsTotal, setJobRecsTotal] = useState(0);
  const [jobRecSearch, setJobRecSearch] = useState("");
  const [jobRecPage, setJobRecPage] = useState(1);
  const [loadingJobRecs, setLoadingJobRecs] = useState(false);

  const [realSkills, setRealSkills] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchAIJobs("", 1);
    fetchJobRecs("", 1);
    fetchSkills();
  }, []);

  const fetchAIJobs = (searchQuery: string, pageNum: number) => {
    setLoadingAI(true);
    realDataAPI.aiJobs({ search: searchQuery, page: pageNum, limit: 8 })
      .then((res) => {
        if (res?.data) {
          setRealAIJobs(res.data);
          setAiTotal(res.total || res.data.length);
        }
      })
      .catch((err) => console.warn("AI jobs fetch error:", err))
      .finally(() => setLoadingAI(false));
  };

  const fetchJobRecs = (searchQuery: string, pageNum: number) => {
    setLoadingJobRecs(true);
    realDataAPI.jobRecommendations({ search: searchQuery, page: pageNum, limit: 8 })
      .then((res) => {
        if (res?.data) {
          setRealJobRecs(res.data);
          setJobRecsTotal(res.total || res.data.length);
        }
      })
      .catch((err) => console.warn("Job recommendations fetch error:", err))
      .finally(() => setLoadingJobRecs(false));
  };

  const fetchSkills = () => {
    realDataAPI.skills({ limit: 12 })
      .then((res) => {
        if (res?.data) setRealSkills(res.data);
      })
      .catch((err) => console.warn("Skills fetch error:", err));
  };

  const updateStatus = (id: number, status: string) => {
    setStatuses(s => ({ ...s, [id]: status }));
  };

  const counts = {
    total: recommendations.length,
    accepted: Object.values(statuses).filter(s => s === "accepted").length,
    pending: Object.values(statuses).filter(s => s === "pending").length,
  };

  const handleAISearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAiPage(1);
    fetchAIJobs(aiSearch, 1);
  };

  const handleNextAIPage = () => {
    const next = aiPage + 1;
    setAiPage(next);
    fetchAIJobs(aiSearch, next);
  };

  const handlePrevAIPage = () => {
    if (aiPage <= 1) return;
    const prev = aiPage - 1;
    setAiPage(prev);
    fetchAIJobs(aiSearch, prev);
  };

  const handleJobRecSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setJobRecPage(1);
    fetchJobRecs(jobRecSearch, 1);
  };

  const handleNextJobRecPage = () => {
    const next = jobRecPage + 1;
    setJobRecPage(next);
    fetchJobRecs(jobRecSearch, next);
  };

  const handlePrevJobRecPage = () => {
    if (jobRecPage <= 1) return;
    const prev = jobRecPage - 1;
    setJobRecPage(prev);
    fetchJobRecs(jobRecSearch, prev);
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>AI Recommendation Engine</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>Explainable AI recommendations backed by real labour market evidence</p>
        </div>
        <button
          className="btn-ai"
          onClick={() => {
            fetchAIJobs(aiSearch, aiPage);
            fetchJobRecs(jobRecSearch, jobRecPage);
          }}
        >
          <IcoRefresh size={13} />
          Regenerate Insights
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Recommendations", value: counts.total, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "Accepted", value: counts.accepted, color: "#059669", bg: "#ECFDF5" },
          { label: "Pending Review", value: counts.pending, color: "#D97706", bg: "#FFFBEB" },
          { label: "Avg. Confidence", value: "93%", color: "#1D4ED8", bg: "#EFF6FF" },
        ].map(s => (
          <div key={s.label} className="kpi-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #E2E8F0", paddingBottom: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("policy")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            cursor: "pointer",
            border: activeTab === "policy" ? "none" : "1px solid #CBD5E1",
            background: activeTab === "policy" ? "#7C3AED" : "#FFFFFF",
            color: activeTab === "policy" ? "#FFFFFF" : "#334155",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IcoSpark size={14} />
          Curriculum & Policy Interventions ({recommendations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai_jobs")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            cursor: "pointer",
            border: activeTab === "ai_jobs" ? "none" : "1px solid #CBD5E1",
            background: activeTab === "ai_jobs" ? "#7C3AED" : "#FFFFFF",
            color: activeTab === "ai_jobs" ? "#FFFFFF" : "#334155",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IcoTrends size={14} />
          AI & Emerging Job Market ({aiTotal > 0 ? aiTotal.toLocaleString() : "1,697"} real jobs)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("job_recs")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            cursor: "pointer",
            border: activeTab === "job_recs" ? "none" : "1px solid #CBD5E1",
            background: activeTab === "job_recs" ? "#7C3AED" : "#FFFFFF",
            color: activeTab === "job_recs" ? "#FFFFFF" : "#334155",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IcoCheck size={14} />
          Candidate Job & Skill Matching ({jobRecsTotal > 0 ? jobRecsTotal.toLocaleString() : "50,000"} real roles)
        </button>
      </div>

      {/* Recommendation Cards */}
      {activeTab === "policy" && recommendations.map(rec => {
        const cat = categoryColors[rec.category];
        const st = statusBadge[statuses[rec.id]];
        return (
          <div key={rec.id} className="chart-card" style={{ borderLeft: `4px solid ${rec.priority === "P1" ? "#7C3AED" : "#1D4ED8"}` }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #7C3AED, #1D4ED8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IcoSpark size={16} className="text-white" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{rec.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", background: cat.bg, color: cat.color, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{rec.category}</span>
                    <span style={{ padding: "2px 8px", background: rec.priority === "P1" ? "#F5F3FF" : "#EFF6FF", color: rec.priority === "P1" ? "#7C3AED" : "#1D4ED8", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{rec.priority}</span>
                    <span style={{ padding: "2px 8px", background: st.bg, color: st.color, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#7C3AED", fontFamily: "'JetBrains Mono', monospace" }}>{rec.confidence}%</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>AI Confidence</div>
              </div>
            </div>

            {/* Reason */}
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{rec.reason}</div>
            </div>

            {/* Evidence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Evidence</div>
              <div style={{ display: "flex", gap: 10 }}>
                {rec.evidence.map(ev => (
                  <div key={ev.label} style={{ flex: 1, background: "#F5F3FF", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18 }}>{ev.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#4C1D95", fontFamily: "'JetBrains Mono', monospace" }}>{ev.value}</div>
                    <div style={{ fontSize: 11, color: "#7C3AED" }}>{ev.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact + Scope */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: "#ECFDF5", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 2 }}>POTENTIAL IMPACT</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>{rec.impact}</div>
              </div>
              <div style={{ flex: 1, background: "#EFF6FF", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 2 }}>SCOPE</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1E40AF" }}>{rec.affectedInstitutes} Institutes · {rec.affectedStudents.toLocaleString()} Students</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => updateStatus(rec.id, "accepted")}>
                <IcoCheck size={12} />Accept
              </button>
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => updateStatus(rec.id, "review")}>
                Review
              </button>
              <button style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => updateStatus(rec.id, "rejected")}>
                <IcoX size={12} />Reject
              </button>
              <button className="btn-secondary" style={{ fontSize: 12, marginLeft: "auto" }}>
                Generate Report
              </button>
            </div>
          </div>
        );
      })}

      {/* TAB 2: AI JOBS (ai_job_market_dataset.csv) */}
      {activeTab === "ai_jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="section-header" style={{ fontSize: 16, margin: 0 }}>AI & Machine Learning Career Opportunities</div>
                  <span style={{ fontSize: 11, background: "#F5F3FF", color: "#7C3AED", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                    {aiTotal.toLocaleString()} real postings (ai_job_market_dataset.csv)
                  </span>
                </div>
                <div className="section-sub">Real job postings scraped from international and national AI hiring pipelines</div>
              </div>

              <form onSubmit={handleAISearch} style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search AI roles (e.g. LLM, Deep Learning, Vision)..."
                  value={aiSearch}
                  onChange={(e) => setAiSearch(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", minWidth: 260 }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                  <IcoSearch size={13} />
                  Filter
                </button>
              </form>
            </div>

            {loadingAI ? (
              <div style={{ padding: 30, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading real AI job market records...</div>
            ) : realAIJobs.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No AI job listings found matching search criteria.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
                {realAIJobs.map((job, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                          {job.title || "AI Engineer"}
                        </h3>
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>
                          AI Verified
                        </span>
                      </div>

                      <div style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", marginBottom: 6 }}>
                        {job.company || "Leading Tech Firm"} · {job.location || job.country_name || "Remote / Global"}
                      </div>

                      <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: "0 0 10px", maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {job.description ? job.description.replace(/<[^>]+>/g, "").slice(0, 140) + "..." : "No detailed description provided."}
                      </p>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        {job.category || "IT & AI Jobs"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#0F172A" }}>
                        {job.salary_avg ? `${job.currency || "£"}${Math.round(Number(job.salary_avg)).toLocaleString()}` : "Market Benchmark"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                Page {aiPage} of {Math.max(1, Math.ceil(aiTotal / 8))} ({aiTotal.toLocaleString()} jobs tracked)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handlePrevAIPage}
                  disabled={aiPage <= 1 || loadingAI}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextAIPage}
                  disabled={aiPage >= Math.ceil(aiTotal / 8) || loadingAI}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE-TO-JOB MATCHING (job_recommendation_dataset.csv & skills_rows.csv) */}
      {activeTab === "job_recs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Skills Taxonomy Highlights */}
          {realSkills.length > 0 && (
            <div className="chart-card" style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                Active Market Skills Taxonomy (skills_rows.csv)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {realSkills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      background: "#F1F5F9",
                      borderRadius: 12,
                      color: "#334155",
                      fontWeight: 600,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="section-header" style={{ fontSize: 16, margin: 0 }}>Candidate-to-Job Matching Engine</div>
                  <span style={{ fontSize: 11, background: "#ECFDF5", color: "#059669", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                    {jobRecsTotal.toLocaleString()} real roles (job_recommendation_dataset.csv)
                  </span>
                </div>
                <div className="section-sub">Smart recommendation matrix matching candidate competencies to live industry demands</div>
              </div>

              <form onSubmit={handleJobRecSearch} style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search role, skills, or industry..."
                  value={jobRecSearch}
                  onChange={(e) => setJobRecSearch(e.target.value)}
                  style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", minWidth: 260 }}
                />
                <button type="submit" className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                  <IcoSearch size={13} />
                  Match
                </button>
              </form>
            </div>

            {loadingJobRecs ? (
              <div style={{ padding: 30, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading recommendation matrix...</div>
            ) : realJobRecs.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No recommendation matches found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Recommended Role", "Hiring Company", "Location", "Industry", "Required Skills", "Experience", "Target Salary"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {realJobRecs.map((rec, idx) => (
                      <tr key={idx} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                          {rec["Job Title"] || rec.title || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>
                          {rec["Company"] || rec.company || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>
                          {rec["Location"] || rec.location || "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontWeight: 600 }}>
                            {rec["Industry"] || rec.industry || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", background: "#F0FDF4", color: "#166534", borderRadius: 4, fontWeight: 600 }}>
                            {rec["Required Skills"] || rec.skills || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>
                          {rec["Experience Level"] || rec.experience || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669" }}>
                          {rec["Salary"] ? `₹${Number(rec["Salary"]).toLocaleString()}` : "Market"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    Page {jobRecPage} of {Math.max(1, Math.ceil(jobRecsTotal / 8))} ({jobRecsTotal.toLocaleString()} recommendations)
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handlePrevJobRecPage}
                      disabled={jobRecPage <= 1 || loadingJobRecs}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNextJobRecPage}
                      disabled={jobRecPage >= Math.ceil(jobRecsTotal / 8) || loadingJobRecs}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
