import React, { useState, useEffect } from "react";
import { aiAPI, DailyPlan, CopilotResponse } from "../api";
import { useI18n } from "../i18n";

export default function SarathiCopilot() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showWhy, setShowWhy] = useState(true);

  // Chat state
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string; why?: any; actions?: string[] }>>([
    {
      sender: "copilot",
      text: "Namaste! I am SARATHI AI, your personal Career & Learning Copilot. How can I guide your skill development today?",
    },
  ]);
  const [loadingQuery, setLoadingQuery] = useState(false);

  useEffect(() => {
    if (isOpen && !dailyPlan) {
      fetchDailyPlan();
    }
  }, [isOpen]);

  async function fetchDailyPlan() {
    try {
      setLoadingPlan(true);
      const res = await aiAPI.getDailyPlan();
      if (res.data) {
        setDailyPlan(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleSendQuery(queryToSend?: string) {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loadingQuery) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setInputQuery("");
    setLoadingQuery(true);

    try {
      const res = await aiAPI.queryCopilot(q);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: res.answer,
          why: res.why_rationale,
          actions: res.suggested_actions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "I experienced a brief connectivity hiccup with the intelligence engine. Please try again or check the recommended tasks above.",
        },
      ]);
    } finally {
      setLoadingQuery(false);
    }
  }

  return (
    <>
      {/* FLOATING COPILOT LAUNCHER BUTTON */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 30,
            background: "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
            color: "#FFFFFF",
            border: "none",
            boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 8px 10px -6px rgba(147, 51, 234, 0.4)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          <span>SARATHI AI</span>
          <span
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.5px",
            }}
          >
            COPILOT
          </span>
        </button>
      </div>

      {/* EXPANDABLE COPILOT DRAWER PANEL */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            width: 440,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "80vh",
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.05)",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                ✨
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.2px" }}>
                  SARATHI AI
                </div>
                <div style={{ fontSize: 11, color: "#E9D5FF", fontWeight: 500 }}>
                  Your Personal Career & Learning Copilot
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                fontSize: 20,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div
            style={{
              padding: 16,
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: "#F8FAFC",
            }}
          >
            {/* DAILY LEARNING PLAN BANNER */}
            {dailyPlan && (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #DBEAFE",
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: "0 2px 4px rgba(29, 78, 216, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    🎯 Today's Recommended Focus
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                    ⏱️ {dailyPlan.estimated_duration_minutes} Mins
                  </span>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                  {dailyPlan.todays_topic}
                </div>

                <ul style={{ margin: "6px 0 10px 0", paddingLeft: 18, fontSize: 12, color: "#334155" }}>
                  {dailyPlan.actionable_tasks.map((task, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{task}</li>
                  ))}
                </ul>

                {/* EXPLAINABLE "WHY?" ACCORDION */}
                <div style={{ marginTop: 8, borderTop: "1px solid #F1F5F9", paddingTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowWhy((p) => !p)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0284C7",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{showWhy ? "▼" : "▶"}</span>
                    <span>{dailyPlan.why_explanation.title}</span>
                  </button>

                  {showWhy && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        background: "#F0F9FF",
                        border: "1px solid #BAE6FD",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "#0369A1",
                        lineHeight: 1.4,
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>
                        <strong>📊 Market Evidence:</strong> {dailyPlan.why_explanation.labour_market_demand}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <strong>🎯 Skill Gap:</strong> {dailyPlan.why_explanation.personal_gap_analysis}
                      </div>
                      <div>
                        <strong>💼 Career Impact:</strong> {dailyPlan.why_explanation.career_impact}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QUICK ACTION PILLS */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSendQuery("What should I learn today?")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 14,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                ⚡ What to learn today?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery("Why is this skill recommended for me?")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 14,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                ❓ Why this skill?
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery("Which career role suits my profile best?")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 14,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                💼 Career Role Fit
              </button>
            </div>

            {/* CONVERSATION MESSAGES */}
            {messages.map((m, index) => (
              <div
                key={index}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: m.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.sender === "user" ? "#1D4ED8" : "#FFFFFF",
                    color: m.sender === "user" ? "#FFFFFF" : "#1E293B",
                    fontSize: 13,
                    lineHeight: 1.45,
                    border: m.sender === "user" ? "none" : "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {m.text}

                  {/* WHY RATIONALE CARD */}
                  {m.why && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 6,
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        fontSize: 11,
                        color: "#1E40AF",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        🔍 {m.why.title || "Explainable WHY? Rationale"}
                      </div>
                      {m.why.labour_market_demand && (
                        <div>• <strong>Market:</strong> {m.why.labour_market_demand}</div>
                      )}
                      {m.why.personal_gap_analysis && (
                        <div>• <strong>Gap:</strong> {m.why.personal_gap_analysis}</div>
                      )}
                      {m.why.career_impact && (
                        <div>• <strong>Impact:</strong> {m.why.career_impact}</div>
                      )}
                    </div>
                  )}

                  {/* ACTIONABLE RECOMMENDATIONS */}
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
                      <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>Next Steps:</div>
                      {m.actions.map((act, idx) => (
                        <div key={idx}>→ {act}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loadingQuery && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 14px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Analyzing live labour market matrix...</span>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            style={{
              padding: 12,
              background: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask SARATHI Copilot anything..."
              disabled={loadingQuery}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loadingQuery || !inputQuery.trim()}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                background: loadingQuery || !inputQuery.trim() ? "#CBD5E1" : "#1D4ED8",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: loadingQuery || !inputQuery.trim() ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
