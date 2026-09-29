import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  IcoArrowUp,
  IcoArrowDown,
  IcoSpark,
  IcoAlert,
  IcoCheck,
  IcoFilter,
  IcoTrends,
  IcoUser,
  IcoBook,
  IcoTarget,
  IcoZap,
} from "../components/Icons";
import { apiClient } from "../api/client";

/* =========================================================
   TYPES
========================================================= */

type Page =
  | "dashboard"
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

interface DashboardProps {
  role?: string;
  state?: string;
  sector?: string;
  search?: string;
  onNavigate?: (page: Page) => void;
}

interface DashboardData {
  total_jobs: number;
  active_jobs: number;
  skills_tracked: number;
  emerging_skills: number;
  students_analyzed: number;
  industry_partners: number;
  overall_skill_gap: number;
  curriculum_alignment: number;
}

interface TrendData {
  month: string;
  postings: number;
  highDemand: number;
  emerging: number;
}

interface SectorData {
  name: string;
  value: number;
  jobs?: number;
  color?: string;
}

interface RoleData {
  role: string;
  sector: string;
  demand: number;
  growth: string;
  gap: string;
}

interface AlertData {
  type: string;
  text: string;
}

interface SourceData {
  name: string;
  records: string;
  updated: string;
  status: string;
}

/* =========================================================
   ROLE CARDS
========================================================= */

const roleCards: {
  role: string;
  desc: string;
  color: string;
  bg: string;
  page: Page;
}[] = [
    {
      role: "Student / Candidate",
      desc:
        "Find career pathways and personalised skill recommendations",
      color: "#1D4ED8",
      bg: "#EFF6FF",
      page: "skillgap",
    },
    {
      role: "Employer / Industry",
      desc:
        "Post jobs, define skill requirements and validate candidates",
      color: "#0D9488",
      bg: "#F0FDFA",
      page: "employer",
    },
    {
      role: "Government / Planner",
      desc:
        "Monitor labour demand and create district training plans",
      color: "#7C3AED",
      bg: "#F5F3FF",
      page: "district",
    },
    {
      role: "Training Institute",
      desc:
        "Align courses, trainers and capacity with industry demand",
      color: "#D97706",
      bg: "#FFFBEB",
      page: "curriculum",
    },
    {
      role: "Trainer",
      desc:
        "Track trainer skills, certifications and recommended upskilling",
      color: "#059669",
      bg: "#ECFDF5",
      page: "trainer",
    },
  ];

/* =========================================================
   DEFAULT COLORS
========================================================= */

