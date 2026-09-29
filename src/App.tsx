import React, { useEffect, useState } from "react";

import Login from "./components/Login";
import StudentOnboarding from "./components/StudentOnboarding";
import Sidebar, { Page } from "./components/Sidebar";
import Header from "./components/Header";
import SarathiCopilot from "./components/SarathiCopilot";
import { I18nProvider } from "./i18n";
import { apiClient, checkBackendHealth } from "./api/client";

import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAssessment from "./pages/StudentAssessment";
import CertificateVerification from "./pages/CertificateVerification";
import CompanyDashboard from "./pages/CompanyDashboard";
import InstituteDashboard from "./pages/InstituteDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import DemandTrends from "./pages/DemandTrends";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import CurriculumAlignment from "./pages/CurriculumAlignment";
import EmployerInsights from "./pages/EmployerInsights";
import AIRecommendations from "./pages/AIRecommendations";
import TrainingPlanning from "./pages/TrainingPlanning";
import TrainerDevelopment from "./pages/TrainerDevelopment";
import PlacementOutcomes from "./pages/PlacementOutcomes";
import DistrictPlanning from "./pages/DistrictPlanning";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";

/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles: Record<Page, string> = {
  dashboard: "Macro Labour Market Dashboard",
  student: "Student / Candidate Portal",
  assessment: "Skill Assessment Engine",
  verify: "Certificate Verification Registry",
  company: "Employer Portal & Candidate Matching",
  institute: "Training Institute Dashboard",
  trainer_portal: "Trainer Portal & Class Progress",
  admin_portal: "Admin Console & Data Pipeline",
  demand: "Demand & Trends",
  skillgap: "Skill Gap Analysis",
  curriculum: "Skills & Curriculum",
  employer: "Employer Insights",
  ai: "AI Recommendations",
  training: "Training & Planning",
  trainer: "Trainer Development",
  placement: "Placement & Outcomes",
  district: "District Planning",
  reports: "Reports & Analytics",
  users: "User Management",
  settings: "Settings",
};

/* =========================================================
   ROLE HELPER
========================================================= */

