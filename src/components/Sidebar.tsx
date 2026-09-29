import React from "react";
import {
  IcoDashboard,
  IcoTrends,
  IcoSkillGap,
  IcoSkills,
  IcoEmployer,
  IcoAI,
  IcoTraining,
  IcoTrainer,
  IcoPlacement,
  IcoDistrict,
  IcoReports,
  IcoUsers,
  IcoSettings,
  IcoZap,
  IcoUser,
  IcoTarget,
  IcoBook,
  IcoCheck,
} from "./Icons";

export type Page =
  | "dashboard"
  | "student"
  | "assessment"
  | "verify"
  | "company"
  | "institute"
  | "trainer_portal"
  | "admin_portal"
  | "demand"
  | "skillgap"
  | "curriculum"
  | "employer"
  | "ai"
  | "training"
  | "trainer"
  | "placement"
  | "district"
  | "reports"
  | "users"
  | "settings";

interface SidebarProps {
  activePage: Page;
  onNav: (p: Page) => void;
  role?: string;
}

interface NavSection {
  title: string;
  items: {
    id: Page;
    label: string;
    Icon: React.FC<{ size?: number; className?: string }>;
  }[];
}

export default function Sidebar({ activePage, onNav, role = "Government / Planner" }: SidebarProps) {
  const renderNavItem = ({
    id,
    label,
    Icon,
  }: {
    id: Page;
    label: string;
    Icon: React.FC<{ size?: number; className?: string }>;
  }) => {
    const isActive = activePage === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          onNav(id);
        }}
        className={`sidebar-nav-item${isActive ? " active" : ""}`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          background: isActive ? "#EFF6FF" : "transparent",
          color: isActive ? "#1D4ED8" : "#475569",
          padding: "9px 12px",
          marginBottom: 3,
          borderRadius: 7,
          fontSize: 12,
          fontWeight: isActive ? 700 : 500,
          transition: "all 0.15s ease",
        }}
      >
        <Icon size={15} />
        <span>{label}</span>
      </button>
    );
  };

  // Build role-specific navigation sections
  const getNavSections = (): NavSection[] => {
    if (role === "Student / Candidate") {
      return [
        {
          title: "CANDIDATE WORKSPACE",
          items: [
            { id: "student", label: "My Student Portal", Icon: IcoUser },
            { id: "assessment", label: "Take Skill Assessment", Icon: IcoTarget },
            { id: "verify", label: "Verify Credential", Icon: IcoCheck },
          ],
        },
        {
          title: "MARKET INTELLIGENCE",
          items: [
            { id: "demand", label: "Job Market Trends", Icon: IcoTrends },
            { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
            { id: "curriculum", label: "Courses & Curriculum", Icon: IcoSkills },
          ],
        },
      ];
    }

    if (role === "Employer / Industry") {
      return [
        {
          title: "EMPLOYER WORKSPACE",
          items: [
            { id: "company", label: "Company Portal & Jobs", Icon: IcoDashboard },
            { id: "employer", label: "Employer Insights", Icon: IcoEmployer },
            { id: "verify", label: "Verify Credentials", Icon: IcoCheck },
          ],
        },
        {
          title: "LABOUR INTELLIGENCE",
          items: [
            { id: "demand", label: "Skill Demand Trends", Icon: IcoTrends },
            { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
            { id: "placement", label: "Placement Outcomes", Icon: IcoPlacement },
          ],
        },
      ];
    }

    if (role === "Training Institute") {
      return [
        {
          title: "INSTITUTE WORKSPACE",
          items: [
            { id: "institute", label: "Institute Dashboard", Icon: IcoDashboard },
            { id: "training", label: "Training & Planning", Icon: IcoTraining },
            { id: "placement", label: "Placement Outcomes", Icon: IcoPlacement },
            { id: "verify", label: "Verify Certificates", Icon: IcoCheck },
          ],
        },
        {
          title: "CURRICULUM & TRENDS",
          items: [
            { id: "curriculum", label: "Curriculum Alignment", Icon: IcoSkills },
            { id: "demand", label: "Demand Trends", Icon: IcoTrends },
            { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
          ],
        },
      ];
    }

    if (role === "Trainer") {
      return [
        {
          title: "TRAINER WORKSPACE",
          items: [
            { id: "trainer_portal", label: "Trainer Portal", Icon: IcoDashboard },
            { id: "trainer", label: "Trainer Development", Icon: IcoTrainer },
            { id: "curriculum", label: "Course Modules", Icon: IcoSkills },
            { id: "verify", label: "Verify Credentials", Icon: IcoCheck },
          ],
        },
        {
          title: "SKILLS & DEMAND",
          items: [
            { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
            { id: "demand", label: "Labour Demand", Icon: IcoTrends },
          ],
        },
      ];
    }

    if (role === "Government & Admin" || role === "Admin" || role === "Government / Planner") {
      return [
        {
          title: "ADMIN & VERIFICATION",
          items: [
            { id: "admin_portal", label: "Admin & Verification Center", Icon: IcoZap },
            { id: "users", label: "User Management", Icon: IcoUsers },
            { id: "reports", label: "Reports & Data Pipeline", Icon: IcoReports },
            { id: "verify", label: "Verify Certificates", Icon: IcoCheck },
            { id: "district", label: "District Planning", Icon: IcoDistrict },
            { id: "settings", label: "Settings", Icon: IcoSettings },
          ],
        },
        {
          title: "LABOUR MARKET & CURRICULUM",
          items: [
            { id: "dashboard", label: "Macro Dashboard", Icon: IcoDashboard },
            { id: "demand", label: "Demand & Trends", Icon: IcoTrends },
            { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
            { id: "curriculum", label: "Curriculum Alignment", Icon: IcoSkills },
            { id: "employer", label: "Employer Insights", Icon: IcoEmployer },
            { id: "ai", label: "AI Recommendations", Icon: IcoAI },
            { id: "training", label: "Training Planning", Icon: IcoTraining },
            { id: "placement", label: "Placement Outcomes", Icon: IcoPlacement },
          ],
        },
        {
          title: "CROSS-ROLE PORTALS",
          items: [
            { id: "student", label: "Student Portal View", Icon: IcoUser },
            { id: "company", label: "Employer Portal View", Icon: IcoEmployer },
            { id: "institute", label: "Institute Portal View", Icon: IcoBook },
            { id: "trainer_portal", label: "Trainer Portal View", Icon: IcoTrainer },
          ],
        },
      ];
    }

    // Default fallback
    return [
      {
        title: "MAIN NAVIGATION",
        items: [
          { id: "dashboard", label: "Macro Dashboard", Icon: IcoDashboard },
          { id: "demand", label: "Demand & Trends", Icon: IcoTrends },
          { id: "skillgap", label: "Skill Gap Analysis", Icon: IcoSkillGap },
          { id: "curriculum", label: "Skills & Curriculum", Icon: IcoSkills },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <aside
      style={{
        width: 260,
        height: "100%",
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ================= LOGO ================= */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid #E2E8F0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, #1D4ED8, #0D9488)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IcoZap size={16} className="text-white" />
          </div>

          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Labour Market
            </div>

            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                color: "#64748B",
                lineHeight: 1.2,
              }}
            >
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* SIH Badge */}
        <div
          style={{
            marginTop: 8,
            padding: "4px 8px",
            background: "#F0FDFA",
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              background: "#059669",
              borderRadius: "50%",
            }}
          />

          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#0D9488",
            }}
          >
            SIH PS-26134
          </span>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 8px",
        }}
      >
        {navSections.map((section, idx) => (
          <div key={section.title} style={{ marginBottom: idx < navSections.length - 1 ? 12 : 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94A3B8",
                letterSpacing: "0.08em",
                padding: "6px 12px 4px",
              }}
            >
              {section.title}
            </div>
            {section.items.map(renderNavItem)}
          </div>
        ))}
      </nav>

      {/* ================= DATA SOURCES ================= */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #E2E8F0",
          background: "#F8FAFC",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            marginBottom: 6,
          }}
        >
          SQLite DB Tier Active
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {["FastAPI", "ORM", "SQLite", "Live Auth"].map((src) => (
            <span
              key={src}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                background: "#ECFDF5",
                color: "#059669",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {src}
            </span>
          ))}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#94A3B8",
            marginTop: 6,
          }}
        >
          Full Stack: Connected
        </div>
      </div>
    </aside>
  );
}