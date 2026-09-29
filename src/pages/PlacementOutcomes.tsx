import React from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { IcoArrowUp, IcoCheck } from "../components/Icons";

const beforeAfterData = [
  { period: "Q1 '25 (Before)", placement: 52, satisfaction: 68, salaryAvg: 4.2, retention: 62, matchScore: 58 },
  { period: "Q2 '25 (Before)", placement: 55, satisfaction: 70, salaryAvg: 4.4, retention: 64, matchScore: 60 },
  { period: "Q3 '25 (After Update)", placement: 61, satisfaction: 74, salaryAvg: 5.1, retention: 70, matchScore: 68 },
  { period: "Q4 '25 (After Update)", placement: 65, satisfaction: 78, salaryAvg: 5.6, retention: 73, matchScore: 72 },
  { period: "Q1 '26 (After Update)", placement: 68, satisfaction: 80, salaryAvg: 6.2, retention: 76, matchScore: 76 },
  { period: "Q2 '26 (After Update)", placement: 72, satisfaction: 84, salaryAvg: 6.8, retention: 79, matchScore: 80 },
];

const sectorPlacement = [
  { sector: "IT & Software", placed: 2840, trained: 3800, rate: 75, avgSalary: "₹8.4L" },
  { sector: "Healthcare", placed: 1120, trained: 1600, rate: 70, avgSalary: "₹5.2L" },
  { sector: "BFSI", placed: 680, trained: 1000, rate: 68, avgSalary: "₹6.1L" },
  { sector: "Manufacturing", placed: 540, trained: 920, rate: 59, avgSalary: "₹4.8L" },
  { sector: "Retail", placed: 380, trained: 720, rate: 53, avgSalary: "₹3.6L" },
];

const pieData = [
  { name: "Placed within 3 months", value: 48, color: "#059669" },
  { name: "Placed within 6 months", value: 20, color: "#0D9488" },
  { name: "Self-employed", value: 8, color: "#7C3AED" },
  { name: "Higher Education", value: 12, color: "#1D4ED8" },
  { name: "Not placed", value: 12, color: "#E2E8F0" },
];

const impactMetrics = [
  { label: "Placement Rate Improvement", before: "52%", after: "72%", change: "+20pp", positive: true },
  { label: "Avg. Starting Salary", before: "₹4.2L", after: "₹6.8L", change: "+62%", positive: true },
  { label: "Employer Satisfaction", before: "68%", after: "84%", change: "+16pp", positive: true },
  { label: "Skill Match Score", before: "58%", after: "80%", change: "+22pp", positive: true },
  { label: "6-Month Job Retention", before: "62%", after: "79%", change: "+17pp", positive: true },
  { label: "Time to Placement", before: "5.2 months", after: "3.1 months", change: "-40%", positive: true },
];

export default function PlacementOutcomes() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Placement & Outcomes</h1>
        <p style={{ fontSize: 13, color: "#64748B" }}>Measurable impact of curriculum alignment on placement rates, salaries, and employer satisfaction</p>
      </div>

      {/* Impact Banner */}
      <div style={{ background: "linear-gradient(135deg, #059669, #0D9488)", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, letterSpacing: "0.08em" }}>CURRICULUM ALIGNMENT IMPACT — BEFORE vs AFTER</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {impactMetrics.map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif" }}>{m.change}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{m.before} → {m.after}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>Quarterly Outcomes Trend</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>Before and after curriculum update comparison</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={beforeAfterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="placement" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} name="Placement Rate %" />
              <Line type="monotone" dataKey="satisfaction" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 3 }} name="Employer Satisfaction %" />
              <Line type="monotone" dataKey="matchScore" stroke="#7C3AED" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Skill Match Score %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>Placement Outcomes</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Cohort of 8,920 trained candidates</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, background: p.color, borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#334155" }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Table */}
      <div className="chart-card">
        <div className="section-header" style={{ fontSize: 15, marginBottom: 16 }}>Sector-wise Placement Performance</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Sector", "Students Trained", "Students Placed", "Placement Rate", "Avg. Salary", "Target"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectorPlacement.map((row, i) => (
              <tr key={i} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{row.sector}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{row.trained.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#059669" }}>{row.placed.toLocaleString()}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${row.rate}%`, background: row.rate >= 70 ? "#059669" : row.rate >= 60 ? "#D97706" : "#DC2626" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.rate >= 70 ? "#059669" : row.rate >= 60 ? "#D97706" : "#DC2626" }}>{row.rate}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>{row.avgSalary}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: row.rate >= 70 ? "#ECFDF5" : "#FEF2F2", color: row.rate >= 70 ? "#059669" : "#DC2626", borderRadius: 4, fontWeight: 600 }}>
                    {row.rate >= 70 ? "✓ On Target" : "Below Target"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
