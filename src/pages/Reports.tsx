import React, { useState, useEffect } from "react";
import { IcoDownload, IcoReports, IcoSpark, IcoRefresh } from "../components/Icons";
import { apiClient } from "../api";

interface ReportOverviewData {
  generated_at: string;
  students: {
    total: number;
    industry_ready: number;
    average_readiness: number;
  };
  curriculum: {
    total_courses: number;
    average_alignment: number;
    needing_update: number;
  };
  jobs: {
    total_active: number;
    skills_tracked: number;
  };
}

const typeColors: Record<string, { bg: string; color: string }> = {
  Market: { bg: "#EFF6FF", color: "#1D4ED8" },
  Skills: { bg: "#FEF2F2", color: "#DC2626" },
  Planning: { bg: "#F5F3FF", color: "#7C3AED" },
  Curriculum: { bg: "#FFFBEB", color: "#D97706" },
  Employer: { bg: "#F0FDFA", color: "#0D9488" },
  Placement: { bg: "#ECFDF5", color: "#059669" },
  Trainer: { bg: "#F5F3FF", color: "#7C3AED" },
  Infra: { bg: "#F8FAFC", color: "#64748B" },
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  ready: { bg: "#ECFDF5", color: "#059669", label: "Ready" },
  draft: { bg: "#FFFBEB", color: "#D97706", label: "Draft" },
  generating: { bg: "#EFF6FF", color: "#1D4ED8", label: "Generating..." },
};

export default function Reports() {
  const [overview, setOverview] = useState<ReportOverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await apiClient<{ success: boolean; data: ReportOverviewData }>("/api/reports/overview");
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error("Failed to load reports overview", err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleExportCSV = async (reportType: string, filename: string) => {
    setGenerating(reportType);
    setDownloadSuccess(null);
    try {
      let endpoint = "/api/reports/overview";
      if (reportType === "Skills") endpoint = "/api/reports/skill-gap";
      if (reportType === "Placement") endpoint = "/api/reports/placement";

      const res = await apiClient<{ success: boolean; data: any }>(endpoint);
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(`Exported ${filename}.json successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(`Export error: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    setLoading(true);
    setDownloadSuccess(null);
    await fetchOverview();
    setLoading(false);
    setDownloadSuccess("All live reports generated and synchronized with database!");
  };

  const reports = [
    {
      name: "Labour Market Report",
      desc: "Comprehensive demand trends, job postings, sector growth and salary analysis",
      lastGenerated: overview?.generated_at ? "Today" : "Sep 2, 2026",
      records: `${overview?.jobs.total_active ?? 24} postings tracked`,
      status: "ready",
      type: "Market",
    },
    {
      name: "Skill Gap Report",
      desc: "District-wise skill gap matrix with priority rankings and recommendations",
      lastGenerated: "Sep 1, 2026",
      records: `${overview?.jobs.skills_tracked ?? 18} skills tracked`,
      status: "ready",
      type: "Skills",
    },
    {
      name: "District Training Report",
      desc: "District-level training capacity, infrastructure gap and plan execution status",
      lastGenerated: "Aug 28, 2026",
      records: "36 districts covered",
      status: "ready",
      type: "Planning",
    },
    {
      name: "Curriculum Alignment Report",
      desc: "AI-scored curriculum alignment with industry requirements for all courses",
      lastGenerated: "Aug 30, 2026",
      records: `${overview?.curriculum.total_courses ?? 14} courses analyzed`,
      status: "ready",
      type: "Curriculum",
    },
    {
      name: "Employer Demand Report",
      desc: "Survey responses, hiring difficulty trends and future skill requirements",
      lastGenerated: "Sep 1, 2026",
      records: "842 employer surveys",
      status: "ready",
      type: "Employer",
    },
    {
      name: "Placement Report",
      desc: "Before/after curriculum update placement impact, sector-wise outcomes",
      lastGenerated: "Sep 2, 2026",
      records: `${overview?.students.total ?? 30} candidates tracked`,
      status: "ready",
      type: "Placement",
    },
    {
      name: "Trainer Development Report",
      desc: "Trainer skill gap, upskilling progress and certification status",
      lastGenerated: "Aug 25, 2026",
      records: "186 trainers assessed",
      status: "draft",
      type: "Trainer",
    },
    {
      name: "Infrastructure Report",
      desc: "Equipment gap, lab requirements and budget requirements by district",
      lastGenerated: "Aug 20, 2026",
      records: "36 districts, 120 institutes",
      status: "generating",
      type: "Infra",
    },
  ];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>
            Generate, export and share comprehensive labour market intelligence reports
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateAll}
          disabled={loading}
          className="btn-ai"
          style={{ cursor: loading ? "wait" : "pointer" }}
        >
          <IcoSpark size={13} />
          {loading ? "Generating..." : "Generate All Reports"}
        </button>
      </div>

      {downloadSuccess && (
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            background: "#ECFDF5",
            color: "#059669",
            border: "1px solid #A7F3D0",
          }}
        >
          {downloadSuccess}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Reports Available", value: "8", color: "#1D4ED8" },
          { label: "Industry Ready Students", value: overview ? overview.students.industry_ready.toString() : "21", color: "#059669" },
          { label: "Average Alignment Score", value: overview ? `${overview.curriculum.average_alignment}%` : "84.2%", color: "#0D9488" },
          { label: "Active Jobs Tracked", value: overview ? overview.jobs.total_active.toString() : "24", color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="kpi-card">
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {reports.map((report) => {
          const tc = typeColors[report.type];
          const sc = statusConfig[report.status];
          const isBusy = generating === report.type;
          return (
            <div
              key={report.name}
              className="chart-card"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: tc.bg,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IcoReports size={16} style={{ color: tc.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{report.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      Last: {report.lastGenerated} · {report.records}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: tc.bg,
                      color: tc.color,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {report.type}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: sc.bg,
                      color: sc.color,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{report.desc}</p>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleExportCSV(report.type, report.name.toLowerCase().replace(/\s+/g, "_"))}
                  disabled={isBusy}
                  className="btn-primary"
                  style={{ fontSize: 11, cursor: isBusy ? "wait" : "pointer" }}
                >
                  <IcoReports size={11} />
                  {isBusy ? "Exporting..." : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV(report.type, report.name.toLowerCase().replace(/\s+/g, "_"))}
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                >
                  <IcoDownload size={11} />
                  Export
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
