import React, { useState, useEffect, useRef } from "react";

import {
  IcoSearch,
  IcoBell,
  IcoUser,
  IcoMenu,
  IcoChevronDown,
} from "./Icons";
import { useI18n } from "../i18n";
import { notificationsAPI, type NotificationItem } from "../api";

/* =========================================================
   PROPS
========================================================= */

interface HeaderProps {
  role: string;

  onRoleChange?: (
    role: string
  ) => void;

  onMenuToggle: () => void;

  /* Global filters */

  search: string;

  onSearchChange: (
    value: string
  ) => void;

  state: string;

  onStateChange: (
    value: string
  ) => void;

  sector: string;

  onSectorChange: (
    value: string
  ) => void;
}

/* =========================================================
   OPTIONS
========================================================= */

const roles = [
  "Government / Planner",
  "Training Institute",
  "Employer / Industry",
  "Trainer",
  "Student / Candidate",
  "Admin",
];

const states = [
  "All States",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Gujarat",
  "Rajasthan",
  "Madhya Pradesh",
  "Telangana",
  "Delhi",
  "West Bengal",
  "Kerala",
  "Andhra Pradesh",
];

const sectors = [
  "All Sectors",
  "IT & Software",
  "Healthcare",
  "Manufacturing",
  "BFSI",
  "Retail",
  "Construction",
  "Automobile",
  "Education",
  "Telecommunications",
  "Logistics",
  "Agriculture",
  "Renewable Energy",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Header({
  role,
  onRoleChange,
  onMenuToggle,

  search,
  onSearchChange,

  state,
  onStateChange,

  sector,
  onSectorChange,

}: HeaderProps) {

  const [showRoleMenu, setShowRoleMenu] =
    useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { language, setLanguage, t } = useI18n();

  const currentUser = React.useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const userName = currentUser?.name || currentUser?.full_name || role.split(" / ")[0];
  const userInitials = React.useMemo(() => {
    if (!userName) return "U";
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  }, [userName]);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async (force = false) => {
      // Don't poll when the browser tab is hidden or minimized
      if (document.visibilityState !== "visible" && !force) {
        return;
      }
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const res = await notificationsAPI.getUnreadCount(force);
        if (mounted && res && res.data) {
          setUnreadCount((prev) => {
            const next = res.data.unread_count || 0;
            return prev === next ? prev : next;
          });
        }
      } catch {
        // non-blocking fallback
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Load unread count once on mount
    fetchCount(false);

    // Controlled background polling: 90 seconds (1.5 minutes)
    const interval = setInterval(() => {
      fetchCount(false);
    }, 90000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCount(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      setLoadingNotifications(true);
      try {
        const res = await notificationsAPI.getNotifications();
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          const unread = res.data.filter((n) => !n.read).length;
          setUnreadCount((prev) => (prev === unread ? prev : unread));
          notificationsAPI.setCachedUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      notificationsAPI.setCachedUnreadCount(0);
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => {
        const next = Math.max(0, c - 1);
        notificationsAPI.setCachedUnreadCount(next);
        return next;
      });
      await notificationsAPI.markAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    onSearchChange(
      event.target.value
    );
  };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch = () => {
    onSearchChange("");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div
      style={{
        height: 56,
        background: "white",
        borderBottom:
          "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
    >

      {/* =================================================
          MENU
      ================================================= */}

      <button
        className="btn-secondary"
        type="button"
        style={{
          padding: "6px 8px",
          border: "none",
          background: "none",
        }}
        onClick={onMenuToggle}
      >
        <IcoMenu
          size={18}
          className="text-slate-500"
        />
      </button>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div
        style={{
          flex: "1 1 320px",
          maxWidth: 460,
          minWidth: 180,
          position: "relative",
        }}
      >

        {/* SEARCH ICON */}

        <IcoSearch
          size={14}
          className="text-slate-400"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform:
              "translateY(-50%)",
            pointerEvents: "none",
          } as React.CSSProperties}
        />


        {/* SEARCH INPUT */}

        <input
          type="search"
          value={search}

          onChange={
            handleSearchChange
          }

          placeholder={
            "Search jobs, skills, courses, districts..."
          }

          autoComplete="off"

          style={{
            width: "100%",
            boxSizing: "border-box",

            padding:
              search.trim().length > 0
                ? "7px 34px 7px 32px"
                : "7px 12px 7px 32px",

            border:
              "1px solid #E2E8F0",

            borderRadius: 8,

            fontSize: 13,

            color: "#334155",

            background: "#F8FAFC",

            outline: "none",

            transition:
              "all 0.15s ease",
          }}

          onFocus={(event) => {

            event.currentTarget.style.borderColor =
              "#1D4ED8";

            event.currentTarget.style.background =
              "white";

          }}

          onBlur={(event) => {

            event.currentTarget.style.borderColor =
              "#E2E8F0";

            event.currentTarget.style.background =
              "#F8FAFC";

          }}

          onKeyDown={(event) => {

            if (
              event.key === "Escape"
            ) {
              clearSearch();
            }

          }}
        />


        {/* CLEAR SEARCH BUTTON */}

        {search.trim().length > 0 && (

          <button
            type="button"

            onClick={clearSearch}

            aria-label="Clear search"

            style={{
              position: "absolute",
              right: 7,
              top: "50%",
              transform:
                "translateY(-50%)",

              width: 22,
              height: 22,

              border: "none",
              background: "transparent",

              color: "#94A3B8",

              cursor: "pointer",

              fontSize: 16,

              lineHeight: 1,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: 5,
            }}

            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                "#F1F5F9";

              event.currentTarget.style.color =
                "#334155";
            }}

            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                "transparent";

              event.currentTarget.style.color =
                "#94A3B8";
            }}
          >
            ×
          </button>

        )}

      </div>


      {/* =================================================
          STATE FILTER
      ================================================= */}

      <select
        value={state}

        onChange={(event) =>
          onStateChange(
            event.target.value
          )
        }

        className="select-input"

        style={{
          fontSize: 12,
          minWidth: 130,
          cursor: "pointer",
        }}
      >

        {states.map((item) => (

          <option
            key={item}
            value={item}
          >
            {item}
          </option>

        ))}

      </select>


      {/* =================================================
          SECTOR FILTER
      ================================================= */}

      <select
        value={sector}

        onChange={(event) =>
          onSectorChange(
            event.target.value
          )
        }

        className="select-input"

        style={{
          fontSize: 12,
          minWidth: 135,
          cursor: "pointer",
        }}
      >

        {sectors.map((item) => (

          <option
            key={item}
            value={item}
          >
            {item}
          </option>

        ))}

      </select>


      {/* =================================================
          SPACER
      ================================================= */}

      <div
        style={{
          flex: 1,
        }}
      />


      {/* =================================================
          DATE
      ================================================= */}

      <span
        style={{
          fontSize: 12,
          color: "#64748B",
          fontFamily:
            "'JetBrains Mono', monospace",
          whiteSpace: "nowrap",
        }}
      >
        Sep 2026
      </span>


      {/* =================================================
          LANGUAGE SELECTOR (English / हिंदी / मराठी)
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#F1F5F9",
          borderRadius: 8,
          padding: "2px 4px",
          gap: 2,
        }}
      >
        {(["en", "hi", "mr"] as const).map((langKey) => (
          <button
            key={langKey}
            type="button"
            onClick={() => setLanguage(langKey)}
            style={{
              border: "none",
              background: language === langKey ? "#FFFFFF" : "transparent",
              color: language === langKey ? "#1D4ED8" : "#64748B",
              fontWeight: language === langKey ? 700 : 500,
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 6,
              cursor: "pointer",
              boxShadow: language === langKey ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {langKey === "en" ? "EN" : langKey === "hi" ? "हिन्दी" : "मराठी"}
          </button>
        ))}
      </div>


      {/* =================================================
          NOTIFICATIONS
      ================================================= */}

      <div
        style={{
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={handleToggleNotifications}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            borderRadius: 8,
          }}
          title="Notifications"
        >
          <IcoBell
            size={18}
            className={showNotifications ? "text-blue-600" : "text-slate-500"}
          />

          {unreadCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                background: "#DC2626",
                borderRadius: 10,
                border: "1.5px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: "white",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {unreadCount}
            </div>
          )}
        </button>

        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              width: 340,
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1D4ED8",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {loadingNotifications ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
                  Loading alerts...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkOneRead(n.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #F1F5F9",
                      background: n.read ? "#FFFFFF" : "#F8FAFC",
                      cursor: n.read ? "default" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: n.read ? 600 : 700,
                          color: "#0F172A",
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background:
                            n.priority === "High"
                              ? "#FEF2F2"
                              : n.priority === "Medium"
                              ? "#FFFBEB"
                              : "#EFF6FF",
                          color:
                            n.priority === "High"
                              ? "#DC2626"
                              : n.priority === "Medium"
                              ? "#D97706"
                              : "#1D4ED8",
                        }}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>


      {/* =================================================
          AUTHENTICATED USER & ROLE (Locked to Session)
      ================================================= */}

      <div
        style={{
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={() => setShowRoleMenu((previous) => !previous)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            background: "#F8FAFC",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "#334155",
            transition: "all 0.15s ease",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, #1D4ED8, #0D9488)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "white",
              letterSpacing: "0.5px",
            }}
          >
            {userInitials}
          </div>

          <div style={{ textAlign: "left", lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600, display: "block", fontSize: 12, color: "#0F172A" }}>
              {userName}
            </span>
            <span style={{ fontSize: 10, color: "#16A34A", fontWeight: 500 }}>
              ● {role.split(" / ")[0]}
            </span>
          </div>

          <IcoChevronDown size={11} className="text-slate-400" />
        </button>

        {/* User Account Popover (Role is strictly locked to authenticated user) */}
        {showRoleMenu && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              background: "white",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              width: 240,
              zIndex: 100,
              overflow: "hidden",
              padding: 12,
            }}
          >
            <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                Active Profile
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {userName}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
                {currentUser?.email || "Authenticated Account"}
              </div>
              <div style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 600, marginTop: 4 }}>
                Role: {role}
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#059669", background: "#ECFDF5", padding: "6px 8px", borderRadius: 6, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓ Official SARATHI Account</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowRoleMenu(false);
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                localStorage.removeItem("role");
                window.location.reload();
              }}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #FCA5A5",
                borderRadius: 6,
                background: "#FEF2F2",
                color: "#DC2626",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

    </div>
  );
}