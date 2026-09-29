import React, { useState } from "react";
import { IcoSpark, IcoDistrict, IcoDownload, IcoCheck } from "../components/Icons";

const districts = [
  {
    name: "Pune", state: "Maharashtra", prioritySector: "IT & Software",
    topSkills: ["Cloud Computing", "ML/AI", "Python", "DevOps"],
    topRoles: ["Data Engineer", "Cloud Architect", "AI/ML Engineer"],
    studentCapacity: 4200, trainerCapacity: 82, institutes: 14,
    equipmentGap: "120 GPU systems, 480 laptops", placementTarget: "75%",
    currentPlacement: "69%", budget: "₹4.2 Cr",
    recommendedCourses: [
      { course: "Cloud Engineering", seats: 300, trainers: 10, placement: "78%" },
      { course: "AI/ML Engineering", seats: 200, trainers: 8, placement: "82%" },
      { course: "Data Analytics", seats: 400, trainers: 12, placement: "71%" },
    ],
  },
  {
    name: "Jaipur", state: "Rajasthan", prioritySector: "IT & Textiles",
    topSkills: ["Full Stack Dev", "Digital Marketing", "ERP Systems"],
    topRoles: ["Full Stack Developer", "Digital Marketer", "ERP Consultant"],
    studentCapacity: 2800, trainerCapacity: 54, institutes: 9,
    equipmentGap: "60 servers, 200 laptops", placementTarget: "65%",
    currentPlacement: "58%", budget: "₹2.8 Cr",
    recommendedCourses: [
      { course: "Full Stack Development", seats: 250, trainers: 8, placement: "68%" },
      { course: "Digital Marketing + Analytics", seats: 180, trainers: 5, placement: "62%" },
    ],
  },
  {
    name: "Ahmedabad", state: "Gujarat", prioritySector: "Manufacturing & EV",
    topSkills: ["EV Systems", "PLC/SCADA", "AutoCAD", "Industry 4.0"],
    topRoles: ["EV Technician", "Automation Engineer", "CNC Operator"],
    studentCapacity: 3400, trainerCapacity: 66, institutes: 11,
    equipmentGap: "8 EV lab setups, 30 PLC trainers", placementTarget: "68%",
    currentPlacement: "55%", budget: "₹3.5 Cr",
    recommendedCourses: [
      { course: "EV Systems Engineering", seats: 300, trainers: 10, placement: "72%" },
      { course: "PLC & SCADA", seats: 200, trainers: 7, placement: "65%" },
    ],
  },
];

export default function DistrictPlanning() {
  const [selected, setSelected] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const d = districts[selected];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>District Training Planner</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>AI-generated district-level training plans aligned with local industry demand</p>
        </div>
        <button className="btn-ai" onClick={handleGenerate} disabled={generating}>
          <IcoSpark size={13} />
          {generating ? "Generating..." : "Generate District Plan"}
        </button>
      </div>

      {/* District Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {districts.map((dist, i) => (
          <div key={dist.name} onClick={() => { setSelected(i); setGenerated(false); }}
            className="kpi-card"
            style={{ cursor: "pointer", borderTop: `3px solid ${selected === i ? "#1D4ED8" : "#E2E8F0"}`, background: selected === i ? "#EFF6FF" : "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: selected === i ? "#1D4ED8" : "#0F172A" }}>{dist.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{dist.state}</div>
              </div>
              <IcoDistrict size={18} style={{ color: selected === i ? "#1D4ED8" : "#94A3B8" }} />
            </div>
            <div style={{ fontSize: 12, color: "#334155" }}>{dist.prioritySector}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#64748B" }}>
              <span>{dist.institutes} Institutes</span>
              <span style={{ fontWeight: 600, color: parseFloat(dist.currentPlacement) >= parseFloat(dist.placementTarget) ? "#059669" : "#D97706" }}>
                {dist.currentPlacement} placed
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* District Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Overview */}
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 16, marginBottom: 12 }}>District Overview — {d.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Priority Sector", value: d.prioritySector, color: "#1D4ED8" },
              { label: "Student Capacity", value: d.studentCapacity.toLocaleString(), color: "#0D9488" },
              { label: "Trainers Available", value: d.trainerCapacity, color: "#7C3AED" },
              { label: "Training Institutes", value: d.institutes, color: "#D97706" },
              { label: "Current Placement", value: d.currentPlacement, color: "#DC2626" },
              { label: "Target Placement", value: d.placementTarget, color: "#059669" },
              { label: "Allocated Budget", value: d.budget, color: "#0D9488" },
            ].map(item => (
              <div key={item.label} style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'DM Sans', sans-serif" }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Priority Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.topSkills.map(sk => (
                <span key={sk} style={{ padding: "3px 10px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{sk}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Priority Job Roles</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.topRoles.map(r => (
                <span key={r} style={{ padding: "3px 10px", background: "#F0FDFA", color: "#0D9488", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{r}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, padding: "10px 12px", background: "#FEF2F2", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>Equipment Gap</div>
            <div style={{ fontSize: 12, color: "#334155" }}>{d.equipmentGap}</div>
          </div>
        </div>

        {/* Recommended Courses */}
        <div className="chart-card">
          <div className="section-header" style={{ fontSize: 15, marginBottom: 12 }}>Recommended Training Courses</div>
          {d.recommendedCourses.map(course => (
            <div key={course.course} style={{ padding: 16, background: "#F8FAFC", borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>{course.course}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Training Seats", value: course.seats, color: "#1D4ED8" },
                  { label: "Trainers Reqd.", value: course.trainers, color: "#7C3AED" },
                  { label: "Expected Placement", value: course.placement, color: "#059669" },
                ].map(item => (
                  <div key={item.label} style={{ background: "white", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Plan */}
      {generated && (
        <div style={{ background: "linear-gradient(135deg, #F5F3FF, #EFF6FF)", border: "1px solid #DDD6FE", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "#7C3AED", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IcoSpark size={18} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#4C1D95" }}>AI-Generated District Training Plan — {d.name}</div>
              <div style={{ fontSize: 12, color: "#7C3AED" }}>Generated based on local demand, supply, infrastructure and employer feedback</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { heading: "Immediate Actions (0–3 months)", items: [`Launch ${d.recommendedCourses[0]?.course} with ${d.recommendedCourses[0]?.seats} seats`, `Recruit ${d.recommendedCourses[0]?.trainers} new trainers via NSDC empanelment`, "Procure priority equipment from gap list", "Set up employer partnerships for guaranteed placement"] },
              { heading: "Medium-Term (3–6 months)", items: ["Complete trainer upskilling programs", "Establish industry lab partnerships", "Pilot industry project-based curriculum", "Launch employer-validated certification"] },
              { heading: "Long-Term (6–12 months)", items: [`Achieve ${d.placementTarget} placement target`, "Set up continuous employer feedback loop", "Expand successful courses to neighbouring districts", "Generate district labour market report"] },
            ].map(section => (
              <div key={section.heading} style={{ background: "white", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4C1D95", marginBottom: 10 }}>{section.heading}</div>
                {section.items.map(item => (
                  <div key={item} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                    <IcoCheck size={12} style={{ color: "#059669", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn-primary" style={{ fontSize: 12 }}>Accept & Implement Plan</button>
            <button className="btn-secondary" style={{ fontSize: 12 }}><IcoDownload size={12} />Export PDF</button>
            <button className="btn-secondary" style={{ fontSize: 12 }}>Share with District Admin</button>
          </div>
        </div>
      )}
    </div>
  );
}
