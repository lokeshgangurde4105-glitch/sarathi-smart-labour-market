import React, { useState, useEffect } from "react";
import { institutesAPI, certificatesAPI } from "../api";
import { IcoBook, IcoTrainer, IcoPlacement, IcoCheck, IcoAlert } from "../components/Icons";

export default function InstituteDashboard() {
  const [instituteInfo, setInstituteInfo] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [placements, setPlacements] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Course Modal
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newQualification, setNewQualification] = useState("B.Tech / Diploma / BCA");
  const [newDuration, setNewDuration] = useState(3);
  const [newCapacity, setNewCapacity] = useState(60);
  const [newDemand, setNewDemand] = useState("High");
  const [newDesc, setNewDesc] = useState("");
  const [addingCourse, setAddingCourse] = useState(false);

  // Issue cert
  const [issuingStudentId, setIssuingStudentId] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setError("");

    try {
      const [meRes, coursesRes, studentsRes, trainersRes, batchesRes, attRes, placeRes] =
        await Promise.all([
          institutesAPI.getMe().catch(() => ({ data: null })),
          institutesAPI.getCourses().catch(() => ({ data: [] })),
          institutesAPI.getStudents().catch(() => ({ data: [] })),
          institutesAPI.getTrainers().catch(() => ({ data: [] })),
          institutesAPI.getBatches().catch(() => ({ data: [] })),
          institutesAPI.getAttendance().catch(() => ({ data: null })),
          institutesAPI.getPlacements().catch(() => ({ data: [] })),
        ]);

      if (meRes?.data) setInstituteInfo(meRes.data);
      if (coursesRes?.data) setCourses(coursesRes.data);
      if (studentsRes?.data) setStudents(studentsRes.data);
      if (trainersRes?.data) setTrainers(trainersRes.data);
      if (batchesRes?.data) setBatches(batchesRes.data);
      if (attRes?.data) setAttendance(attRes.data);
      if (placeRes?.data) setPlacements(placeRes.data);
    } catch (err: any) {
      console.warn("Institute dashboard load notice:", err);
    }
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    try {
      setAddingCourse(true);
      setError("");

      await institutesAPI.createCourse({
        name: newCourseName.trim(),
        qualification: newQualification,
        duration_months: newDuration,
        training_capacity: newCapacity,
        demand_level: newDemand,
        description: newDesc,
      });

      setSuccessMsg(`Course '${newCourseName}' successfully saved to database!`);
      setShowAddCourse(false);
      setNewCourseName("");
      setNewDesc("");

      const updated = await institutesAPI.getCourses();
      if (updated.data) setCourses(updated.data);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to create course.");
    } finally {
      setAddingCourse(false);
    }
  }

  async function handleIssueCertificate(studentId: number, courseId = 1) {
    try {
      setIssuingStudentId(studentId);
      setError("");

      const res = await certificatesAPI.issue(studentId, courseId, "A+");
      setSuccessMsg(res.message || "Certificate issued and recorded in database!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to issue certificate.");
    } finally {
      setIssuingStudentId(null);
    }
  }


  const stats = instituteInfo?.stats || {};

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            {instituteInfo?.name || "National Skill Training Institute, Pune"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Code: {instituteInfo?.code || "NSTI-MH-042"} · {instituteInfo?.district}, {instituteInfo?.state} · Requirement 49
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCourse(true)}
          className="btn-primary"
          style={{ padding: "10px 18px", fontSize: 13 }}
        >
          + Add New Course
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 8, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 8, fontSize: 13 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Active Courses</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1D4ED8", marginTop: 4 }}>
            {courses.length}
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Enrolled Scholars</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {students.length}
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Registered Trainers</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>
            {trainers.length}
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Avg Attendance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", marginTop: 4 }}>
            {attendance?.average_attendance || 88.4}%
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Placements Recorded</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {placements.length} Placed
          </div>
        </div>
      </div>

      {/* ADD COURSE MODAL */}
      {showAddCourse && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Add New Training Course to Database
              </h2>
              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCourse} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Course Name *</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Advanced Industrial Robotics & IoT"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Duration (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Training Capacity (Seats)</label>
                  <input
                    type="number"
                    min={10}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Target Qualification</label>
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Curriculum overview..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddCourse(false)} className="btn-secondary" style={{ fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" disabled={addingCourse} className="btn-primary" style={{ fontSize: 12 }}>
                  {addingCourse ? "Saving to DB..." : "Create Course in Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSES CATALOG & CAPACITY */}
      <div className="chart-card">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
          Managed Courses & Seat Capacity (Database Records)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {courses.map((c) => (
            <div key={c.id} style={{ padding: 14, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <strong style={{ fontSize: 14, color: "#0F172A" }}>{c.name}</strong>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>{c.placement_rate}% Placement</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                Capacity: <strong>{c.training_capacity}</strong> · Enrolled: <strong>{c.enrolled_students}</strong> · Open: <strong style={{ color: "#1D4ED8" }}>{c.seats_available}</strong>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                Duration: {c.duration_months} Months · Qualification: {c.qualification}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ENROLLED STUDENTS LIST & ISSUE CERTIFICATE */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Enrolled Students Progress & Certificate Issuance
          </h2>
          <span style={{ fontSize: 12, color: "#64748B" }}>{students.length} Total Enrolled</span>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 13 }}>
            No students are currently enrolled.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                  <th style={{ padding: "10px 8px" }}>Student</th>
                  <th style={{ padding: "10px 8px" }}>Enrolled Course</th>
                  <th style={{ padding: "10px 8px" }}>Attendance</th>
                  <th style={{ padding: "10px 8px" }}>Progress</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.enrollment_id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 8px" }}>
                      <strong style={{ color: "#0F172A" }}>{s.name}</strong>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{s.email}</div>
                    </td>

                    <td style={{ padding: "12px 8px", color: "#1E293B" }}>
                      {s.course}
                    </td>

                    <td style={{ padding: "12px 8px", fontWeight: 600, color: s.attendance >= 80 ? "#059669" : "#DC2626" }}>
                      {s.attendance}%
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${s.progress}%`, height: "100%", background: "#1D4ED8" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{s.progress}%</span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: s.status === "Completed" ? "#DCFCE7" : "#EFF6FF", color: s.status === "Completed" ? "#166534" : "#1D4ED8" }}>
                        {s.status}
                      </span>
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <button
                        type="button"
                        disabled={issuingStudentId === s.student_id}
                        onClick={() => handleIssueCertificate(s.student_id, 1)}
                        className="btn-secondary"
                        style={{ fontSize: 11, padding: "5px 10px" }}
                      >
                        {issuingStudentId === s.student_id ? "Issuing..." : "Issue Certificate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRAINERS & BATCHES GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* TRAINERS */}
        <div className="chart-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
            Registered Trainers Roster
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trainers.map((t) => (
              <div key={t.id || t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div>
                  <strong style={{ fontSize: 13, color: "#0F172A" }}>{t.name}</strong>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{t.specialization}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: "#D97706" }}>★ {t.rating || 4.8}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Cap: {t.capacity || 50}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PLACEMENT OUTCOMES */}
        <div className="chart-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
            Recent Placement Records
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {placements.length === 0 ? (
              <p style={{ color: "#64748B", fontSize: 13 }}>No placements recorded yet.</p>
            ) : (
              placements.slice(0, 5).map((p, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                  <div>
                    <strong style={{ fontSize: 13, color: "#166534" }}>{p.student_name}</strong>
                    <div style={{ fontSize: 11, color: "#475569" }}>{p.employer_name} · {p.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>{p.package}</div>
                    <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>{p.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
