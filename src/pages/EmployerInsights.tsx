import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IcoEmployer, IcoSpark, IcoArrowUp, IcoFilter } from "../components/Icons";

const surveys = [
  { company: "Infosys Ltd.", sector: "IT", roles: ["Data Engineer", "Cloud Architect"], skills: ["Python", "AWS", "Spark"], proficiency: "Advanced", experience: "3–5 years", tech: ["Apache Kafka", "Databricks"], salary: "₹12L–₹22L", hiringDifficulty: "High", futureSkills: ["GenAI", "MLOps"], verified: true },
  { company: "Apollo Hospitals", sector: "Healthcare", roles: ["Health Data Analyst"], skills: ["SQL", "Power BI", "HL7"], proficiency: "Intermediate", experience: "2–4 years", tech: ["Epic EHR", "Tableau"], salary: "₹6L–₹12L", hiringDifficulty: "Medium", futureSkills: ["AI Diagnostics", "FHIR"], verified: true },
  { company: "TCS", sector: "IT", roles: ["Full Stack Developer", "DevOps Engineer"], skills: ["React", "Node.js", "Docker", "K8s"], proficiency: "Intermediate–Advanced", experience: "2–6 years", tech: ["Jenkins", "Azure DevOps"], salary: "₹8L–₹18L", hiringDifficulty: "High", futureSkills: ["Rust", "WebAssembly"], verified: true },
  { company: "Mahindra Electric", sector: "Manufacturing", roles: ["EV Systems Engineer"], skills: ["Battery Management", "CAN Bus", "Python"], proficiency: "Intermediate", experience: "3–5 years", tech: ["MATLAB/Simulink", "LabVIEW"], salary: "₹8L–₹16L", hiringDifficulty: "Critical", futureSkills: ["Solid-State Battery", "V2G"], verified: false },
  { company: "HDFC Bank", sector: "BFSI", roles: ["Cybersecurity Analyst", "Risk Analyst"], skills: ["SIEM", "Python", "SQL", "ISO 27001"], proficiency: "Intermediate–Advanced", experience: "3–6 years", tech: ["Splunk", "Palo Alto"], salary: "₹10L–₹20L", hiringDifficulty: "High", futureSkills: ["Zero Trust", "AI-Fraud Detection"], verified: true },
];

const difficultyColor: Record<string, { bg: string; color: string }> = {
  Critical: { bg: "#FEF2F2", color: "#DC2626" },
  High: { bg: "#FFFBEB", color: "#D97706" },
  Medium: { bg: "#EFF6FF", color: "#1D4ED8" },
  Low: { bg: "#ECFDF5", color: "#059669" },
};

const skillDemandData = [
  { skill: "Python", demand: 92 },
  { skill: "Cloud (AWS/Azure)", demand: 88 },
  { skill: "SQL/Analytics", demand: 85 },
  { skill: "ML/AI", demand: 78 },
  { skill: "DevOps/Docker", demand: 72 },
  { skill: "React/Frontend", demand: 65 },
  { skill: "Cybersecurity", demand: 60 },
  { skill: "Data Visualization", demand: 58 },
];

const consultations = [
  { sector: "IT & Software", experts: ["Dr. Rajan Kumar (IIT)", "Ms. Priya Sharma (Google India)"], techChanges: "Rapid adoption of GenAI and LLMs replacing traditional analytics workflows", emerging: "GenAI Engineering, Prompt Engineering, AI Safety", productivity: "2× improvement expected with AI-augmented workflows", curriculumRec: "Add 40-hour GenAI module; include ethics and prompt design" },
  { sector: "Manufacturing", experts: ["Mr. Arjun Mehta (Mahindra R&D)", "Dr. S. Krishnamurthy (IIT Madras)"], techChanges: "Industry 4.0 — IoT, robotics, digital twins transforming shop floor", emerging: "PLC Programming, SCADA, Robotics Integration, Digital Twin", productivity: "30% efficiency gain through automation literacy", curriculumRec: "Add PLC/SCADA labs; partner with Siemens Academy" },
  { sector: "Healthcare", experts: ["Dr. Anjali Rao (AIIMS)", "Mr. Deepak Nair (Philips Healthcare)"], techChanges: "AI-assisted diagnosis, EHR adoption, telemedicine growth", emerging: "Digital Health Analytics, FHIR Standards, Medical Imaging AI", productivity: "Telemedicine scales access 5× with digital literacy", curriculumRec: "Include HL7/FHIR standards, EHR training, health data privacy" },
];

