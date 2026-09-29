import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IcoUsers, IcoCheck, IcoAlert, IcoSearch, IcoRefresh } from "../components/Icons";
import { adminAPI, type AdminUserItem, type AuditLogItem } from "../api";

const roleColors: Record<string, { bg: string; color: string; label: string }> = {
  government_admin: { bg: "#F5F3FF", color: "#7C3AED", label: "Govt / Admin" },
  training_institute: { bg: "#EFF6FF", color: "#1D4ED8", label: "Training Institute" },
  employer: { bg: "#F0FDFA", color: "#0D9488", label: "Employer / Industry" },
  trainer: { bg: "#FFFBEB", color: "#D97706", label: "Trainer" },
  student: { bg: "#ECFDF5", color: "#059669", label: "Student / Candidate" },
  admin: { bg: "#FEF2F2", color: "#DC2626", label: "Admin" },
};

const activityData = [
  { day: "Mon", logins: 142, actions: 380 },
  { day: "Tue", logins: 168, actions: 420 },
  { day: "Wed", logins: 195, actions: 510 },
  { day: "Thu", logins: 188, actions: 490 },
  { day: "Fri", logins: 172, actions: 445 },
  { day: "Sat", logins: 84, actions: 210 },
  { day: "Sun", logins: 62, actions: 155 },
];

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);

    adminAPI.getUsers(roleFilter, "ALL", search)
      .then((usersRes) => {
        if (usersRes?.success) {
          setUsers(usersRes.data || []);
        }
      })
      .catch((err: any) => {
        console.warn("Failed to load users", err);
      });

    adminAPI.getMetrics()
      .then((metricsRes) => {
        if (metricsRes?.success) {
          setMetrics(metricsRes.metrics || null);
        }
      })
      .catch((err: any) => {
        console.warn("Failed to load metrics", err);
      });

    adminAPI.getAuditLogs(10)
      .then((auditRes) => {
        if (auditRes?.success) {
          setAuditLogs(auditRes.data || []);
        }
      })
      .catch((err: any) => {
        console.warn("Failed to load audit logs", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleActivate = async (userId: number) => {
    setActivatingId(userId);
    setFeedbackMessage("");
    try {
      const res = await adminAPI.activateUser(userId);
      if (res.success) {
        setFeedbackMessage(res.message);
        // Refresh users and metrics
        fetchData();
      }
    } catch (err: any) {
      setFeedbackMessage(`Error: ${err.message}`);
    } finally {
      setActivatingId(null);
    }
  };

  const roleCounts = metrics?.users_by_role || {};
  const totalUsers = metrics?.total_users ?? users.length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
            User Management & Admin
          </h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>
            Platform users, live SQLite database records, system health, and audit trail
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <IcoRefresh size={13} /> Refresh Records
        </button>
      </div>

      {feedbackMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 12,
            background: feedbackMessage.startsWith("Error") ? "#FEF2F2" : "#ECFDF5",
            color: feedbackMessage.startsWith("Error") ? "#DC2626" : "#059669",
            border: `1px solid ${feedbackMessage.startsWith("Error") ? "#FCA5A5" : "#A7F3D0"}`,
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* User Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {[
          { label: "Total Users", value: totalUsers.toString(), color: "#1D4ED8" },
          { label: "Students", value: (roleCounts.student ?? 0).toString(), color: "#059669" },
          { label: "Employers", value: (roleCounts.employer ?? 0).toString(), color: "#0D9488" },
          { label: "Institutes", value: (roleCounts.training_institute ?? 0).toString(), color: "#7C3AED" },
          { label: "Trainers", value: (roleCounts.trainer ?? 0).toString(), color: "#D97706" },
          { label: "Govt. Planners", value: (roleCounts.government_admin ?? 0).toString(), color: "#DC2626" },
        ].map((s) => (
          <div key={s.label} className="kpi-card">
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Users Table */}
        <div className="chart-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div className="section-header" style={{ fontSize: 15, margin: 0 }}>
              Live Platform Users ({users.length})
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "4px 8px 4px 26px",
                    fontSize: 12,
                    border: "1px solid #E2E8F0",
                    borderRadius: 6,
                    width: 170,
                  }}
                />
                <IcoSearch size={12} style={{ position: "absolute", left: 8, color: "#94A3B8" }} />
              </form>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  background: "white",
                  color: "#334155",
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="student">Student</option>
                <option value="employer">Employer</option>
                <option value="training_institute">Institute</option>
                <option value="trainer">Trainer</option>
                <option value="government_admin">Govt / Admin</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["Name / Email", "Role", "Verification", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#64748B",
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                      Loading real users from SQLite database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
                      No matching user records found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const rc = roleColors[u.role] || {
                      bg: "#F1F5F9",
                      color: "#475569",
                      label: u.role,
                    };
                    const isActive = u.account_status === "ACTIVE";
                    return (
                      <tr key={u.id} className="table-row" style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                background: rc.bg,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: rc.color,
                              }}
                            >
                              {(u.name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#64748B" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              background: rc.bg,
                              color: rc.color,
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {rc.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 11 }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <span
                              title={u.email_verified ? "Email Verified" : "Email Unverified"}
                              style={{
                                padding: "1px 5px",
                                borderRadius: 3,
                                fontSize: 10,
                                background: u.email_verified ? "#ECFDF5" : "#FEF2F2",
                                color: u.email_verified ? "#059669" : "#DC2626",
                                fontWeight: 600,
                              }}
                            >
                              Email
                            </span>
                            <span
                              title={u.organization_verified ? "Org Verified" : "Org Unverified"}
                              style={{
                                padding: "1px 5px",
                                borderRadius: 3,
                                fontSize: 10,
                                background: u.organization_verified ? "#EFF6FF" : "#F8FAFC",
                                color: u.organization_verified ? "#1D4ED8" : "#94A3B8",
                                fontWeight: 600,
                              }}
                            >
                              Org
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: isActive ? "#059669" : "#D97706",
                              padding: "2px 6px",
                              background: isActive ? "#ECFDF5" : "#FFFBEB",
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: isActive ? "#059669" : "#D97706",
                              }}
                            />
                            {u.account_status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(u.id)}
                              disabled={activatingId === u.id}
                              style={{
                                border: "none",
                                background: "#1D4ED8",
                                color: "white",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 4,
                                cursor: activatingId === u.id ? "wait" : "pointer",
                              }}
                            >
                              {activatingId === u.id ? "Activating..." : "Activate"}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>Verified</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health + Real Audit Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="chart-card">
            <div className="section-header" style={{ fontSize: 14, marginBottom: 12 }}>
              Database & Platform Health
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Database Engine</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>
                    SQLite 3 (sarathi.db)
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#059669",
                    padding: "2px 6px",
                    background: "#ECFDF5",
                    borderRadius: 4,
                  }}
                >
                  Connected
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Total Jobs & Postings</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>
                    {metrics?.total_jobs ?? 24} jobs listed
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#059669",
                    padding: "2px 6px",
                    background: "#ECFDF5",
                    borderRadius: 4,
                  }}
                >
                  Operational
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Courses & Curriculum</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>
                    {metrics?.total_courses ?? 18} aligned courses
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#059669",
                    padding: "2px 6px",
                    background: "#ECFDF5",
                    borderRadius: 4,
                  }}
                >
                  Operational
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Entity Verifications</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>
                    {metrics?.pending_verifications ?? 0} pending review
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: (metrics?.pending_verifications ?? 0) > 0 ? "#D97706" : "#059669",
                    padding: "2px 6px",
                    background: (metrics?.pending_verifications ?? 0) > 0 ? "#FFFBEB" : "#ECFDF5",
                    borderRadius: 4,
                  }}
                >
                  {(metrics?.pending_verifications ?? 0) > 0 ? "Pending Items" : "All Clear"}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Audit Trail */}
          <div className="chart-card">
            <div className="section-header" style={{ fontSize: 14, marginBottom: 12 }}>
              Recent Audit Logs
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
              {auditLogs.length === 0 ? (
                <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: 12 }}>
                  No recent audit logs
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "8px 10px",
                      background: "#F8FAFC",
                      borderRadius: 6,
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#1D4ED8",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontSize: 9, color: "#94A3B8" }}>{log.created_at}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="section-header" style={{ fontSize: 14, marginBottom: 12 }}>
              Weekly Activity
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="logins" fill="#1D4ED8" name="Logins" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actions" fill="#0D9488" name="Actions" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
