import React, { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { IcoArrowDown } from "../components/Icons";
import { apiClient } from "../api/client";
import { realDataAPI } from "../api/realData";
import { dashboardAPI } from "../api/dashboard";


type TrendItem = {
  month: string;
  jobs: number;
  skills: number;
  alignment: number;
};


type EmergingItem = {
  tech: string;
  growth: string;
  jobs: number;
  sector: string;
};


type SalaryItem = {
  role: string;
  min: number;
  mid: number;
  max: number;
};


type DecliningItem = {
  role: string;
  change: string;
  jobs: number;
  sector?: string;
};


type DistrictItem = {
  district: string;
  sector: string;
  topRole: string;
  demand: number;
  supply: number;
  gap: string;
  placement: string;
  salaryRange: string;
};

type DatasetSummaryItem = {
  file: string;
  description: string;
  records: number;
};

type RealJobItem = {
  title?: string;
  companyName?: string;
  location?: string;
  tagsAndSkills?: string;
};

type RealSkillItem = {
  name?: string;
};



const gapColors: Record<string, string> = {
  Critical: "#DC2626",
  High: "#D97706",
  Medium: "#1D4ED8",
  Low: "#059669",
};


const gapBg: Record<string, string> = {
  Critical: "#FEF2F2",
  High: "#FFFBEB",
  Medium: "#EFF6FF",
  Low: "#ECFDF5",
};


export default function DemandTrends() {

  // ============================================================
  // FILTERS
  // ============================================================

  const [period, setPeriod] =
    useState("12M");

  const [state, setState] =
    useState("All States");

  const [sector, setSector] =
    useState("All Sectors");


  // ============================================================
  // API STATES
  // ============================================================

  const [monthlyData, setMonthlyData] =
    useState<TrendItem[]>([]);

  const [emerging, setEmerging] =
    useState<EmergingItem[]>([]);

  const [salaryData, setSalaryData] =
    useState<SalaryItem[]>([]);

  const [declining, setDeclining] =
    useState<DecliningItem[]>([]);

  const [districtData, setDistrictData] =
    useState<DistrictItem[]>([]);

  const [realDatasetSummary, setRealDatasetSummary] =
    useState<DatasetSummaryItem[]>([]);

  const [realJobs, setRealJobs] =
    useState<RealJobItem[]>([]);

  const [realSkills, setRealSkills] =
    useState<RealSkillItem[]>([]);

  const [realDataError, setRealDataError] =
    useState("");


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // FETCH ALL DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    const loadDashboard =
      async () => {

        try {

          setLoading(true);
          setError("");


          // ------------------------------------------------------
          // Trends
          // ------------------------------------------------------

          const trendsResult = await dashboardAPI.getTrends({
            period,
            state,
            sector,
          });

          const trendsData = trendsResult?.data !== undefined ? trendsResult.data : trendsResult;

          if (
            Array.isArray(trendsData)
          ) {
            setMonthlyData(
              trendsData
            );
          } else {
            throw new Error(
              "Invalid trend response"
            );
          }


          // ------------------------------------------------------
          // Emerging
          // ------------------------------------------------------

          const emergingRes = await dashboardAPI.getEmerging(state, sector);
          const emergingData = emergingRes?.data !== undefined ? emergingRes.data : emergingRes;

          setEmerging(
            Array.isArray(
              emergingData
            )
              ? emergingData
              : []
          );


          // ------------------------------------------------------
          // Salary
          // ------------------------------------------------------

          const salaryRes = await dashboardAPI.getSalary(state, sector);
          const salary = salaryRes?.data !== undefined ? salaryRes.data : salaryRes;

          setSalaryData(
            Array.isArray(salary)
              ? salary
              : []
          );


          // ------------------------------------------------------
          // Declining
          // ------------------------------------------------------

          const decliningRes = await dashboardAPI.getDeclining(state, sector);
          const decliningData = decliningRes?.data !== undefined ? decliningRes.data : decliningRes;

          setDeclining(
            Array.isArray(
              decliningData
            )
              ? decliningData
              : []
          );


          // ------------------------------------------------------
          // Districts
          // ------------------------------------------------------

          const districtsRes = await dashboardAPI.getDistricts(state, sector);
          const districts = districtsRes?.data !== undefined ? districtsRes.data : districtsRes;

          setDistrictData(
            Array.isArray(districts)
              ? districts
              : []
          );

        } catch (err) {

          console.error(
            "Dashboard API Error:",
            err
          );

          setError(
            "Unable to load live labour market data."
          );

          setMonthlyData([]);
          setEmerging([]);
          setSalaryData([]);
          setDeclining([]);
          setDistrictData([]);

        } finally {

          setLoading(false);

        }

      };


    loadDashboard();

  }, [
    period,
    state,
    sector,
  ]);


  // ============================================================
  // LOAD SUPPLIED REAL DATASETS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadRealData = async () => {
      try {
        const [summary, jobs, skills] = await Promise.all([
          realDataAPI.summary(),
          realDataAPI.indianJobs({ limit: 8 }),
          realDataAPI.skills(undefined, 8),
        ]);

        if (cancelled) return;

        setRealDatasetSummary(Array.isArray(summary?.data) ? summary.data : []);
        setRealJobs(Array.isArray(jobs?.data) ? jobs.data : []);
        setRealSkills(Array.isArray(skills?.data) ? skills.data : []);
        setRealDataError("");
      } catch (err) {
        console.error("Real dataset API error:", err);
        if (!cancelled) {
          setRealDataError("Unable to load supplied real datasets.");
          setRealDatasetSummary([]);
          setRealJobs([]);
          setRealSkills([]);
        }
      }
    };

    loadRealData();

    return () => {
      cancelled = true;
    };
  }, []);


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 20,
        }}
      >

        <div>

          <h1
            className="font-display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 4,
            }}
          >
            Demand & Trend Analytics
          </h1>


          <p
            style={{
              fontSize: 13,
              color: "#64748B",
            }}
          >
            Real-time labour market demand
            across sectors, districts,
            job roles and salary bands
          </p>

        </div>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >

          {/* PERIOD */}

          {[
            "3M",
            "6M",
            "12M",
          ].map((p) => (

            <button
              key={p}
              onClick={() =>
                setPeriod(p)
              }
              style={{
                padding:
                  "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                cursor: "pointer",

                border:
                  p === period
                    ? "none"
                    : "1px solid #E2E8F0",

                background:
                  p === period
                    ? "#1D4ED8"
                    : "white",

                color:
                  p === period
                    ? "white"
                    : "#64748B",
              }}
            >
              {p}
            </button>

          ))}


          {/* STATE */}

          <select
            className="select-input"
            value={state}
            onChange={(e) =>
              setState(
                e.target.value
              )
            }
          >

            <option>
              All States
            </option>

            <option>
              Maharashtra
            </option>

            <option>
              Karnataka
            </option>

            <option>
              Delhi
            </option>

            <option>
              Tamil Nadu
            </option>

          </select>


          {/* SECTOR */}

          <select
            className="select-input"
            value={sector}
            onChange={(e) =>
              setSector(
                e.target.value
              )
            }
          >

            <option>
              All Sectors
            </option>

            <option>
              IT & Software
            </option>

            <option>
              Healthcare
            </option>

            <option>
              Manufacturing
            </option>

          </select>

        </div>

      </div>


      {/* ======================================================
          REAL DATASET STATUS
      ====================================================== */}

      <div className="chart-card">
        <div className="section-header" style={{ fontSize: 15, marginBottom: 4 }}>
          Real Dataset Integration
        </div>
        <div className="section-sub" style={{ marginBottom: 16 }}>
          Live records loaded from the supplied SIH 26134 datasets.
        </div>

        {realDataError ? (
          <div style={{ padding: 12, background: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 12 }}>
            {realDataError}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
              {realDatasetSummary.map((item) => (
                <div key={item.file} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, background: "#F8FAFC" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{Number(item.records || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginTop: 3 }}>{item.description}</div>
                  <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4, wordBreak: "break-word" }}>{item.file}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Live job records</div>
                {realJobs.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>No job records returned.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr>
                          {['Role', 'Company', 'Location'].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "7px 8px", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {realJobs.slice(0, 6).map((job, idx) => (
                          <tr key={`${job.title || "job"}-${idx}`}>
                            <td style={{ padding: "8px", borderBottom: "1px solid #F1F5F9", fontWeight: 600, color: "#0F172A" }}>{job.title || "—"}</td>
                            <td style={{ padding: "8px", borderBottom: "1px solid #F1F5F9", color: "#334155" }}>{job.companyName || "—"}</td>
                            <td style={{ padding: "8px", borderBottom: "1px solid #F1F5F9", color: "#64748B" }}>{job.location || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Sample real skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {realSkills.map((skill, idx) => (
                    <span key={`${skill.name || "skill"}-${idx}`} style={{ padding: "6px 9px", borderRadius: 999, background: "#EFF6FF", color: "#1D4ED8", fontSize: 10, fontWeight: 600 }}>
                      {skill.name || "Unnamed skill"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>


      {/* ======================================================
          STATUS
      ====================================================== */}

      {loading && (

        <div
          style={{
            padding: 12,
            background:
              "#EFF6FF",
            color:
              "#1D4ED8",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          Loading live labour
          market data...
        </div>

      )}


      {error && (

        <div
          style={{
            padding: 12,
            background:
              "#FEF2F2",
            color:
              "#DC2626",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {error}
        </div>

      )}


      {/* ======================================================
          TREND CHART
      ====================================================== */}

      <div className="chart-card">

        <div
          className="section-header"
          style={{
            fontSize: 15,
            marginBottom: 4,
          }}
        >
          Sector-wise Job Demand Trend
        </div>


        <div
          className="section-sub"
          style={{
            marginBottom: 16,
          }}
        >
          {state}
          {" → "}
          {sector}
          {" → "}
          {period}
        </div>


        {monthlyData.length === 0 ? (

          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94A3B8",
              fontSize: 12,
            }}
          >
            No trend data available.
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height={260}
          >

            <AreaChart
              data={monthlyData}
            >

              <defs>

                <linearGradient
                  id="jobGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#1D4ED8"
                    stopOpacity={0.18}
                  />

                  <stop
                    offset="95%"
                    stopColor="#1D4ED8"
                    stopOpacity={0.01}
                  />

                </linearGradient>


                <linearGradient
                  id="skillGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#0D9488"
                    stopOpacity={0.15}
                  />

                  <stop
                    offset="95%"
                    stopColor="#0D9488"
                    stopOpacity={0.01}
                  />

                </linearGradient>


                <linearGradient
                  id="alignmentGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#7C3AED"
                    stopOpacity={0.15}
                  />

                  <stop
                    offset="95%"
                    stopColor="#7C3AED"
                    stopOpacity={0.01}
                  />

                </linearGradient>

              </defs>


              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
              />


              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
                axisLine={false}
                tickLine={false}
              />


              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
                axisLine={false}
                tickLine={false}
              />


              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border:
                    "1px solid #E2E8F0",
                }}
              />


              <Legend
                wrapperStyle={{
                  fontSize: 11,
                }}
              />


              <Area
                type="monotone"
                dataKey="jobs"
                name="Job Demand"
                stroke="#1D4ED8"
                fill="url(#jobGradient)"
                strokeWidth={2}
                dot={false}
              />


              <Area
                type="monotone"
                dataKey="skills"
                name="Skill Demand"
                stroke="#0D9488"
                fill="url(#skillGradient)"
                strokeWidth={2}
                dot={false}
              />


              <Area
                type="monotone"
                dataKey="alignment"
                name="Alignment"
                stroke="#7C3AED"
                fill="url(#alignmentGradient)"
                strokeWidth={2}
                dot={false}
              />

            </AreaChart>

          </ResponsiveContainer>

        )}

      </div>


      {/* ======================================================
          TWO COLUMNS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 16,
        }}
      >


        {/* ====================================================
            EMERGING TECHNOLOGIES
        ==================================================== */}

        <div className="chart-card">

          <div
            className="section-header"
            style={{
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            Emerging Technologies
          </div>


          {emerging.length === 0 ? (

            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "#94A3B8",
                fontSize: 12,
              }}
            >
              No emerging technology
              data available.
            </div>

          ) : (

            emerging.map(
              (e, i) => (

                <div
                  key={`${e.tech}-${i}`}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 10,
                    padding:
                      "8px 0",

                    borderBottom:
                      i <
                        emerging.length - 1
                        ? "1px solid #F1F5F9"
                        : "none",
                  }}
                >

                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background:
                        "#F5F3FF",
                      borderRadius: 8,
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        "#7C3AED",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>


                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
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
                      {e.tech}
                    </div>


                    <div
                      style={{
                        fontSize: 10,
                        color:
                          "#64748B",
                      }}
                    >
                      {e.sector}
                      {" · "}
                      {e.jobs.toLocaleString()}
                      {" postings"}
                    </div>


                    <div
                      className="progress-bar"
                      style={{
                        marginTop: 4,
                      }}
                    >

                      <div
                        className="progress-fill"
                        style={{
                          width:
                            `${Math.min(
                              (e.jobs /
                                2000) *
                              100,
                              100
                            )}%`,

                          background:
                            "#7C3AED",
                        }}
                      />

                    </div>

                  </div>


                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        "#059669",
                    }}
                  >
                    {e.growth}
                  </span>

                </div>

              )
            )

          )}

        </div>


        {/* ====================================================
            SALARY + DECLINING
        ==================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 16,
          }}
        >


          {/* ==================================================
              SALARY
          ================================================== */}

          <div className="chart-card">

            <div
              className="section-header"
              style={{
                fontSize: 15,
                marginBottom: 4,
              }}
            >
              Salary Trends by Role
            </div>


            <div
              className="section-sub"
              style={{
                marginBottom: 12,
              }}
            >
              Annual salary ranges
              (₹ Lakhs)
            </div>


            {salaryData.length === 0 ? (

              <div
                style={{
                  padding: 20,
                  textAlign:
                    "center",
                  color:
                    "#94A3B8",
                  fontSize: 12,
                }}
              >
                No salary data
                available.
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={190}
              >

                <BarChart
                  data={salaryData}
                  layout="vertical"
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    horizontal={false}
                  />


                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 10,
                      fill:
                        "#94A3B8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    unit="L"
                  />


                  <YAxis
                    type="category"
                    dataKey="role"
                    tick={{
                      fontSize: 10,
                      fill:
                        "#334155",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={95}
                  />


                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                    formatter={(
                      value
                    ) =>
                      `₹${value}L`
                    }
                  />


                  <Bar
                    dataKey="mid"
                    fill="#1D4ED8"
                    name="Median Salary"
                    radius={[
                      0,
                      3,
                      3,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            )}

          </div>


          {/* ==================================================
              DECLINING
          ================================================== */}

          <div className="chart-card">

            <div
              className="section-header"
              style={{
                fontSize: 15,
                marginBottom: 12,
              }}
            >
              Top Declining Job Roles
            </div>


            {declining.length === 0 ? (

              <div
                style={{
                  padding: 20,
                  textAlign:
                    "center",
                  color:
                    "#94A3B8",
                  fontSize: 12,
                }}
              >
                No declining role
                data available.
              </div>

            ) : (

              declining.map(
                (d, i) => (

                  <div
                    key={`${d.role}-${i}`}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      padding:
                        "7px 0",

                      borderBottom:
                        "1px solid #F1F5F9",
                    }}
                  >

                    <div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            "#334155",
                        }}
                      >
                        {d.role}
                      </div>


                      <div
                        style={{
                          fontSize: 10,
                          color:
                            "#94A3B8",
                        }}
                      >
                        {d.jobs.toLocaleString()}
                        {" available positions"}
                        {d.sector
                          ? ` · ${d.sector}`
                          : ""}
                      </div>

                    </div>


                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          "#DC2626",
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 2,
                      }}
                    >

                      <IcoArrowDown
                        size={11}
                      />

                      {d.change}

                    </span>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          DISTRICT TABLE
      ====================================================== */}

      <div className="chart-card">

        <div
          className="section-header"
          style={{
            fontSize: 15,
            marginBottom: 4,
          }}
        >
          District-Level Demand Intelligence
        </div>


        <div
          className="section-sub"
          style={{
            marginBottom: 16,
          }}
        >
          India → State → District →
          Sector → Job Role → Skill
          hierarchy
        </div>


        <div
          style={{
            overflowX:
              "auto",
          }}
        >

          {districtData.length === 0 ? (

            <div
              style={{
                padding: 30,
                textAlign:
                  "center",
                color:
                  "#94A3B8",
                fontSize: 12,
              }}
            >
              No district data
              available for the
              selected filters.
            </div>

          ) : (

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >

              <thead>

                <tr
                  style={{
                    background:
                      "#F8FAFC",
                  }}
                >

                  {[
                    "District",
                    "Top Sector",
                    "Top Job Role",
                    "Job Demand",
                    "Candidate Supply",
                    "Skill Gap",
                    "Placement Rate",
                    "Salary Range",
                  ].map(
                    (h) => (

                      <th
                        key={h}
                        style={{
                          padding:
                            "8px 12px",
                          textAlign:
                            "left",
                          fontSize: 11,
                          fontWeight:
                            600,
                          color:
                            "#64748B",
                          borderBottom:
                            "1px solid #E2E8F0",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {h}
                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {districtData.map(
                  (row, i) => (

                    <tr
                      key={`${row.district}-${i}`}
                      className="table-row"
                      style={{
                        borderBottom:
                          "1px solid #F1F5F9",
                      }}
                    >

                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 13,
                          fontWeight:
                            600,
                          color:
                            "#0F172A",
                        }}
                      >
                        {row.district}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 12,
                          color:
                            "#334155",
                        }}
                      >
                        {row.sector}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 12,
                          color:
                            "#334155",
                        }}
                      >
                        {row.topRole}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 12,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          fontWeight:
                            600,
                          color:
                            "#0F172A",
                        }}
                      >
                        {row.demand.toLocaleString()}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 12,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          color:
                            "#64748B",
                        }}
                      >
                        {row.supply.toLocaleString()}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                        }}
                      >

                        <span
                          style={{
                            padding:
                              "2px 8px",
                            background:
                              gapBg[
                              row.gap
                              ] ||
                              "#F8FAFC",

                            color:
                              gapColors[
                              row.gap
                              ] ||
                              "#64748B",

                            borderRadius:
                              4,

                            fontSize: 11,
                            fontWeight:
                              600,
                          }}
                        >
                          {row.gap}
                        </span>

                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 12,
                          fontWeight:
                            700,
                          color:
                            "#059669",
                        }}
                      >
                        {row.placement}
                      </td>


                      <td
                        style={{
                          padding:
                            "10px 12px",
                          fontSize: 11,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          color:
                            "#64748B",
                        }}
                      >
                        {row.salaryRange}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>

  );

}