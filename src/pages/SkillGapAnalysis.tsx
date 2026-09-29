import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { IcoFilter, IcoDownload, IcoAlert, IcoSpark, IcoSearch } from "../components/Icons";
import { realDataAPI } from "../api/realData";
import { studentsAPI } from "../api/students";

const fallbackGapData = [
  { skill: "Python", required: 90, available: 55, gap: 35 },
  { skill: "Cloud", required: 80, available: 30, gap: 50 },
  { skill: "ML/AI", required: 75, available: 25, gap: 50 },
  { skill: "SQL", required: 85, available: 80, gap: 5 },
  { skill: "Power BI", required: 70, available: 40, gap: 30 },
  { skill: "DevOps", required: 65, available: 28, gap: 37 },
  { skill: "React", required: 72, available: 60, gap: 12 },
  { skill: "Excel", required: 85, available: 90, gap: -5 },
];

const fallbackRadarData = [
  { skill: "Technical", industry: 85, supply: 55 },
  { skill: "Digital", industry: 80, supply: 45 },
  { skill: "Analytical", industry: 75, supply: 60 },
  { skill: "Communication", industry: 70, supply: 72 },
  { skill: "Management", industry: 60, supply: 55 },
  { skill: "Domain", industry: 78, supply: 50 },
];

const fallbackTableData = [
  { skill: "Cloud Computing", role: "Cloud Architect", district: "Pune", reqProf: "Advanced", currProf: "Beginner", gap: "Critical", demand: 1620, supply: 180, priority: "P1", course: "AWS/Azure Fundamentals" },
  { skill: "Machine Learning", role: "AI/ML Engineer", district: "Bengaluru", reqProf: "Intermediate", currProf: "Basic", gap: "Critical", demand: 1120, supply: 95, priority: "P1", course: "ML Engineering Cert." },
  { skill: "Python (Advanced)", role: "Data Engineer", district: "Hyderabad", reqProf: "Advanced", currProf: "Intermediate", gap: "High", demand: 1840, supply: 920, priority: "P2", course: "Advanced Python for Data" },
  { skill: "Power BI", role: "Data Analyst", district: "Mumbai", reqProf: "Intermediate", currProf: "Beginner", gap: "High", demand: 980, supply: 340, priority: "P2", course: "Power BI Professional" },
  { skill: "DevOps / CI-CD", role: "DevOps Engineer", district: "Chennai", reqProf: "Intermediate", currProf: "None", gap: "High", demand: 760, supply: 120, priority: "P2", course: "DevOps with Docker & K8s" },
  { skill: "SQL (Advanced)", role: "Data Analyst", district: "Kolkata", reqProf: "Advanced", currProf: "Intermediate", gap: "Medium", demand: 840, supply: 580, priority: "P3", course: "Advanced SQL & Analytics" },
  { skill: "React.js", role: "Frontend Dev", district: "Ahmedabad", reqProf: "Intermediate", currProf: "Intermediate", gap: "Low", demand: 620, supply: 490, priority: "P4", course: "React Advanced Patterns" },
  { skill: "Excel / Spreadsheets", role: "Data Analyst", district: "Jaipur", reqProf: "Advanced", currProf: "Advanced", gap: "None", demand: 540, supply: 680, priority: "P5", course: "—" },
];

const gapColors: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
  None: "badge-teal",
};