export default function EmployerInsights() {
  const [tab, setTab] = useState<"surveys" | "consultation" | "productivity">("surveys");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Employer Insights</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>Survey responses, industry consultations, productivity standards and hiring difficulty</p>
        </div>
        <button className="btn-primary"><IcoEmployer size={13} />Add Employer Survey</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Survey Responses", value: "842", sub: "from 284 companies", color: "#1D4ED8" },
          { label: "Industry Consultations", value: "156", sub: "expert sessions", color: "#0D9488" },
          { label: "Avg. Hiring Difficulty", value: "High", sub: "across IT & Mfg", color: "#D97706" },
          { label: "Skills Validated", value: "68", sub: "by employer consensus", color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} className="kpi-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E2E8F0" }}>
        {(["surveys", "consultation", "productivity"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "none", color: tab === t ? "#1D4ED8" : "#64748B", borderBottom: tab === t ? "2px solid #1D4ED8" : "2px solid transparent", marginBottom: -1 }}>
            {t === "surveys" ? "Employer Surveys" : t === "consultation" ? "Industry Consultations" : "Productivity Standards"}
          </button>
        ))}
      </div>

      {tab === "surveys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {surveys.map(s => {
                const dc = difficultyColor[s.hiringDifficulty];
                return (
                  <div key={s.company} className="chart-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IcoEmployer size={16} style={{ color: "#1D4ED8" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{s.company}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{s.sector}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ padding: "2px 8px", background: dc.bg, color: dc.color, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Hiring Difficulty: {s.hiringDifficulty}</span>
                        {s.verified && <span style={{ padding: "2px 8px", background: "#ECFDF5", color: "#059669", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ Verified</span>}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>JOB ROLES</div>
                        {s.roles.map(r => <div key={r} style={{ fontSize: 12, color: "#334155", marginBottom: 2 }}>• {r}</div>)}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>REQUIRED SKILLS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {s.skills.map(sk => <span key={sk} style={{ padding: "2px 6px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{sk}</span>)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>FUTURE SKILLS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {s.futureSkills.map(fs => <span key={fs} style={{ padding: "2px 6px", background: "#F5F3FF", color: "#7C3AED", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{fs}</span>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "8px 0", borderTop: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Proficiency: <strong style={{ color: "#334155" }}>{s.proficiency}</strong></span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Experience: <strong style={{ color: "#334155" }}>{s.experience}</strong></span>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Salary: <strong style={{ color: "#059669" }}>{s.salary}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Skill demand chart */}
            <div className="chart-card" style={{ height: "fit-content" }}>
              <div className="section-header" style={{ fontSize: 14, marginBottom: 4 }}>Most Requested Skills</div>
              <div className="section-sub" style={{ marginBottom: 12 }}>Employer survey consensus score</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={skillDemandData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => `${v}/100`} />
                  <Bar dataKey="demand" fill="#1D4ED8" radius={[0, 4, 4, 0]} name="Demand Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "consultation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {consultations.map(c => (
            <div key={c.sector} className="chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div className="section-header" style={{ fontSize: 15 }}>{c.sector}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{c.experts.join(" · ")}</div>
                </div>
                <span className="badge badge-teal">Industry Consultation</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Technology Changes", value: c.techChanges, color: "#1D4ED8", bg: "#EFF6FF" },
                  { label: "Emerging Requirements", value: c.emerging, color: "#7C3AED", bg: "#F5F3FF" },
                  { label: "Productivity Standards", value: c.productivity, color: "#059669", bg: "#ECFDF5" },
                  { label: "Curriculum Recommendation", value: c.curriculumRec, color: "#D97706", bg: "#FFFBEB" },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "productivity" && (
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>Industry Productivity Standards</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>Required skill proficiency and productivity benchmarks by job role</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Job Role", "Required Skills & Proficiency", "Expected Productivity Level", "Industry Benchmark", "Candidate Match"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { role: "Data Analyst", skills: [["SQL", "Advanced"], ["Python", "Intermediate"], ["Power BI", "Intermediate"], ["Excel", "Advanced"]], productivity: "12 dashboards/sprint, 95% accuracy", benchmark: "Top 40th percentile", match: 58 },
                { role: "Cloud Engineer", skills: [["AWS/Azure", "Advanced"], ["Terraform", "Intermediate"], ["Linux", "Advanced"], ["K8s", "Intermediate"]], productivity: "99.9% uptime, 2hr deployment cycle", benchmark: "Top 30th percentile", match: 32 },
                { role: "Full Stack Developer", skills: [["React", "Advanced"], ["Node.js", "Intermediate"], ["SQL", "Intermediate"], ["Docker", "Beginner"]], productivity: "8 features/sprint, zero critical bugs", benchmark: "Top 50th percentile", match: 72 },
                { role: "Cybersecurity Analyst", skills: [["SIEM", "Advanced"], ["Python", "Intermediate"], ["Network", "Advanced"], ["ISO 27001", "Certified"]], productivity: "<2hr incident response, 0 breaches", benchmark: "Top 25th percentile", match: 28 },
              ].map((row, i) => (
                <tr key={i} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{row.role}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {row.skills.map(([sk, prof]) => (
                        <span key={sk} style={{ padding: "2px 8px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                          {sk} <strong style={{ color: "#1E40AF" }}>({prof})</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#334155" }}>{row.productivity}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: "#64748B" }}>{row.benchmark}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${row.match}%`, background: row.match >= 60 ? "#059669" : row.match >= 40 ? "#D97706" : "#DC2626" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: row.match >= 60 ? "#059669" : row.match >= 40 ? "#D97706" : "#DC2626" }}>{row.match}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