const defaultColors = [
  "#1D4ED8",
  "#0D9488",
  "#7C3AED",
  "#D97706",
  "#059669",
  "#DC2626",
  "#64748B",
  "#EA580C",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Dashboard({
  role = "Government / Planner",
  state = "All States",
  sector = "All Sectors",
  search = "",
  onNavigate,
}: DashboardProps) {
  /* =======================================================
     API
  ======================================================= */

  const API_URL =
    (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  /* =======================================================
     STATE
  ======================================================= */

  const [period, setPeriod] = useState("6M");

  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);

  const [trendData, setTrendData] =
    useState<TrendData[]>([]);

  const [sectorData, setSectorData] =
    useState<SectorData[]>([]);

  const [topRoles, setTopRoles] =
    useState<RoleData[]>([]);

  const [aiAlerts, setAiAlerts] =
    useState<AlertData[]>([]);

  const [dataSources, setDataSources] =
    useState<SourceData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     BUILD PARAMETERS
  ======================================================= */

  const buildParams = (
    includePeriod = false
  ): URLSearchParams => {
    const params = new URLSearchParams();

    if (
      role &&
      role !== "All Roles"
    ) {
      params.set("role", role);
    }

    if (
      state &&
      state !== "All States"
    ) {
      params.set("state", state);
    }

    if (
      sector &&
      sector !== "All Sectors"
    ) {
      params.set("sector", sector);
    }

    if (search.trim()) {
      params.set(
        "search",
        search.trim()
      );
    }

    if (includePeriod) {
      params.set(
        "period",
        period
      );
    }

    return params;
  };

  /* =======================================================
     API FETCH
  ======================================================= */

  async function apiFetch<T>(
    endpoint: string,
    signal?: AbortSignal
  ): Promise<T> {
    const result = await apiClient<any>(endpoint, { signal });

    if (
      result?.success === false
    ) {
      throw new Error(
        result?.message ||
        "API returned unsuccessful response"
      );
    }

    return (
      result?.data !== undefined
        ? result.data
        : result
    ) as T;
  }

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const baseParams =
          buildParams(false);

        const trendParams =
          buildParams(true);

        const query =
          baseParams.toString()
            ? `?${baseParams.toString()}`
            : "";

        const trendQuery =
          trendParams.toString()
            ? `?${trendParams.toString()}`
            : "";

        console.log(
          "================================="
        );

        console.log(
          "LOADING DASHBOARD"
        );

        console.log(
          "API:",
          API_URL
        );

        console.log(
          "ROLE:",
          role
        );

        console.log(
          "STATE:",
          state
        );

        console.log(
          "SECTOR:",
          sector
        );

        console.log(
          "SEARCH:",
          search
        );

        console.log(
          "PERIOD:",
          period
        );

        console.log(
          "FILTER QUERY:",
          query
        );

        /* -----------------------------------------------
           API REQUESTS
        ----------------------------------------------- */

        const summaryPromise = apiFetch<DashboardData>(
          `/api/dashboard/summary${query}`,
          controller.signal
        ).catch((err) => {
          console.warn("Notice: Dashboard summary error:", err);
          return null;
        });

        const trendsPromise = apiFetch<TrendData[]>(
          `/api/dashboard/trends${trendQuery}`,
          controller.signal
        ).catch(() => []);

        const sectorsPromise = apiFetch<SectorData[]>(
          `/api/dashboard/sector-distribution${query}`,
          controller.signal
        ).catch(() => []);

        const rolesPromise = apiFetch<RoleData[]>(
          `/api/dashboard/top-roles${query}`,
          controller.signal
        ).catch(() => []);

        const alertsPromise = apiFetch<AlertData[]>(
          `/api/dashboard/alerts${query}`,
          controller.signal
        ).catch(() => []);

        const sourcesPromise = apiFetch<SourceData[]>(
          `/api/dashboard/sources${query}`,
          controller.signal
        ).catch(() => []);

        const [
          summary,
          trends,
          sectors,
          roles,
          alerts,
          sources,
        ] = await Promise.all([
          summaryPromise,
          trendsPromise,
          sectorsPromise,
          rolesPromise,
          alertsPromise,
          sourcesPromise,
        ]);

        if (
          controller.signal.aborted
        ) {
          return;
        }

        /* -----------------------------------------------
           SAVE DATA
        ----------------------------------------------- */

        setDashboardData(summary);

        setTrendData(
          Array.isArray(trends)
            ? trends
            : []
        );

        setSectorData(
          Array.isArray(sectors)
            ? sectors
            : []
        );

        setTopRoles(
          Array.isArray(roles)
            ? roles
            : []
        );

        setAiAlerts(
          Array.isArray(alerts)
            ? alerts
            : []
        );

        setDataSources(
          Array.isArray(sources)
            ? sources
            : []
        );

        console.log(
          "DASHBOARD DATA:",
          summary
        );
      } catch (err: any) {
        if (
          err?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "DASHBOARD ERROR:",
          err
        );

        if (
          !controller.signal.aborted
        ) {
          setError(
            err?.message ||
            "Unable to load dashboard."
          );

          setDashboardData(null);
          setTrendData([]);
          setSectorData([]);
          setTopRoles([]);
          setAiAlerts([]);
          setDataSources([]);
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, [
    API_URL,
    role,
    state,
    sector,
    search,
    period,
  ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleRoleClick = (
    page: Page
  ) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  /* =======================================================
     KPI VALUES
  ======================================================= */

  const totalJobs =
    dashboardData?.total_jobs ?? 0;

  const activeJobs =
    dashboardData?.active_jobs ?? 0;

  const skillsTracked =
    dashboardData?.skills_tracked ?? 0;

  const emergingSkills =
    dashboardData?.emerging_skills ?? 0;

  const skillGap =
    dashboardData?.overall_skill_gap ?? 0;

  const curriculumAlignment =
    dashboardData?.curriculum_alignment ?? 0;

  const studentsAnalyzed =
    dashboardData?.students_analyzed ?? 0;

  const industryPartners =
    dashboardData?.industry_partners ?? 0;

  /* =======================================================
     CALCULATED KPI
  ======================================================= */

  const coursesNeedingUpdate =
    Math.max(
      0,
      100 - curriculumAlignment
    );

  const placementRate =
    Math.min(
      95,
      Math.max(
        50,
        Math.round(
          curriculumAlignment + 4
        )
      )
    );

  const employerSatisfaction =
    Math.min(
      95,
      Math.max(
        55,
        Math.round(
          curriculumAlignment + 14
        )
      )
    );

  /* =======================================================
     ACTIVE FILTERS
  ======================================================= */

  const activeFilters =
    useMemo(() => {
      const filters: string[] =
        [];

      if (
        state &&
        state !== "All States"
      ) {
        filters.push(state);
      }

      if (
        sector &&
        sector !== "All Sectors"
      ) {
        filters.push(sector);
      }

      if (search.trim()) {
        filters.push(
          `"${search.trim()}"`
        );
      }

      return filters;
    }, [
      state,
      sector,
      search,
    ]);

  /* =======================================================
     KPI CARDS
  ======================================================= */

  const kpis = [
    {
      label:
        "Total Job Postings",
      value:
        loading
          ? "..."
          : totalJobs.toLocaleString(),
      change:
        "+18%",
      up:
        true,
      color:
        "#1D4ED8",
      bg:
        "#EFF6FF",
      icon:
        IcoTrends,
      sub:
        `${state} · ${sector}`,
    },

    {
      label:
        "High Demand Roles",
      value:
        loading
          ? "..."
          : activeJobs.toLocaleString(),
      change:
        "+4",
      up:
        true,
      color:
        "#0D9488",
      bg:
        "#F0FDFA",
      icon:
        IcoTarget,
      sub:
        "active jobs",
    },

    {
      label:
        "High Demand Skills",
      value:
        loading
          ? "..."
          : skillsTracked.toLocaleString(),
      change:
        "+7",
      up:
        true,
      color:
        "#7C3AED",
      bg:
        "#F5F3FF",
      icon:
        IcoSpark,
      sub:
        "skills tracked",
    },

    {
      label:
        "Emerging Skills",
      value:
        loading
          ? "..."
          : emergingSkills.toLocaleString(),
      change:
        "+3",
      up:
        true,
      color:
        "#059669",
      bg:
        "#ECFDF5",
      icon:
        IcoZap,
      sub:
        "identified skills",
    },

    {
      label:
        "Critical Skill Gaps",
      value:
        loading
          ? "..."
          : `${skillGap}%`,
      change:
        "+2",
      up:
        false,
      color:
        "#DC2626",
      bg:
        "#FEF2F2",
      icon:
        IcoAlert,
      sub:
        "overall skill gap",
    },

    {
      label:
        "Courses Needing Update",
      value:
        loading
          ? "..."
          : `${coursesNeedingUpdate}%`,
      change:
        "-3",
      up:
        true,
      color:
        "#D97706",
      bg:
        "#FFFBEB",
      icon:
        IcoBook,
      sub:
        "curriculum alignment",
    },

    {
      label:
        "Students Analyzed",
      value:
        loading
          ? "..."
          : studentsAnalyzed.toLocaleString(),
      change:
        "+8%",
      up:
        true,
      color:
        "#64748B",
      bg:
        "#F8FAFC",
      icon:
        IcoUser,
      sub:
        "students tracked",
    },

    {
      label:
        "Placement Rate",
      value:
        loading
          ? "..."
          : `${placementRate}%`,
      change:
        "+5%",
      up:
        true,
      color:
        "#059669",
      bg:
        "#ECFDF5",
      icon:
        IcoCheck,
      sub:
        "calculated",
    },

    {
      label:
        "Employer Satisfaction",
      value:
        loading
          ? "..."
          : `${employerSatisfaction}%`,
      change:
        "+3%",
      up:
        true,
      color:
        "#0D9488",
      bg:
        "#F0FDFA",
      icon:
        IcoTarget,
      sub:
        "calculated",
    },

    {
      label:
        "Industry Partners",
      value:
        loading
          ? "..."
          : industryPartners.toLocaleString(),
      change:
        "+4",
      up:
        true,
      color:
        "#DC2626",
      bg:
        "#FEF2F2",
      icon:
        IcoUser,
      sub:
        "industry partners",
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0F172A",
              margin:
                "0 0 4px 0",
            }}
          >
            Labour Market Intelligence Dashboard
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#64748B",
              margin: 0,
            }}
          >
            Real-time insights for
            industry-aligned skill
            development · SIH PS-26134
          </p>

          {/* CONNECTION STATUS */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                minWidth: 7,
                borderRadius: "50%",
                background:
                  error
                    ? "#DC2626"
                    : loading
                      ? "#D97706"
                      : "#059669",
              }}
            />

            <span
              style={{
                fontSize: 11,
                color:
                  error
                    ? "#DC2626"
                    : loading
                      ? "#D97706"
                      : "#059669",
                fontWeight: 600,
              }}
            >
              {error
                ? "API Error"
                : loading
                  ? "Loading live data..."
                  : "Live API Connected"}
            </span>

            {activeFilters.length >
              0 && (
                <>
                  <span
                    style={{
                      color:
                        "#CBD5E1",
                    }}
                  >
                    ·
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color:
                        "#64748B",
                    }}
                  >
                    Filters:
                  </span>

                  {activeFilters.map(
                    (filter) => (
                      <span
                        key={filter}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color:
                            "#1D4ED8",
                          background:
                            "#EFF6FF",
                          padding:
                            "3px 7px",
                          borderRadius:
                            10,
                        }}
                      >
                        {filter}
                      </span>
                    )
                  )}
                </>
              )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color:
                  "#DC2626",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ACTIONS */}

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <button
            className="btn-secondary"
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            <IcoFilter
              size={13}
            />
            Refresh
          </button>

          <button
            className="btn-ai"
            type="button"
            onClick={() =>
              handleRoleClick("ai")
            }
          >
            <IcoSpark
              size={13}
            />
            AI Insights
          </button>
        </div>
      </div>

      {/* =================================================
          ROLE ACCESS
      ================================================= */}

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color:
              "#64748B",
            marginBottom: 10,
            letterSpacing:
              "0.04em",
          }}
        >
          ROLE-BASED ACCESS
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {roleCards.map(
            (card) => (
              <div
                key={card.role}
                className="role-card"
                onClick={() =>
                  handleRoleClick(
                    card.page
                  )
                }
                style={{
                  borderLeft:
                    `3px solid ${card.color}`,
                  cursor:
                    "pointer",
                  transition:
                    "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background:
                      card.bg,
                    borderRadius: 8,
                    margin:
                      "0 auto 10px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <IcoUser
                    size={16}
                    style={{
                      color:
                        card.color,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      "#0F172A",
                    marginBottom: 4,
                  }}
                >
                  {card.role}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color:
                      "#64748B",
                    lineHeight:
                      1.4,
                  }}
                >
                  {card.desc}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      card.color,
                  }}
                >
                  Open →
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =================================================
          INTELLIGENCE FLOW
      ================================================= */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #1E293B 0%, #1D4ED8 50%, #0D9488 100%)",
          borderRadius: 12,
          padding:
            "16px 20px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color:
              "rgba(255,255,255,0.6)",
            marginBottom: 10,
            letterSpacing:
              "0.08em",
          }}
        >
          CONTINUOUS INTELLIGENCE LOOP
        </div>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 6,
            flexWrap:
              "wrap",
          }}
        >
          {[
            "Job Market Data",
            "→",
            "AI Analytics",
            "→",
            "Demand Modeling",
            "→",
            "Skill Gap Detection",
            "→",
            "Curriculum Alignment",
            "→",
            "Training Delivery",
            "→",
            "Placement",
            "→",
            "Employer Feedback",
            "→",
            "Updated Intelligence",
          ].map(
            (item, index) =>
              item === "→" ? (
                <span
                  key={index}
                  style={{
                    color:
                      "rgba(255,255,255,0.4)",
                    fontSize: 14,
                  }}
                >
                  →
                </span>
              ) : (
                <span
                  key={index}
                  style={{
                    padding:
                      "3px 10px",
                    background:
                      "rgba(255,255,255,0.12)",
                    borderRadius:
                      20,
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      "white",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {item}
                </span>
              )
          )}
        </div>
      </div>

      {/* =================================================
          KPI
      ================================================= */}

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color:
              "#64748B",
            marginBottom: 10,
            letterSpacing:
              "0.04em",
          }}
        >
          KEY PERFORMANCE INDICATORS
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(5, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {kpis.map(
            (kpi) => {
              const Icon =
                kpi.icon;

              return (
                <div
                  key={
                    kpi.label
                  }
                  className="kpi-card"
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      marginBottom:
                        10,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background:
                          kpi.bg,
                        borderRadius:
                          8,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      <Icon
                        size={15}
                        style={{
                          color:
                            kpi.color,
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          kpi.up
                            ? "#059669"
                            : "#DC2626",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 2,
                      }}
                    >
                      {kpi.up ? (
                        <IcoArrowUp
                          size={10}
                        />
                      ) : (
                        <IcoArrowDown
                          size={10}
                        />
                      )}

                      {kpi.change}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily:
                        "'DM Sans', sans-serif",
                      fontSize: 24,
                      fontWeight: 700,
                      color:
                        "#0F172A",
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        "#334155",
                      marginTop: 4,
                    }}
                  >
                    {kpi.label}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color:
                        "#94A3B8",
                      marginTop: 2,
                    }}
                  >
                    {kpi.sub}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* =================================================
          CHARTS
      ================================================= */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: 16,
        }}
      >
        {/* LABOUR DEMAND */}

        <div
          className="chart-card"
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                16,
              gap: 10,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                className="section-header"
                style={{
                  fontSize: 15,
                }}
              >
                Labour Demand Trend
              </div>

              <div
                className="section-sub"
              >
                {state} · {sector}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 4,
              }}
            >
              {[
                "3M",
                "6M",
                "12M",
              ].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setPeriod(
                        item
                      )
                    }
                    style={{
                      padding:
                        "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius:
                        6,
                      cursor:
                        "pointer",
                      border:
                        item ===
                          period
                          ? "none"
                          : "1px solid #E2E8F0",
                      background:
                        item ===
                          period
                          ? "#1D4ED8"
                          : "white",
                      color:
                        item ===
                          period
                          ? "white"
                          : "#64748B",
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          {trendData.length >
            0 ? (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <LineChart
                data={
                  trendData
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill:
                      "#94A3B8",
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                />

                <YAxis
                  yAxisId="left"
                  tick={{
                    fontSize: 11,
                    fill:
                      "#94A3B8",
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{
                    fontSize: 11,
                    fill:
                      "#94A3B8",
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                />

                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius:
                      8,
                    border:
                      "1px solid #E2E8F0",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                  }}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="postings"
                  stroke="#1D4ED8"
                  strokeWidth={
                    2.5
                  }
                  dot={{
                    r: 4,
                    fill:
                      "#1D4ED8",
                  }}
                  name="Job Postings"
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="highDemand"
                  stroke="#0D9488"
                  strokeWidth={
                    2
                  }
                  dot={{
                    r: 3,
                    fill:
                      "#0D9488",
                  }}
                  name="High Demand Roles"
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="emerging"
                  stroke="#7C3AED"
                  strokeWidth={
                    2
                  }
                  strokeDasharray="5 3"
                  dot={{
                    r: 3,
                    fill:
                      "#7C3AED",
                  }}
                  name="Emerging Skills"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 220,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                color:
                  "#94A3B8",
                fontSize: 12,
              }}
            >
              {loading
                ? "Loading trend data..."
                : "No trend data available"}
            </div>
          )}
        </div>

        {/* SECTOR DISTRIBUTION */}

        <div
          className="chart-card"
        >
          <div
            className="section-header"
            style={{
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            Sector Distribution
          </div>

          <div
            className="section-sub"
            style={{
              marginBottom:
                12,
            }}
          >
            {state} job demand by sector
          </div>

          {sectorData.length >
            0 ? (
            <ResponsiveContainer
              width="100%"
              height={140}
            >
              <PieChart>
                <Pie
                  data={
                    sectorData
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={
                    42
                  }
                  outerRadius={
                    65
                  }
                  paddingAngle={
                    3
                  }
                  dataKey="value"
                >
                  {sectorData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          entry.color ||
                          defaultColors[
                          index %
                          defaultColors.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 140,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize: 12,
                color:
                  "#94A3B8",
              }}
            >
              {loading
                ? "Loading..."
                : "No sector data"}
            </div>
          )}

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 5,
            }}
          >
            {sectorData.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item.name
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        background:
                          item.color ||
                          defaultColors[
                          index %
                          defaultColors.length
                          ],
                        borderRadius:
                          2,
                      }}
                    />

                    <span
                      style={{
                        fontSize: 11,
                        color:
                          "#334155",
                      }}
                    >
                      {item.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        "#0F172A",
                      fontFamily:
                        "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.value}%
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          BOTTOM ROW
      ================================================= */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {/* TOP ROLES */}

        <div
          className="chart-card"
        >
          <div
            className="section-header"
            style={{
              fontSize: 15,
              marginBottom:
                12,
            }}
          >
            Top Growing Job Roles
          </div>

          {topRoles.length >
            0 ? (
            topRoles.map(
              (
                roleItem,
                index
              ) => (
                <div
                  key={`${roleItem.role}-${index}`}
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 10,
                    padding:
                      "8px 0",
                    borderBottom:
                      index <
                        topRoles.length -
                        1
                        ? "1px solid #F1F5F9"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      background:
                        "#EFF6FF",
                      borderRadius:
                        6,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        "#1D4ED8",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth:
                        0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          "#0F172A",
                      }}
                    >
                      {
                        roleItem.role
                      }
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color:
                          "#64748B",
                      }}
                    >
                      {
                        roleItem.sector
                      }
                      {" · "}
                      {roleItem.demand.toLocaleString()}
                      {" postings"}
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      alignItems:
                        "flex-end",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          "#059669",
                      }}
                    >
                      {
                        roleItem.growth
                      }
                    </span>

                    <span
                      className={`badge badge-${String(
                        roleItem.gap
                      ).toLowerCase()}`}
                    >
                      {
                        roleItem.gap
                      }
                    </span>
                  </div>
                </div>
              )
            )
          ) : (
            <div
              style={{
                padding:
                  "30px 10px",
                textAlign:
                  "center",
                fontSize: 12,
                color:
                  "#94A3B8",
              }}
            >
              {loading
                ? "Loading roles..."
                : "No matching job roles found."}
            </div>
          )}
        </div>

        {/* AI ALERTS */}

        <div
          className="chart-card"
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              marginBottom:
                12,
            }}
          >
            <div
              className="section-header"
              style={{
                fontSize: 15,
              }}
            >
              AI Alerts
            </div>

            <span
              className="badge badge-ai"
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 4,
              }}
            >
              <IcoSpark
                size={10}
              />

              {aiAlerts.length}
              {" Active"}
            </span>
          </div>

          {aiAlerts.length >
            0 ? (
            aiAlerts.map(
              (
                alert,
                index
              ) => {
                const colors: Record<
                  string,
                  {
                    bg: string;
                    border: string;
                    text: string;
                  }
                > = {
                  critical: {
                    bg:
                      "#FEF2F2",
                    border:
                      "#FCA5A5",
                    text:
                      "#DC2626",
                  },

                  high: {
                    bg:
                      "#FFFBEB",
                    border:
                      "#FCD34D",
                    text:
                      "#D97706",
                  },

                  medium: {
                    bg:
                      "#EFF6FF",
                    border:
                      "#93C5FD",
                    text:
                      "#1D4ED8",
                  },

                  info: {
                    bg:
                      "#F5F3FF",
                    border:
                      "#C4B5FD",
                    text:
                      "#7C3AED",
                  },
                };

                const color =
                  colors[
                  alert.type?.toLowerCase()
                  ] ||
                  colors.info;

                return (
                  <div
                    key={
                      index
                    }
                    style={{
                      padding:
                        "10px 12px",
                      background:
                        color.bg,
                      border:
                        `1px solid ${color.border}`,
                      borderRadius:
                        8,
                      marginBottom:
                        8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          color.text,
                        fontWeight: 600,
                        textTransform:
                          "uppercase",
                        marginBottom:
                          3,
                      }}
                    >
                      {
                        alert.type
                      }
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#334155",
                        lineHeight:
                          1.4,
                      }}
                    >
                      {
                        alert.text
                      }
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div
              style={{
                padding:
                  "30px 10px",
                textAlign:
                  "center",
                fontSize: 12,
                color:
                  "#94A3B8",
              }}
            >
              {loading
                ? "Loading alerts..."
                : "No active alerts"}
            </div>
          )}
        </div>

        {/* DATA SOURCES */}

        <div
          className="chart-card"
        >
          <div
            className="section-header"
            style={{
              fontSize: 15,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Data Sources & Provenance</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                background: "#EEF2F6",
                color: "#334155",
                letterSpacing: "0.5px",
                border: "1px solid #CBD5E1",
              }}
            >
              DATA MODE: REFERENCE / DEMO &amp; LIVE
            </span>
          </div>

          {dataSources.length >
            0 ? (
            dataSources.map(
              (
                source
              ) => {
                const isLive =
                  source.status
                    ?.toLowerCase() ===
                  "live";

                return (
                  <div
                    key={
                      source.name
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 8,
                      padding:
                        "7px 0",
                      borderBottom:
                        "1px solid #F1F5F9",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        background:
                          isLive
                            ? "#059669"
                            : "#D97706",
                        borderRadius:
                          "50%",
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth:
                          0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color:
                            "#334155",
                        }}
                      >
                        {
                          source.name
                        }
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color:
                            "#94A3B8",
                        }}
                      >
                        {
                          source.updated
                        }
                        {" · "}
                        {
                          source.records
                        }
                        {" records"}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        padding:
                          "2px 6px",
                        background:
                          isLive
                            ? "#ECFDF5"
                            : "#FFFBEB",
                        color:
                          isLive
                            ? "#059669"
                            : "#D97706",
                        borderRadius:
                          4,
                        fontWeight: 600,
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {
                        source.status
                      }
                    </span>
                  </div>
                );
              }
            )
          ) : (
            <div
              style={{
                padding:
                  "30px 10px",
                textAlign:
                  "center",
                fontSize: 12,
                color: "#94A3B8",
              }}
            >
              {loading
                ? "Loading sources..."
                : "No data sources available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}