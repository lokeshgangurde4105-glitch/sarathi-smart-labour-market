import React from "react";
import { IcoSpark, IcoCheck, IcoAlert, IcoArrowUp } from "../components/Icons";

const trainers = [
  { name: "Anita Sharma", institute: "NIELIT Pune", current: ["Python", "SQL", "Basic ML"], industryNeed: ["Advanced ML", "Generative AI", "MLOps"], gap: ["GenAI Training", "Advanced ML Certification", "MLOps Course"], cert: "Python Certified", upskillPriority: "Critical", experience: "8 yrs" },
  { name: "Rajesh Kumar", institute: "CDAC Bengaluru", current: ["Java", "Spring Boot", "MySQL"], industryNeed: ["Microservices", "Kubernetes", "Cloud Native"], gap: ["K8s Certification", "AWS Developer", "Docker Advanced"], cert: "Java SE Certified", upskillPriority: "High", experience: "6 yrs" },
  { name: "Priya Nair", institute: "SSC Hyderabad", current: ["AWS Basics", "Linux", "Networking"], industryNeed: ["AWS Advanced", "Terraform", "Cloud Security", "DevOps"], gap: ["AWS Solutions Architect", "Terraform Associate", "Cloud Security+"], cert: "AWS Cloud Practitioner", upskillPriority: "High", experience: "5 yrs" },
  { name: "Suresh Patel", institute: "NIMI Ahmedabad", current: ["AutoCAD", "Basic PLC", "Manufacturing"], industryNeed: ["Industry 4.0", "Robotics", "Digital Twin", "SCADA"], gap: ["PLC Advanced", "SCADA Certification", "Robotics Training"], cert: "AutoCAD Certified", upskillPriority: "Medium", experience: "10 yrs" },
  { name: "Kavitha Ramesh", institute: "Apollo Health Academy", current: ["EHR Basics", "Medical Records", "HIPAA"], industryNeed: ["HL7/FHIR", "Health Analytics", "AI Diagnostics"], gap: ["HL7 FHIR Developer", "Health Data Analytics", "AI in Healthcare"], cert: "HIPAA Compliance", upskillPriority: "Critical", experience: "7 yrs" },
];

const priorityStyle: Record<string, { bg: string; color: string }> = {
  Critical: { bg: "#FEF2F2", color: "#DC2626" },
  High: { bg: "#FFFBEB", color: "#D97706" },
  Medium: { bg: "#EFF6FF", color: "#1D4ED8" },
  Low: { bg: "#ECFDF5", color: "#059669" },
};

const upskillPrograms = [
  { name: "Generative AI & LLM Engineering", duration: "120 hrs", provider: "Google (Coursera)", cost: "₹18,000", enrolled: 0, target: 12, deadline: "Dec 2026" },
  { name: "AWS Solutions Architect – Associate", duration: "80 hrs", provider: "AWS Training", cost: "₹22,000", enrolled: 3, target: 8, deadline: "Nov 2026" },
  { name: "Advanced ML & MLOps", duration: "100 hrs", provider: "DeepLearning.AI", cost: "₹15,000", enrolled: 2, target: 10, deadline: "Jan 2027" },
  { name: "PLC & SCADA Advanced", duration: "60 hrs", provider: "Siemens Academy", cost: "₹25,000", enrolled: 1, target: 6, deadline: "Oct 2026" },
  { name: "HL7 FHIR Developer", duration: "40 hrs", provider: "HL7 International", cost: "₹12,000", enrolled: 0, target: 5, deadline: "Nov 2026" },
];

export default function TrainerDevelopment() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Trainer Development Dashboard</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>Trainer skill gap analysis, certification status, and AI-driven upskilling recommendations</p>
        </div>
        <button className="btn-ai"><IcoSpark size={13} />Generate Upskilling Plan</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { label: "Total Trainers", value: "186", color: "#1D4ED8" },
          { label: "Needing Upskilling", value: "24", color: "#DC2626" },
          { label: "Critical Priority", value: "8", color: "#DC2626" },
          { label: "Certified Trainers", value: "142", color: "#059669" },
          { label: "Avg. Experience", value: "7.2 yrs", color: "#0D9488" },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trainer Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {trainers.map(t => {
          const ps = priorityStyle[t.upskillPriority];
          return (
            <div key={t.name} className="chart-card" style={{ borderLeft: `3px solid ${ps.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${ps.color}22, ${ps.color}44)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: ps.color }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{t.institute} · {t.experience}</div>
                    <div style={{ fontSize: 10, marginTop: 2, padding: "1px 6px", background: "#F0FDFA", color: "#0D9488", borderRadius: 4, display: "inline-block", fontWeight: 600 }}>{t.cert}</div>
                  </div>
                </div>
                <span style={{ padding: "3px 10px", background: ps.bg, color: ps.color, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{t.upskillPriority} Priority</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>Current Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {t.current.map(s => <span key={s} style={{ padding: "2px 7px", background: "#E2E8F0", color: "#475569", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{s}</span>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", marginBottom: 6, textTransform: "uppercase" }}>Industry Need</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {t.industryNeed.map(s => <span key={s} style={{ padding: "2px 7px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{s}</span>)}
                  </div>
                </div>
              </div>

              <div style={{ background: "#F5F3FF", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", marginBottom: 6, textTransform: "uppercase" }}>
                  <IcoSpark size={10} style={{ display: "inline", marginRight: 4 }} />AI Recommended Upskilling
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {t.gap.map(g => (
                    <span key={g} style={{ padding: "3px 8px", background: "#EDE9FE", color: "#7C3AED", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>→ {g}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upskilling Programs Table */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="section-header" style={{ fontSize: 15 }}>Recommended Upskilling Programs</div>
            <div className="section-sub">Government-funded certification courses for trainer development</div>
          </div>
          <button className="btn-primary" style={{ fontSize: 12 }}>Enroll Trainers</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Program", "Duration", "Provider", "Cost", "Enrolled / Target", "Deadline"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upskillPrograms.map((p, i) => (
              <tr key={i} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{p.name}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>{p.duration}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>{p.provider}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>{p.cost}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${(p.enrolled / p.target) * 100}%`, background: "#1D4ED8" }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{p.enrolled}/{p.target}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155" }}>{p.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