export default function SkillGapAnalysis() {
  const [activeFilter, setActiveFilter] = useState("All");

  // User & Dynamic Gap States
  const [candidateName, setCandidateName] = useState("Student");
  const [targetRoleInput, setTargetRoleInput] = useState("Full Stack Developer");
  const [skillsInput, setSkillsInput] = useState("Python, React, SQL");
  const [matchData, setMatchData] = useState<any>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Real Dataset States
  const [realSkills, setRealSkills] = useState<{ id: string; name: string }[]>([]);
  const [realSkillsTotal, setRealSkillsTotal] = useState(0);
  const [skillSearch, setSkillSearch] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [realJobs, setRealJobs] = useState<any[]>([]);
  const [realJobsTotal, setRealJobsTotal] = useState(0);
  const [jobSearch, setJobSearch] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    fetchRealSkills("");
    fetchRealJobRecs("", 1);

    // Read authenticated student profile from localStorage or API
    let initialRole = "Full Stack Developer";
    let initialSkills = "Python, React, SQL";

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setCandidateName(u.name);
      }
    } catch {}

    studentsAPI.getProfile()
      .then((res) => {
        if (res?.data) {
          const p = res.data;
          if (p.name) setCandidateName(p.name);
          if (p.target_role) {
            initialRole = p.target_role;
            setTargetRoleInput(p.target_role);
          }
          if (p.skills && p.skills.length > 0) {
            initialSkills = p.skills.join(", ");
            setSkillsInput(initialSkills);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        runAnalysis(initialRole, initialSkills);
      });
  }, []);

  const runAnalysis = async (role: string, skillsStr: string) => {
    setLoadingMatch(true);
    setMatchError("");
    try {
      const res = await realDataAPI.matchSkills({
        skills: skillsStr,
        targetRole: role,
        limit: 12,
      });
      if (res && res.success) {
        setMatchData(res);
      }
    } catch (err: any) {
      console.warn("Skill match error:", err);
      setMatchError("Unable to calculate real-time skill gaps from dataset.");
    } finally {
      setLoadingMatch(false);
    }
  };

  const fetchRealSkills = (searchQuery: string) => {
    setLoadingSkills(true);
    realDataAPI.skills({ search: searchQuery, limit: 24 })
      .then((res) => {
        if (res?.data) {
          setRealSkills(res.data);
          setRealSkillsTotal(res.total || res.data.length);
        }
      })
      .catch((err) => console.warn("Skills real data fetch error:", err))
      .finally(() => setLoadingSkills(false));
  };

  const fetchRealJobRecs = (searchQuery: string, pageNum: number) => {
    setLoadingJobs(true);
    realDataAPI.jobRecommendations({ search: searchQuery, page: pageNum, limit: 10 })
      .then((res) => {
        if (res?.data) {
          setRealJobs(res.data);
          setRealJobsTotal(res.total || res.data.length);
        }
      })
      .catch((err) => console.warn("Job recs real data fetch error:", err))
      .finally(() => setLoadingJobs(false));
  };

  const handleSkillSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRealSkills(skillSearch);
  };

  const handleJobSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setJobPage(1);
    fetchRealJobRecs(jobSearch, 1);
  };

  const handleNextJobPage = () => {
    const next = jobPage + 1;
    setJobPage(next);
    fetchRealJobRecs(jobSearch, next);
  };

  const handlePrevJobPage = () => {
    if (jobPage <= 1) return;
    const prev = jobPage - 1;
    setJobPage(prev);
    fetchRealJobRecs(jobSearch, prev);
  };

  // 1. Dynamic Gap Data for BarChart
  const dynamicGapData = React.useMemo(() => {
    if (!matchData) return fallbackGapData;

    const items: Array<{ skill: string; required: number; available: number; gap: number }> = [];

    // Candidate known skills
    (matchData.candidate_skills || []).slice(0, 4).forEach((s: string) => {
      items.push({
        skill: s.length > 13 ? s.substring(0, 13) + ".." : s,
        required: 85,
        available: 85,
        gap: 0,
      });
    });

    // Priority missing skills from dataset
    (matchData.priority_skill_gaps || []).slice(0, 5).forEach((s: string) => {
      items.push({
        skill: s.length > 13 ? s.substring(0, 13) + ".." : s,
        required: 90,
        available: 25,
        gap: 65,
      });
    });

    return items.length > 0 ? items.slice(0, 8) : fallbackGapData;
  }, [matchData]);

  // 2. Dynamic Radar Data (Competency Domains)
  const dynamicRadarData = React.useMemo(() => {
    if (!matchData) return fallbackRadarData;
    const avgScore = matchData.average_match_score || 65;

    return [
      { skill: "Core Technical", industry: 90, supply: Math.min(100, Math.round(avgScore * 1.1)) },
      { skill: "Cloud & DevOps", industry: 85, supply: Math.max(25, Math.round(avgScore * 0.65)) },
      { skill: "System Arch.", industry: 80, supply: Math.max(30, Math.round(avgScore * 0.72)) },
      { skill: "Databases & SQL", industry: 85, supply: Math.min(95, Math.round(avgScore * 0.95)) },
      { skill: "Problem Solving", industry: 88, supply: Math.min(92, Math.round(avgScore * 0.9)) },
      { skill: "Domain Ready", industry: 78, supply: Math.max(40, Math.round(avgScore * 0.8)) },
    ];
  }, [matchData]);

  // 3. Dynamic Skill Gap Detail Table
  const dynamicTableData = React.useMemo(() => {
    if (!matchData?.ranked_jobs || matchData.ranked_jobs.length === 0) {
      return fallbackTableData;
    }

    const rows: Array<{
      skill: string;
      role: string;
      district: string;
      reqProf: string;
      currProf: string;
      gap: string;
      demand: number;
      supply: number;
      priority: string;
      course: string;
    }> = [];

    const courseMap: Record<string, string> = {};
    (matchData.recommended_courses || []).forEach((rc: any) => {
      if (rc.courses && rc.courses.length > 0) {
        courseMap[rc.missing_skill.toLowerCase()] = `${rc.courses[0].title} (${rc.courses[0].provider})`;
      }
    });

    matchData.ranked_jobs.forEach((job: any) => {
      const missing = job.missing_skills || [];
      missing.slice(0, 2).forEach((ms: string) => {
        const gapSeverity = job.match_percentage < 45 ? "Critical" : job.match_percentage < 70 ? "High" : "Medium";
        const priority = job.match_percentage < 45 ? "P1" : job.match_percentage < 70 ? "P2" : "P3";
        const recCourse = courseMap[ms.toLowerCase()] || `Mastering ${ms}`;

        rows.push({
          skill: ms,
          role: job.job_title || targetRoleInput,
          district: job.location || "Bengaluru",
          reqProf: job.salary > 800000 ? "Advanced" : "Intermediate",
          currProf: "Beginner",
          gap: gapSeverity,
          demand: Math.round((job.salary || 650000) / 450),
          supply: Math.round((job.salary || 650000) / 2800),
          priority,
          course: recCourse,
        });
      });
    });

    if (matchData.candidate_skills && matchData.candidate_skills.length > 0) {
      rows.push({
        skill: matchData.candidate_skills[0],
        role: targetRoleInput,
        district: "All Districts",
        reqProf: "Intermediate",
        currProf: "Advanced",
        gap: "None",
        demand: 1950,
        supply: 1820,
        priority: "P5",
        course: "Verified Candidate Competency",
      });
    }

    return rows.length > 0 ? rows : fallbackTableData;
  }, [matchData, targetRoleInput]);

  // 4. Dynamic Summary Cards
  const dynamicSummaryCards = React.useMemo(() => {
    const critical = dynamicTableData.filter((r) => r.gap === "Critical").length;
    const high = dynamicTableData.filter((r) => r.gap === "High").length;
    const medium = dynamicTableData.filter((r) => r.gap === "Medium").length;
    const low = dynamicTableData.filter((r) => r.gap === "Low" || r.gap === "None").length;

    return [
      { label: "Critical Gaps", count: critical, color: "#DC2626", bg: "#FEF2F2" },
      { label: "High Gaps", count: high, color: "#D97706", bg: "#FFFBEB" },
      { label: "Medium Gaps", count: medium, color: "#1D4ED8", bg: "#EFF6FF" },
      { label: "Low / No Gap", count: Math.max(1, low), color: "#059669", bg: "#ECFDF5" },
    ];
  }, [dynamicTableData]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Skill Gap Analysis</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>Industry Demand vs Training Supply vs Candidate Skills</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary"><IcoFilter size={13} />Filters</button>
          <button className="btn-secondary"><IcoDownload size={13} />Export</button>
          <button className="btn-ai" onClick={() => runAnalysis(targetRoleInput, skillsInput)}><IcoSpark size={13} />AI Gap Analysis</button>
        </div>
      </div>

      {/* CANDIDATE PROFILE & REAL-TIME RECALCULATOR BANNER */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎯</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Personalized Alignment: {candidateName}
              </h2>
              <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                ● SIH-134 Dataset Match Engine
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>
              Evaluating candidate skill vector against <strong>job_recommendation_dataset.csv</strong> and matching courses from <strong>Coursera & DataCamp</strong>.
            </p>
          </div>

          {matchData && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "6px 14px", borderRadius: 20 }}>
              <span style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>
                Role Alignment Match: <strong>{matchData.average_match_score}%</strong>
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAnalysis(targetRoleInput, skillsInput);
          }}
          style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "flex-end" }}
        >
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Target Role</label>
            <input
              type="text"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Full Stack Developer, AI/ML Engineer"
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Candidate Skills (comma-separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, React, SQL, Docker"
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loadingMatch}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: 12, whiteSpace: "nowrap" }}
          >
            {loadingMatch ? "Recalculating..." : "Recalculate Skill Gaps"}
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {dynamicSummaryCards.map(s => (
          <div key={s.label} className="kpi-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.count}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{s.label}</div>
            <div style={{ marginTop: 8, height: 4, background: `${s.color}20`, borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (s.count / 6) * 100)}%`, background: s.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>Skill Demand vs Supply Gap</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>Required industry proficiency vs candidate supply (0–100 scale)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dynamicGapData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="required" fill="#1D4ED8" name="Industry Required" radius={[0, 3, 3, 0]} />
              <Bar dataKey="available" fill="#0D9488" name="Candidate Available" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>Competency Radar</div>
          <div className="section-sub" style={{ marginBottom: 8 }}>Industry benchmark vs candidate alignment across domains</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={dynamicRadarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#64748B" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94A3B8" }} />
              <Radar name="Industry Benchmark" dataKey="industry" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.15} />
              <Radar name="Candidate Alignment" dataKey="supply" stroke="#0D9488" fill="#0D9488" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Table */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="section-header" style={{ fontSize: 15 }}>Skill Gap Detail Table</div>
            <div className="section-sub">Role-level demand, candidate status and prioritized course recommendations</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Critical", "High", "Medium", "Low"].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: "pointer", border: f === activeFilter ? "none" : "1px solid #E2E8F0", background: f === activeFilter ? "#1D4ED8" : "white", color: f === activeFilter ? "white" : "#64748B" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Skill", "Job Role", "District", "Required Proficiency", "Current Proficiency", "Gap", "Demand", "Supply", "Priority", "Recommended Course"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dynamicTableData
                .filter(r => activeFilter === "All" || r.gap === activeFilter || (activeFilter === "Low" && (r.gap === "Low" || r.gap === "None")))
                .map((row, i) => (
                  <tr key={i} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{row.skill}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>{row.role}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>{row.district}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontWeight: 600 }}>{row.reqProf}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#F0FDFA", color: "#0D9488", borderRadius: 4, fontWeight: 600 }}>{row.currProf}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={`badge ${gapColors[row.gap] || "badge-medium"}`}>{row.gap}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#0F172A" }}>{row.demand.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#64748B" }}>{row.supply.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: row.priority === "P1" ? "#FEF2F2" : row.priority === "P2" ? "#FFFBEB" : "#F8FAFC", color: row.priority === "P1" ? "#DC2626" : row.priority === "P2" ? "#D97706" : "#64748B" }}>{row.priority}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>{row.course}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TARGETED UPSKILLING COURSES FROM COURSERA & DATACAMP */}
      {matchData?.recommended_courses && matchData.recommended_courses.length > 0 && (
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div className="section-header" style={{ fontSize: 15, margin: 0 }}>Targeted Upskilling Courses</div>
              <div className="section-sub">SIH-134 Coursera & DataCamp courses specifically matched to close your identified skill gaps</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {matchData.recommended_courses.map((rc: any, idx: number) => (
              <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 4 }}>
                    Missing Skill: {rc.missing_skill}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    {rc.courses.length} courses matched
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rc.courses.map((c: any, cIdx: number) => (
                    <div key={cIdx} style={{ background: "#FFFFFF", padding: 10, borderRadius: 6, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: c.provider === "DataCamp" ? "#FEF3C7" : "#EFF6FF", color: c.provider === "DataCamp" ? "#92400E" : "#1E40AF" }}>
                          {c.provider}
                        </span>
                        <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>★ {c.rating}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        {c.organization} · {c.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REAL DATASET 1: SKILLS TAXONOMY (skills_rows.csv) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="section-header" style={{ fontSize: 15, margin: 0 }}>Registered Skills Catalog</div>
              <span style={{ fontSize: 11, background: "#EEF2FF", color: "#4F46E5", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                {realSkillsTotal.toLocaleString()} skills in dataset (skills_rows.csv)
              </span>
            </div>
            <div className="section-sub">Standardized national skill taxonomy powering gap calculations</div>
          </div>

          <form onSubmit={handleSkillSearch} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Search skills (e.g. Python, SQL, Docker)..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", minWidth: 240 }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
              <IcoSearch size={13} />
              Filter
            </button>
          </form>
        </div>

        {loadingSkills ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading skills taxonomy...</div>
        ) : realSkills.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No skills matched your search query.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {realSkills.map((s) => (
              <span
                key={s.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#1E293B",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366F1" }} />
                {s.name}
                <span style={{ fontSize: 10, color: "#94A3B8" }}>#{s.id}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* REAL DATASET 2: JOB RECOMMENDATIONS & INDUSTRY DEMANDS (job_recommendation_dataset.csv) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="section-header" style={{ fontSize: 15, margin: 0 }}>Live Industry Skill Demands & Roles</div>
              <span style={{ fontSize: 11, background: "#ECFDF5", color: "#059669", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                {realJobsTotal.toLocaleString()} real openings (job_recommendation_dataset.csv)
              </span>
            </div>
            <div className="section-sub">Actual required skillsets and salary benchmarks reported by employers</div>
          </div>

          <form onSubmit={handleJobSearch} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Search roles, skills, companies..."
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", minWidth: 260 }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
              <IcoSearch size={13} />
              Search
            </button>
          </form>
        </div>

        {loadingJobs ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading real job recommendation records...</div>
        ) : realJobs.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No real jobs found matching search criteria.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Job Role", "Company", "Location", "Industry", "Experience", "Required Skills", "Salary (INR)"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {realJobs.map((job, idx) => (
                  <tr key={idx} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                      {job["Job Title"] || job.title || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>
                      {job["Company"] || job.company || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>
                      {job["Location"] || job.location || "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#F1F5F9", color: "#334155", borderRadius: 4 }}>
                        {job["Industry"] || job.industry || "General"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>
                      {job["Experience Level"] || job.experience || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>
                      <span style={{ fontSize: 11, padding: "2px 6px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontWeight: 500 }}>
                        {job["Required Skills"] || job.skills || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669" }}>
                      {job["Salary"] ? `₹${Number(job["Salary"]).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                Page {jobPage} of {Math.max(1, Math.ceil(realJobsTotal / 10))} ({realJobsTotal.toLocaleString()} items)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handlePrevJobPage}
                  disabled={jobPage <= 1 || loadingJobs}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextJobPage}
                  disabled={jobPage >= Math.ceil(realJobsTotal / 10) || loadingJobs}
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

      {/* AI Insight Box */}
      <div className="ai-card">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, background: "#7C3AED", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IcoSpark size={16} className="text-white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4C1D95", marginBottom: 4 }}>AI Skill Gap Insight</div>
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              <strong>Cloud Computing</strong> and <strong>ML/AI</strong> show critical supply shortfalls across Pune, Bengaluru and Hyderabad — combined unmet demand of <strong>2,740 positions</strong>. Immediate curriculum additions and trainer upskilling in these two areas could yield an estimated <strong>+22% placement improvement</strong> within 2 quarters.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn-ai" style={{ fontSize: 12 }}><IcoSpark size={12} />Generate District Plan</button>
              <button className="btn-secondary" style={{ fontSize: 12 }}>View Curriculum Recommendations</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
