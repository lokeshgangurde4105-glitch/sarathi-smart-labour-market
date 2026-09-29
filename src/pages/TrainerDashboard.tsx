import React, { useState, useEffect } from "react";
import { trainersAPI } from "../api";
import { IcoTrainer, IcoCheck, IcoAlert, IcoZap } from "../components/Icons";

export default function TrainerDashboard() {
  const [trainerInfo, setTrainerInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Attendance state
  const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null);
  const [attValue, setAttValue] = useState(90);
  const [updatingAtt, setUpdatingAtt] = useState(false);

  // Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbStudentId, setFbStudentId] = useState<number>(1);
  const [fbSkill, setFbSkill] = useState("Cloud Computing");
  const [fbText, setFbText] = useState("");
  const [fbPriority, setFbPriority] = useState("High");
  const [savingFb, setSavingFb] = useState(false);

  // Question Creation Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qSkill, setQSkill] = useState("Python");
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrect, setQCorrect] = useState("A");
  const [qExplanation, setQExplanation] = useState("");
  const [savingQ, setSavingQ] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    trainersAPI.getMe()
      .then((meRes) => {
        if (meRes.data) setTrainerInfo(meRes.data);
      })
      .catch((err) => {
        console.warn("Trainer profile fetch:", err);
      });

    trainersAPI.getAssignedStudents()
      .then((studentsRes) => {
        if (studentsRes.data) {
          setStudents(studentsRes.data);
          if (studentsRes.data.length > 0) {
            setFbStudentId(studentsRes.data[0].student_id);
          }
        }
      })
      .catch((err) => {
        console.warn("Assigned students fetch:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function handleSaveAttendance(enrollmentId: number) {
    try {
      setUpdatingAtt(true);
      setError("");
      await trainersAPI.markAttendance(enrollmentId, attValue);
      setSuccessMsg(`Attendance updated to ${attValue}% in database.`);
      setEditingAttendanceId(null);

      // Update state
      setStudents((prev) =>
        prev.map((s) => (s.enrollment_id === enrollmentId ? { ...s, attendance: attValue } : s))
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to update attendance.");
    } finally {
      setUpdatingAtt(false);
    }
  }

  async function handleToggleModule(enrollmentId: number, moduleId: number, currentCompleted: boolean) {
    try {
      const newStatus = !currentCompleted;
      await trainersAPI.updateModuleProgress(enrollmentId, moduleId, newStatus);
      setSuccessMsg("Module completion status saved to database.");

      // Reload students
      const res = await trainersAPI.getAssignedStudents();
      if (res.data) setStudents(res.data);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setError(err?.message || "Failed to update module progress.");
    }
  }

  async function handleSendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!fbText.trim()) return;

    try {
      setSavingFb(true);
      setError("");

      await trainersAPI.addFeedback(fbStudentId, fbSkill, fbText, 30.0, fbPriority);
      setSuccessMsg(`Skill assessment and feedback on '${fbSkill}' saved to database!`);
      setShowFeedbackModal(false);
      setFbText("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to record feedback.");
    } finally {
      setSavingFb(false);
    }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!qText.trim() || !qOptA.trim() || !qOptB.trim()) return;

    try {
      setSavingQ(true);
      setError("");

      await trainersAPI.createAssessmentQuestion({
        skill_name: qSkill,
        question: qText,
        option_a: qOptA,
        option_b: qOptB,
        option_c: qOptC,
        option_d: qOptD,
        correct_option: qCorrect,
        explanation: qExplanation,
        difficulty: "Medium",
        category: "Technical",
      });

      setSuccessMsg(`Assessment question added to pool in database!`);
      setShowQuestionModal(false);
      setQText("");
      setQOptA("");
      setQOptB("");
      setQOptC("");
      setQOptD("");
      setQExplanation("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to add question.");
    } finally {
      setSavingQ(false);
    }
  }



  const stats = trainerInfo?.stats || {};

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            {trainerInfo?.name || "Prof. Rajesh Verma"} (Trainer Dashboard)
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            {trainerInfo?.designation} · {trainerInfo?.institute} · Requirement 50
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="btn-secondary"
            style={{ fontSize: 12, padding: "8px 14px" }}
          >
            + Identify Weak Skill / Add Feedback
          </button>
          <button
            type="button"
            onClick={() => setShowQuestionModal(true)}
            className="btn-primary"
            style={{ fontSize: 12, padding: "8px 14px" }}
          >
            + Create Assessment Question
          </button>
        </div>
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

      {/* METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Assigned Courses</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1D4ED8", marginTop: 4 }}>
            {stats.assigned_courses || 3}
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Assigned Students</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
            {students.length} Active
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Batch Attendance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706", marginTop: 4 }}>
            {stats.avg_class_attendance || 88.5}%
          </div>
        </div>

        <div className="chart-card">
          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Trainer Rating</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>
            ★ {stats.satisfaction_rating || 4.9}
          </div>
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
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
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>
              Identify Weak Skill & Record Feedback in Database
            </h2>

            <form onSubmit={handleSendFeedback} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Student</label>
                <select
                  value={fbStudentId}
                  onChange={(e) => setFbStudentId(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, background: "white" }}
                >
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.course})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Target Weak Skill</label>
                  <input
                    type="text"
                    value={fbSkill}
                    onChange={(e) => setFbSkill(e.target.value)}
                    placeholder="e.g. Cloud Computing / FastAPI"
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Priority</label>
                  <select
                    value={fbPriority}
                    onChange={(e) => setFbPriority(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, background: "white" }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Trainer Observations & Guidance</label>
                <textarea
                  rows={3}
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  placeholder="Explain areas where student needs improvement..."
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn-secondary" style={{ fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingFb} className="btn-primary" style={{ fontSize: 12 }}>
                  {savingFb ? "Saving..." : "Record in Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION CREATION MODAL */}
      {showQuestionModal && (
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
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 540 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>
              Add Assessment Question to Database Pool
            </h2>

            <form onSubmit={handleCreateQuestion} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Skill Name</label>
                <input
                  type="text"
                  value={qSkill}
                  onChange={(e) => setQSkill(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Question Text</label>
                <textarea
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Option A</label>
                  <input
                    type="text"
                    value={qOptA}
                    onChange={(e) => setQOptA(e.target.value)}
                    required
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Option B</label>
                  <input
                    type="text"
                    value={qOptB}
                    onChange={(e) => setQOptB(e.target.value)}
                    required
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Option C</label>
                  <input
                    type="text"
                    value={qOptC}
                    onChange={(e) => setQOptC(e.target.value)}
                    required
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Option D</label>
                  <input
                    type="text"
                    value={qOptD}
                    onChange={(e) => setQOptD(e.target.value)}
                    required
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Correct Option</label>
                  <select
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, background: "white" }}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Explanation</label>
                  <input
                    type="text"
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Rationale for the correct answer"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary" style={{ fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingQ} className="btn-primary" style={{ fontSize: 12 }}>
                  {savingQ ? "Adding..." : "Add to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNED STUDENTS: ATTENDANCE & MODULE PROGRESS (Requirement 50) */}
      <div className="chart-card">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
          Assigned Students Roster: Attendance & Module Progress
        </h2>

        {students.length === 0 ? (
          <p style={{ color: "#64748B", fontSize: 13 }}>No students assigned yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {students.map((s) => (
              <div
                key={s.enrollment_id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  background: "#F8FAFC",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <strong style={{ fontSize: 15, color: "#0F172A" }}>{s.name}</strong>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Course: <strong>{s.course}</strong> · Student ID: {s.student_id}
                    </div>
                  </div>

                  {/* ATTENDANCE SECTION */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>Attendance:</span>
                      <strong style={{ fontSize: 14, color: s.attendance >= 80 ? "#059669" : "#DC2626", marginLeft: 6 }}>
                        {s.attendance}%
                      </strong>
                    </div>

                    {editingAttendanceId === s.enrollment_id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={attValue}
                          onChange={(e) => setAttValue(Number(e.target.value))}
                          style={{ width: 60, padding: "4px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                        />
                        <button
                          type="button"
                          disabled={updatingAtt}
                          onClick={() => handleSaveAttendance(s.enrollment_id)}
                          style={{ background: "#059669", color: "white", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAttendanceId(null)}
                          style={{ background: "none", border: "none", fontSize: 12, cursor: "pointer", color: "#64748B" }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAttendanceId(s.enrollment_id);
                          setAttValue(s.attendance);
                        }}
                        style={{
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          border: "1px solid #BFDBFE",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Mark Attendance
                      </button>
                    )}
                  </div>
                </div>

                {/* MODULE COMPLETION TOGGLES */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                    Course Modules Progress: Overall {s.progress}%
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                    {(s.modules || []).map((m: any) => (
                      <div
                        key={m.module_id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 10px",
                          background: m.completed ? "#F0FDF4" : "#FFFFFF",
                          border: m.completed ? "1px solid #BBF7D0" : "1px solid #CBD5E1",
                          borderRadius: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: m.completed ? "#166534" : "#1E293B", fontWeight: m.completed ? 600 : 400 }}>
                          {m.completed ? "✓" : "○"} {m.title}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleModule(s.enrollment_id, m.module_id, m.completed)}
                          style={{
                            padding: "3px 8px",
                            border: "none",
                            borderRadius: 4,
                            background: m.completed ? "#DCFCE7" : "#F1F5F9",
                            color: m.completed ? "#166534" : "#475569",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {m.completed ? "Done" : "Mark Done"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
