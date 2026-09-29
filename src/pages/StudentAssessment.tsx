import React, { useState, useEffect } from "react";
import { assessmentsAPI, coursesAPI, Question, AssessmentResult } from "../api";
import { IcoCheck, IcoAlert, IcoZap, IcoTarget } from "../components/Icons";

interface StudentAssessmentProps {
  onNavigate?: (page: string) => void;
}

export default function StudentAssessment({ onNavigate }: StudentAssessmentProps = {}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
    loadHistory();
  }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");
      const res = await assessmentsAPI.getQuestions(8);
      if (res.data && res.data.length > 0) {
        setQuestions(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load assessment questions from database.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await assessmentsAPI.getHistory();
      if (res.data) {
        setHistory(res.data);
      }
    } catch {
      // ignore
    }
  }

  function handleSelectOption(opt: string) {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: opt,
    }));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError("");

      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] || "A",
      }));

      const res = await assessmentsAPI.submit(payload);
      if (res.data) {
        setResult(res.data);
        loadHistory();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit assessment to database.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnrollInRecommended(courseName: string) {
    try {
      setEnrollingCourse(courseName);
      setEnrollSuccess(null);
      // Fetch all courses to match ID
      const res = await coursesAPI.getAll();
      const course = res.data.find(
        (c) => c.name.toLowerCase().includes(courseName.toLowerCase()) || courseName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (course) {
        await coursesAPI.enroll(course.id);
        setEnrollSuccess(`Successfully enrolled in ${course.name}! Data saved to database.`);
      } else if (res.data.length > 0) {
        await coursesAPI.enroll(res.data[0].id);
        setEnrollSuccess(`Successfully enrolled in ${res.data[0].name}! Data saved to database.`);
      }
    } catch (err: any) {
      setError(err?.message || "Enrollment failed.");
    } finally {
      setEnrollingCourse(null);
    }
  }

  function handleRetake() {
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    loadQuestions();
  }

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0 }}>
            Standardized Skill Assessment
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
            Backend Database Question Pool · Real-time Evaluation · Dynamic Gap Calculation (Requirement 42 & 43)
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("student")}
              className="btn-secondary"
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Back to Student Portal
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary"
            style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            {showHistory ? "Back to Quiz" : `Past Attempts (${history.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {enrollSuccess && (
        <div style={{ padding: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          ✓ {enrollSuccess}
        </div>
      )}

      {/* HISTORY VIEW */}
      {showHistory ? (
        <div className="chart-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
            Past Assessment Attempts Stored in Database
          </h2>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: "#94A3B8" }}>No past assessment attempts found for this account.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((h, i) => (
                <div key={h.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "#1E293B" }}>Attempt #{h.id}</strong>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{h.completed_at}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: h.percentage >= 60 ? "#059669" : "#DC2626" }}>
                        {h.percentage}%
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>Score: {h.total_score}/{h.max_score}</div>
                    </div>
                    <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: h.passed ? "#DCFCE7" : "#FEE2E2", color: h.passed ? "#166534" : "#991B1B" }}>
                      {h.passed ? "PASSED" : "NEEDS UP-SKILLING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : result ? (
        /* RESULTS VIEW */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* RESULT SUMMARY CARD */}
          <div className="chart-card" style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: "#93C5FD", fontWeight: 700 }}>
                  Assessment Outcome · Attempt #{result.attempt_id}
                </span>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: "6px 0", color: "#FFFFFF" }}>
                  {result.percentage}% Overall Score
                </h2>
                <p style={{ fontSize: 13, color: "#CBD5E1", margin: 0 }}>
                  Answered {result.correct_answers} of {result.total_questions} questions correctly · Submitted on {result.submitted_at}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  background: result.passed ? "#059669" : "#DC2626",
                  color: "#FFFFFF",
                  display: "inline-block",
                }}>
                  {result.passed ? "✓ READY FOR PLACEMENT" : "UP-SKILLING RECOMMENDED"}
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate("student")}
                    style={{
                      marginTop: 10,
                      padding: "6px 14px",
                      background: "#2563EB",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    View in Student Portal →
                  </button>
                )}
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
                  Source: SQLite Database
                </div>
              </div>
            </div>
          </div>

          {/* SKILL SCORES & GAPS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* PER-SKILL SCORES */}
            <div className="chart-card">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Assessed Skill Competencies
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(result.skill_scores).map(([sk, score]) => (
                  <div key={sk}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      <span>{sk}</span>
                      <span style={{ color: score >= 75 ? "#059669" : "#DC2626" }}>{score}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: score >= 75 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IDENTIFIED SKILL GAPS */}
            <div className="chart-card">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Identified Skill Gaps & Recommended Courses
              </h3>
              {result.skill_gaps.length === 0 ? (
                <div style={{ color: "#059669", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                  ✓ Outstanding! No critical skill gaps were detected. You meet current industry hiring thresholds!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.skill_gaps.map((g) => (
                    <div key={g.skill_name} style={{ padding: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 13, color: "#92400E" }}>{g.skill_name} (Gap: -{g.gap_score}%)</strong>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: g.priority === "Critical" ? "#FEE2E2" : "#FEF3C7", color: g.priority === "Critical" ? "#991B1B" : "#B45309" }}>
                          {g.priority} Priority
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#78350F", marginTop: 4 }}>
                        Recommended: <strong>{g.recommended_course}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnrollInRecommended(g.recommended_course)}
                        disabled={enrollingCourse === g.recommended_course}
                        style={{
                          marginTop: 8,
                          padding: "5px 10px",
                          border: "none",
                          borderRadius: 6,
                          background: "#D97706",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {enrollingCourse === g.recommended_course ? "Enrolling..." : "Enroll in this Course"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DETAILED QUESTION REVIEW */}
          <div className="chart-card">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
              Detailed Question Review & Explanations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {result.answers_review.map((item, idx) => (
                <div key={idx} style={{ padding: 14, background: item.is_correct ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${item.is_correct ? "#BBF7D0" : "#FECACA"}`, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B", marginBottom: 4 }}>
                    <span>Question {idx + 1} · {item.skill_name}</span>
                    <strong style={{ color: item.is_correct ? "#166534" : "#991B1B" }}>
                      {item.is_correct ? "✓ Correct (+10 pts)" : "✗ Incorrect (0 pts)"}
                    </strong>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>
                    {item.question}
                  </div>
                  <div style={{ fontSize: 12, color: "#334155" }}>
                    Your choice: <strong>Option {item.selected_option}</strong> {!item.is_correct && <span>| Correct: <strong>Option {item.correct_option}</strong></span>}
                  </div>
                  {item.explanation && (
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 6, background: "rgba(255,255,255,0.7)", padding: "6px 8px", borderRadius: 6 }}>
                      💡 <strong>Explanation:</strong> {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 10 }}>
            <button
              type="button"
              onClick={handleRetake}
              className="btn-primary"
              style={{ padding: "10px 24px", fontSize: 14 }}
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="chart-card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>
            Fetching randomized questions from SQLite database...
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="chart-card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#64748B" }}>No assessment questions available in database.</p>
          <button type="button" onClick={loadQuestions} className="btn-secondary" style={{ marginTop: 10 }}>
            Reload Questions
          </button>
        </div>
      ) : (
        /* ACTIVE QUIZ STEPPER */
        <div className="chart-card">
          {/* STEPPER PROGRESS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>
              Question {currentIndex + 1} of {totalQ} · {currentQ.skill_name}
            </span>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {answeredCount} of {totalQ} answered
            </span>
          </div>

          {/* PROGRESS BAR */}
          <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ width: `${((currentIndex + 1) / totalQ) * 100}%`, height: "100%", background: "#1D4ED8", transition: "width 0.2s ease" }} />
          </div>

          {/* QUESTION TEXT */}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", lineHeight: 1.4, marginBottom: 20 }}>
            {currentQ.question}
          </h2>

          {/* OPTIONS A, B, C, D */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {(["A", "B", "C", "D"] as const).map((key) => {
              const optText = currentQ.options[key];
              if (!optText) return null;
              const isSelected = selectedAnswers[currentQ.id] === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectOption(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: isSelected ? "2px solid #1D4ED8" : "1px solid #CBD5E1",
                    background: isSelected ? "#EFF6FF" : "#FFFFFF",
                    color: isSelected ? "#1D4ED8" : "#1E293B",
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isSelected ? "#1D4ED8" : "#F1F5F9",
                      color: isSelected ? "white" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {key}
                  </span>
                  <span>{optText}</span>
                </button>
              );
            })}
          </div>

          {/* CONTROLS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="btn-secondary"
              style={{ fontSize: 13, padding: "8px 16px", opacity: currentIndex === 0 ? 0.5 : 1 }}
            >
              ← Previous
            </button>

            {currentIndex < totalQ - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="btn-primary"
                style={{ fontSize: 13, padding: "8px 20px" }}
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                style={{
                  padding: "9px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: submitting ? "#93C5FD" : "#059669",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Evaluating in Backend..." : "Submit Assessment ✓"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