function getPrimaryPageForRole(roleName: string): Page {
  switch (roleName) {
    case "Student / Candidate":
      return "student";
    case "Employer / Industry":
      return "company";
    case "Training Institute":
      return "institute";
    case "Trainer":
      return "trainer_portal";
    case "Government & Admin":
    case "Admin":
    case "Government / Planner":
      return "admin_portal";
    default:
      return "dashboard";
  }
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

function SettingsPage() {
  const settings = [
    {
      label: "Platform Settings",
      desc: "Configure data refresh intervals, API connections, and SQLite database defaults",
    },
    {
      label: "Role & Permission Management",
      desc: "Manage user roles, permissions and granular multi-tenant access control",
    },
    {
      label: "Data Source Configuration",
      desc: "Connect CSV datasets, Labour Bureau surveys, and National Skill Registry feeds",
    },
    {
      label: "Notification Settings",
      desc: "Configure alerts, placement status notifications and certification verification hooks",
    },
    {
      label: "AI Recommendation Engine",
      desc: "Tune cosine similarity thresholds and job-to-candidate matching weights",
    },
    {
      label: "Credential Verification Registry",
      desc: "SHA-256 cryptographic verification parameters and tamper-evident certificate hashes",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1
        className="font-display"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: 16,
        }}
      >
        Platform Settings & Configuration
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {settings.map((item) => (
          <div key={item.label} className="chart-card">
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0F172A",
                marginBottom: 6,
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#64748B",
                marginBottom: 12,
              }}
            >
              {item.desc}
            </div>

            <button
              className="btn-secondary"
              type="button"
              style={{ fontSize: 12 }}
            >
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  /* -------------------------------------------------------
     AUTHENTICATION
  ------------------------------------------------------- */

  const ROLE_LABELS: Record<string, string> = {
    government_admin: "Government & Admin",
    government: "Government & Admin",
    admin: "Government & Admin",
    training_institute: "Training Institute",
    employer: "Employer / Industry",
    trainer: "Trainer",
    student: "Student / Candidate",
  };

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("access_token")
  );

  const [role, setRole] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        return ROLE_LABELS[u.role] || u.role || "Government / Planner";
      } catch {
        // fallback
      }
    }
    return "Government / Planner";
  });

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const [activePage, setActivePage] = useState<Page>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const mappedRole = ROLE_LABELS[u.role] || u.role;
        return getPrimaryPageForRole(mappedRole);
      } catch {
        // fallback
      }
    }
    return "dashboard";
  });

  const [profileCompleted, setProfileCompleted] = useState<boolean>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role === "student") {
          return u.profile_completed === true;
        }
      } catch {}
    }
    return true;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function handleLogin() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const mappedRole = ROLE_LABELS[user.role] || user.role || "Government / Planner";
        setRole(mappedRole);
        setActivePage(getPrimaryPageForRole(mappedRole));
        if (user.role === "student") {
          setProfileCompleted(user.profile_completed === true);
        } else {
          setProfileCompleted(true);
        }
      } catch {
        // fallback
      }
    }
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setRole("Government / Planner");
    setProfileCompleted(true);
  }

  /* -------------------------------------------------------
     LIVE DATABASE HEALTH (Requirement 38)
  ------------------------------------------------------- */

  const [dbHealth, setDbHealth] = useState<{
    status: "connected" | "degraded" | "checking";
    message: string;
  }>({ status: "checking", message: "Connecting..." });

  useEffect(() => {
    let isMounted = true;
    let isChecking = false;

    async function checkHealth() {
      if (document.visibilityState !== "visible") return;
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await checkBackendHealth();
        if (isMounted) {
          const nextStatus = res.connected ? "connected" : "degraded";
          const nextMessage = res.connected ? "CONNECTED" : "OFFLINE";
          setDbHealth((prev) => {
            if (prev.status === nextStatus && prev.message === nextMessage) {
              return prev;
            }
            return { status: nextStatus, message: nextMessage };
          });
        }
      } catch {
        if (isMounted) {
          setDbHealth((prev) => {
            if (prev.status === "degraded" && prev.message === "OFFLINE") {
              return prev;
            }
            return { status: "degraded", message: "OFFLINE" };
          });
        }
      } finally {
        isChecking = false;
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* -------------------------------------------------------
     GLOBAL FILTERS
  ------------------------------------------------------- */

  const [stateFilter, setStateFilter] = useState("All States");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  /* -------------------------------------------------------
     SEARCH DEBOUNCE
  ------------------------------------------------------- */

  useEffect(() => {
    const value = searchInput.trim();

    const timer = window.setTimeout(() => {
      setSearch(value);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  /* -------------------------------------------------------
     PAGE RENDER
  ------------------------------------------------------- */

  const renderPage = () => {
    switch (activePage) {
      case "student":
        return <StudentDashboard onNavigate={(p) => setActivePage(p as Page)} />;

      case "assessment":
        return <StudentAssessment onNavigate={(p) => setActivePage(p as Page)} />;

      case "verify":
        return <CertificateVerification onNavigate={(p) => setActivePage(p as Page)} />;

      case "company":
        return <CompanyDashboard />;

      case "institute":
        return <InstituteDashboard />;

      case "trainer_portal":
        return <TrainerDashboard />;

      case "admin_portal":
        if (role !== "Government & Admin" && role !== "Admin" && role !== "Government / Planner") {
          return (
            <div style={{ padding: 48, textAlign: "center", background: "white", margin: 24, borderRadius: 12, border: "1px solid #FECACA" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ color: "#DC2626", fontSize: 20, fontWeight: 800, margin: 0 }}>Administrative Authorization Required</h2>
              <p style={{ color: "#64748B", fontSize: 13, marginTop: 8, maxWidth: 520, margin: "8px auto 0" }}>
                Access to the SARATHI Government & Administration Console is strictly restricted to official Government Administrators. Non-administrative accounts are barred from administrative routes.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => setActivePage(getPrimaryPageForRole(role))}
              >
                Return to My Dashboard
              </button>
            </div>
          );
        }
        return <AdminDashboard />;

      case "dashboard":
        if (role === "Student / Candidate") {
          return <StudentDashboard onNavigate={(p) => setActivePage(p as Page)} />;
        }
        if (role === "Employer / Industry") {
          return <CompanyDashboard />;
        }
        if (role === "Training Institute") {
          return <InstituteDashboard />;
        }
        if (role === "Trainer") {
          return <TrainerDashboard />;
        }
        if (role === "Government & Admin" || role === "Admin" || role === "Government / Planner") {
          return <AdminDashboard />;
        }
        return (
          <Dashboard
            role={role}
            state={stateFilter}
            sector={sectorFilter}
            search={search}
            onNavigate={(p) => setActivePage(p as Page)}
          />
        );

      case "demand":
        return <DemandTrends />;

      case "skillgap":
        return <SkillGapAnalysis />;

      case "curriculum":
        return <CurriculumAlignment />;

      case "employer":
        return <EmployerInsights />;

      case "ai":
        return <AIRecommendations />;

      case "training":
        return <TrainingPlanning />;

      case "trainer":
        return <TrainerDevelopment />;

      case "placement":
        return <PlacementOutcomes />;

      case "district":
        return <DistrictPlanning />;

      case "reports":
        return <Reports />;

      case "users":
        if (role !== "Government & Admin" && role !== "Admin" && role !== "Government / Planner") {
          return (
            <div style={{ padding: 48, textAlign: "center", background: "white", margin: 24, borderRadius: 12, border: "1px solid #FECACA" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
              <h2 style={{ color: "#DC2626", fontSize: 20, fontWeight: 800, margin: 0 }}>Administrative Authorization Required</h2>
              <p style={{ color: "#64748B", fontSize: 13, marginTop: 8, maxWidth: 520, margin: "8px auto 0" }}>
                User Account Management is restricted to authorized Government Administrators.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={() => setActivePage(getPrimaryPageForRole(role))}
              >
                Return to My Dashboard
              </button>
            </div>
          );
        }
        return <UserManagement />;

      case "settings":
        return <SettingsPage />;

      default:
        return (
          <Dashboard
            role={role}
            state={stateFilter}
            sector={sectorFilter}
            search={search}
            onNavigate={(p) => setActivePage(p as Page)}
          />
        );
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <I18nProvider>
      {!isAuthenticated && <Login onLogin={handleLogin} />}
      {isAuthenticated && role === "Student / Candidate" && !profileCompleted && (
        <StudentOnboarding
          onComplete={() => {
            setProfileCompleted(true);
          }}
        />
      )}
      {isAuthenticated && (
        <div
          style={{
            display: "flex",
            height: "100%",
            background: "#F0F4F8",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* SIDEBAR */}
          {!sidebarCollapsed && (
            <Sidebar
              activePage={activePage}
              role={role}
              onNav={(page) => setActivePage(page)}
            />
          )}

          {/* MAIN AREA */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* HEADER */}
            <Header
              role={role}
              onRoleChange={(newRole) => {
                setRole(newRole);
                setActivePage(getPrimaryPageForRole(newRole));
              }}
              onMenuToggle={() => setSidebarCollapsed((previous) => !previous)}
              search={searchInput}
              onSearchChange={setSearchInput}
              state={stateFilter}
              onStateChange={setStateFilter}
              sector={sectorFilter}
              onSectorChange={setSectorFilter}
            />

            {/* BREADCRUMB */}
            <div
              style={{
                padding: "8px 24px",
                background: "white",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#94A3B8",
                }}
              >
                Labour Market Intelligence
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: "#CBD5E1",
                }}
              >
                ›
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {pageTitles[activePage] || "Overview"}
              </span>

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background:
                      dbHealth.status === "connected"
                        ? "#059669"
                        : dbHealth.status === "checking"
                        ? "#D97706"
                        : "#DC2626",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    color:
                      dbHealth.status === "connected"
                        ? "#059669"
                        : dbHealth.status === "checking"
                        ? "#D97706"
                        : "#DC2626",
                    fontWeight: 600,
                  }}
                >
                  {dbHealth.message}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  ·
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: "#64748B",
                  }}
                >
                  Role:{" "}
                  <strong
                    style={{
                      color: "#1D4ED8",
                    }}
                  >
                    {role}
                  </strong>
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  ·
                </span>

                <button
                  onClick={handleLogout}
                  type="button"
                  style={{
                    border: "none",
                    background: "none",
                    color: "#DC2626",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* PAGE CONTENT */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
              }}
            >
              {renderPage()}
            </div>
          </div>

          {/* SARATHI AI COPILOT FLOATING DRAWER */}
          <SarathiCopilot />
        </div>
      )}
    </I18nProvider>
  );
}