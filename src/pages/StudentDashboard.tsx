import React, { useState, useEffect } from "react";
import {
  studentsAPI,
  coursesAPI,
  jobsAPI,
  certificatesAPI,
  skillsAPI,
  realDataAPI,
  StudentProfileData,
  CourseData,
  JobData,
  StudentUploadedCert,
} from "../api";
import { CourseProgressData, RoadmapResponse, RoadmapPhase, RoadmapCourse } from "../api/students";
import { IcoUser, IcoBook, IcoCheck, IcoAlert, IcoZap, IcoTarget } from "../components/Icons";
import StudentOnboarding from "../components/StudentOnboarding";

interface StudentDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobData[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [uploadedCerts, setUploadedCerts] = useState<StudentUploadedCert[]>([]);
  const [skillGaps, setSkillGaps] = useState<any[]>([]);

  // Roadmap State (Requirement 43 & Master Prompt)
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [enrollingRoadmapTitle, setEnrollingRoadmapTitle] = useState<string | null>(null);
  const [updatingProgressId, setUpdatingProgressId] = useState<number | null>(null);

  // Real datasets states (Requirement 4F)
  const [realJobRecs, setRealJobRecs] = useState<any[]>([]);
  const [realSkills, setRealSkills] = useState<any[]>([]);
  const [realCoursera, setRealCoursera] = useState<any[]>([]);
  const [realDataCamp, setRealDataCamp] = useState<any[]>([]);
  const [realDataLoading, setRealDataLoading] = useState(false);
  const [realDataError, setRealDataError] = useState("");

  // Independent loading states
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [certsLoading, setCertsLoading] = useState(false);

  // Course Progress & Study Planner state (Requirement 6)
  const [courseProgress, setCourseProgress] = useState<CourseProgressData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [targetDateInput, setTargetDateInput] = useState("");
  const [updatingTargetDate, setUpdatingTargetDate] = useState(false);
  const [togglingModuleId, setTogglingModuleId] = useState<number | null>(null);

  // Onboarding wizard modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Upload Certificate Modal
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certCredId, setCertCredId] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certHash, setCertHash] = useState("");
  const [uploadingCertLoading, setUploadingCertLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Profile Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editCollege, setEditCollege] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editYear, setEditYear] = useState(3);
  const [editTargetRole, setEditTargetRole] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editBio, setEditBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Enroll state
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  // Apply state
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setError("");

    // 1. Essential profile & enrollments (loads fast, unblocks screen immediately)
    try {
      const dashRes = await studentsAPI.getDashboard();
      if (dashRes?.data) {
        setProfile(dashRes.data.profile);
        setEnrolledCourses(dashRes.data.enrolled_courses || []);
        setSkillGaps(dashRes.data.skill_gaps || []);
        setMyApplications(dashRes.data.applications || []);

        if (dashRes.data.profile?.onboarding_completed === false) {
          setShowOnboarding(true);
        }

        const p = dashRes.data.profile;
        setEditCollege(p.college || "");
        setEditCourse(p.course || "");
        setEditYear(p.year || 3);
        setEditTargetRole(p.target_role || "");
        setEditSkills((p.skills || []).join(", "));
        setEditBio(p.bio || "");
      }
    } catch (err: any) {
      console.warn("Student profile notice:", err);
    }

    // 2. Courses (independent background load)
    setCoursesLoading(true);
    coursesAPI.getAll()
      .then((res) => {
        if (res?.data) setAvailableCourses(res.data);
      })
      .catch((err) => console.warn("Courses fetch notice:", err))
      .finally(() => setCoursesLoading(false));

    // 3. Recommended Jobs (independent background load)
    setJobsLoading(true);
    jobsAPI.getAll()
      .then((res) => {
        if (res?.data) setRecommendedJobs(res.data);
      })
      .catch((err) => console.warn("Jobs fetch notice:", err))
      .finally(() => setJobsLoading(false));

    // 4. Certificates & Progress (independent background load)
    setCertsLoading(true);
    certificatesAPI.getMyCertificates()
      .then((res) => {
        if (res?.data) setCertificates(res.data);
      })
      .catch((err) => console.warn("Certificates fetch notice:", err))
      .finally(() => setCertsLoading(false));

    studentsAPI.getUploadedCertificates()
      .then((res) => {
        if (res?.data) setUploadedCerts(res.data);
      })
      .catch(() => {});

    studentsAPI.getCourseProgress()
      .then((res) => {
        if (res?.data) {
          setCourseProgress(res.data);
          if (res.data.target_completion_date) {
            setTargetDateInput(res.data.target_completion_date);
          }
        }
      })
      .catch(() => {});

    // 5. Personalized Roadmap (Requirement 43)
    setRoadmapLoading(true);
    studentsAPI.getRoadmap()
      .then((res) => {
        if (res?.roadmap) setRoadmapData(res);
      })
      .catch((err) => console.warn("Roadmap fetch notice:", err))
      .finally(() => setRoadmapLoading(false));

    // 6. Real Datasets small subsets (Requirement 4F: Skills, Job Recommendations, Coursera, DataCamp)
    setRealDataLoading(true);
    Promise.allSettled([
      realDataAPI.jobRecommendations({ limit: 6 }),
      realDataAPI.skills({ limit: 12 }),
      realDataAPI.courseraCourses({ limit: 4 }),
      realDataAPI.datacampCourses({ limit: 4 }),
    ]).then(([recsRes, skillsRes, courseraRes, datacampRes]) => {
      if (recsRes.status === "fulfilled" && recsRes.value?.data) {
        setRealJobRecs(recsRes.value.data);
      }
      if (skillsRes.status === "fulfilled" && skillsRes.value?.data) {
        setRealSkills(skillsRes.value.data);
      }
      if (courseraRes.status === "fulfilled" && courseraRes.value?.data) {
        setRealCoursera(courseraRes.value.data);
      }
      if (datacampRes.status === "fulfilled" && datacampRes.value?.data) {
        setRealDataCamp(datacampRes.value.data);
      }
    }).catch((err) => {
      console.warn("Real dataset fetch notice:", err);
      setRealDataError("Dataset currently unavailable.");
    }).finally(() => {
      setRealDataLoading(false);
    });
  }

  async function handleEnrollRoadmapCourse(courseTitle: string, provider = "Coursera") {
    try {
      setEnrollingRoadmapTitle(courseTitle);
      setError("");
      setSuccessMsg("");
      const res = await studentsAPI.enrollRoadmapCourse(courseTitle, provider);
      setSuccessMsg(`Enrolled in "${courseTitle}"!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to enroll in roadmap course.");
    } finally {
      setEnrollingRoadmapTitle(null);
    }
  }

  async function handleUpdateProgress(enrollmentId: number, progressPct: number) {
    try {
      setUpdatingProgressId(enrollmentId);
      setError("");
      setSuccessMsg("");
      const res = await studentsAPI.updateEnrollmentProgress(enrollmentId, progressPct);
      setSuccessMsg(res.message || `Course progress updated to ${progressPct}%!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to update course progress.");
    } finally {
      setUpdatingProgressId(null);
    }
  }

  async function handleUpdateTargetDate(e: React.FormEvent) {
    e.preventDefault();
    if (!targetDateInput) return;
    try {
      setUpdatingTargetDate(true);
      setError("");
      setSuccessMsg("");
      const res = await studentsAPI.setTargetCompletionDate(targetDateInput);
      if (res.data) {
        setCourseProgress(res.data);
        setSuccessMsg(res.message || "Target date updated! Daily study commitment recalculated.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update target completion date.");
    } finally {
      setUpdatingTargetDate(false);
    }
  }

  async function handleToggleModule(moduleId: number) {
    try {
      setTogglingModuleId(moduleId);
      setError("");
      setSuccessMsg("");
      const res = await studentsAPI.toggleModuleComplete(moduleId);
      if (res.data) {
        setCourseProgress(res.data);
        setSuccessMsg("Module progress updated in SQLite database!");
        setTimeout(() => setSuccessMsg(""), 3000);
        // Refresh enrolled courses in background
        const dashRes = await studentsAPI.getDashboard();
        if (dashRes.data) {
          setEnrolledCourses(dashRes.data.enrolled_courses || []);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update module progress.");
    } finally {
      setTogglingModuleId(null);
    }
  }

  async function handleFileHashCompute(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setCertHash(hashHex);
      if (!certTitle) {
        setCertTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      // fallback
    }
  }

  async function handleUploadCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!certTitle.trim() || !certIssuer.trim()) {
      setError("Please provide certificate title and issuing organization.");
      return;
    }

    try {
      setUploadingCertLoading(true);
      setError("");

      let finalHash = certHash;
      if (!finalHash) {
        const textToHash = `${certTitle}-${certIssuer}-${certCredId || Date.now()}`;
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(textToHash));
        finalHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      const res = await studentsAPI.uploadCertificate({
        title: certTitle.trim(),
        issuing_organization: certIssuer.trim(),
        credential_id: certCredId.trim() || undefined,
        credential_url: certUrl.trim() || undefined,
        file_hash_sha256: finalHash,
      });

      setSuccessMsg("Certificate uploaded and submitted to SARATHI verification queue!");
      setIsUploadingCert(false);
      setCertTitle("");
      setCertIssuer("");
      setCertCredId("");
      setCertUrl("");
      setCertHash("");

      // reload uploaded certs
      const uploadedRes = await studentsAPI.getUploadedCertificates();
      if (uploadedRes.data) setUploadedCerts(uploadedRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to submit certificate.");
    } finally {
      setUploadingCertLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setError("");
      const res = await studentsAPI.updateProfile({
        college: editCollege,
        course: editCourse,
        year: editYear,
        target_role: editTargetRole,
        skills: editSkills ? editSkills.split(",").map((s) => s.trim()) : [],
        bio: editBio,
      });

      if (res.data) {
        setProfile(res.data);
        setIsEditingProfile(false);
        setSuccessMsg("Student profile saved to database successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEnroll(courseId: number) {
    try {
      setEnrollingId(courseId);
      setError("");
      setSuccessMsg("");
      const res = await coursesAPI.enroll(courseId);
      setSuccessMsg(res.message || "Enrolled successfully!");
      // Reload dashboard
      const dash = await studentsAPI.getDashboard();
      if (dash.data) {
        setEnrolledCourses(dash.data.enrolled_courses || []);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Enrollment failed.");
    } finally {
      setEnrollingId(null);
    }
  }

  async function handleApply(jobId: number) {
    try {
      setApplyingJobId(jobId);
      setError("");
      setSuccessMsg("");
      const res = await jobsAPI.apply(jobId);
      setSuccessMsg(res.message || "Applied successfully!");
      // Reload applications
      const apps = await jobsAPI.getMyApplications();
      if (apps.data) {
        setMyApplications(apps.data);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Application failed.");
    } finally {
      setApplyingJobId(null);
    }
  }


  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* NOTIFICATIONS */}
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

      {/* STUDENT HERO PROFILE CARD (Requirement 41) */}
      <div
        className="chart-card"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "white",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {((profile?.full_name || profile?.name || "ST").split(" ").map((n) => n[0]).join("")).substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "white" }}>
                  {profile?.full_name || profile?.name || "Student"}
                </h1>
                <span
                  style={{
                    background: "#059669",
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Verified Student
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>
                {profile?.course || profile?.branch || "Higher Education"} {profile?.year ? `· Year ${profile.year}` : ""} {profile?.college ? `· ${profile.college}` : ""}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                Target Career Role: <strong style={{ color: "#93C5FD" }}>{profile?.target_role || "Not Specified"}</strong>
                {profile?.work_preference && <span style={{ marginLeft: 8, color: "#A7F3D0" }}>• {profile.work_preference}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                color: "white",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🎯</span> Career Goals & Interests
            </button>

            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "white",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✎ Edit Profile (DB)
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("assessment")}
                style={{
                  background: "#2563EB",
                  border: "none",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                }}
              >
                ⚡ Take Assessment
              </button>
            )}
          </div>
        </div>

        {/* METRICS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Skill Score</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#60A5FA", marginTop: 2 }}>
              {profile?.skill_score !== undefined ? `${profile.skill_score}%` : "0%"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Industry Readiness</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#34D399", marginTop: 2 }}>
              {profile?.industry_readiness !== undefined ? `${profile.industry_readiness}%` : "0%"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Enrolled Courses</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#FCD34D", marginTop: 2 }}>
              {enrolledCourses.length} Active
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Credentials</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA", marginTop: 2 }}>
              {certificates.length} Verified
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
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
              maxWidth: 520,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Update Student Profile in Database
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>College / University</label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Course / Degree</label>
                  <input
                    type="text"
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Year</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Target Job Role</label>
                <input
                  type="text"
                  value={editTargetRole}
                  onChange={(e) => setEditTargetRole(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Skills (comma separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="Python, FastAPI, SQL, React"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13, marginTop: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary"
                  style={{ fontSize: 12 }}
                >
                  {savingProfile ? "Saving to DB..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC COURSE PROGRESS CIRCLE & STUDY PLANNER (Requirement 6) */}
      <div
        className="chart-card"
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Course Progress & Daily Study Planner
              </h2>
              <span
                style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  border: "1px solid #BFDBFE",
                }}
              >
                ● SQLite Live Sync
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
              Active Course: <strong style={{ color: "#1E293B" }}>{courseProgress?.has_enrollment ? courseProgress.course_name : "No Active Enrollment"}</strong>
            </p>
          </div>

          {/* Quick Pace Status Badge */}
          {courseProgress && courseProgress.has_enrollment && courseProgress.pace_status !== "NOT_ENROLLED" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 20,
                background:
                  courseProgress.pace_status === "ON_TRACK"
                    ? "#DCFCE7"
                    : courseProgress.pace_status === "AHEAD"
                    ? "#DBEAFE"
                    : "#FEF3C7",
                color:
                  courseProgress.pace_status === "ON_TRACK"
                    ? "#15803D"
                    : courseProgress.pace_status === "AHEAD"
                    ? "#1E40AF"
                    : "#B45309",
                fontWeight: 700,
                fontSize: 12,
                border: `1px solid ${
                  courseProgress.pace_status === "ON_TRACK"
                    ? "#86EFAC"
                    : courseProgress.pace_status === "AHEAD"
                    ? "#93C5FD"
                    : "#FDE68A"
                }`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    courseProgress.pace_status === "ON_TRACK"
                      ? "#22C55E"
                      : courseProgress.pace_status === "AHEAD"
                      ? "#3B82F6"
                      : "#F59E0B",
                  display: "inline-block",
                }}
              />
              Pace: {courseProgress.pace_status.replace("_", " ")}
            </div>
          )}
        </div>

        {!courseProgress?.has_enrollment ? (
          <div
            style={{
              padding: "36px 20px",
              textAlign: "center",
              background: "#F8FAFC",
              borderRadius: 12,
              border: "1px dashed #CBD5E1",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎓</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "0 0 6px 0" }}>
              No Active Course Enrollment
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", maxWidth: 520, margin: "0 auto 16px auto", lineHeight: 1.5 }}>
              You haven't enrolled in a learning roadmap course yet. Choose a recommended course below from your personalized 4-phase roadmap to begin tracking study hours, daily pacing, and earn verifiable certificates upon completion.
            </p>
            <a
              href="#personalized-roadmap"
              style={{
                display: "inline-block",
                padding: "8px 18px",
                background: "#2563EB",
                color: "#FFFFFF",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Explore Learning Roadmap ↓
            </a>
          </div>
        ) : (
          <>
            {/* PROGRESS CIRCLE & ANALYTICS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, alignItems: "center" }}>
              {/* Circular SVG Progress Ring */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                    {/* Background Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      stroke="#E2E8F0"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Progress Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      strokeDasharray={402}
                      strokeDashoffset={402 * (1 - ((courseProgress?.completion_percentage || 0) / 100))}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner Content */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                      {courseProgress ? `${courseProgress.completion_percentage}%` : "0%"}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>
                      Completed
                    </span>
                    <span style={{ fontSize: 10, color: "#9333EA", fontWeight: 700, marginTop: 2 }}>
                      🔥 {courseProgress?.streak_days || 0}d Streak
                    </span>
                  </div>
                </div>
              </div>

              {/* METRICS & TARGET DATE ADJUSTMENT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Stat Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Lessons Completed</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {courseProgress?.completed_lessons || 0} / {courseProgress?.total_lessons || 0}
                    </div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Study Hours</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#2563EB", marginTop: 2 }}>
                      {courseProgress?.completed_hours || 0}h <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>/ {courseProgress?.total_hours || 0}h</span>
                    </div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Daily Recommendation</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                      {courseProgress?.recommended_daily_hours || 0} <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>hrs/day</span>
                    </div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Days to Target</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#7C3AED", marginTop: 2 }}>
                      {courseProgress?.days_remaining || 0} <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>days</span>
                    </div>
                  </div>
                </div>

                {/* TARGET COMPLETION DATE FORM */}
                <form
                  onSubmit={handleUpdateTargetDate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                    🎯 Target Completion Date:
                  </label>
                  <input
                    type="date"
                    value={targetDateInput}
                    onChange={(e) => setTargetDateInput(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #94A3B8",
                      fontSize: 12,
                      background: "#FFFFFF",
                      fontWeight: 600,
                      color: "#0F172A",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={updatingTargetDate || !targetDateInput}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: updatingTargetDate ? "not-allowed" : "pointer",
                    }}
                  >
                    {updatingTargetDate ? "Recalculating..." : "Recalculate Daily Pace"}
                  </button>
                </form>
              </div>
            </div>

            {/* INTERACTIVE MODULE CHECKLIST (LIVE DB TOGGLE) */}
            {courseProgress?.modules && courseProgress.modules.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                    Curriculum Modules (Click to toggle completion & see circle update):
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    Interactive SQLite Test Toggle
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                  {courseProgress.modules.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleModule(m.id)}
                      disabled={togglingModuleId === m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${m.completed ? "#86EFAC" : "#E2E8F0"}`,
                        background: m.completed ? "#F0FDF4" : "#F8FAFC",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: m.completed ? "#16A34A" : "#FFFFFF",
                          border: `1px solid ${m.completed ? "#16A34A" : "#CBD5E1"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {m.completed ? "✓" : ""}
                      </span>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: m.completed ? "#15803D" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>
                          {m.duration_hours} hrs · {m.completed ? "Completed" : "Pending"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7-DAY SCHEDULE MILESTONES */}
            {courseProgress?.daily_plan && courseProgress.daily_plan.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  7-Day Study Schedule (Based on {courseProgress.recommended_daily_hours} hrs/day pace):
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                  {courseProgress.daily_plan.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: d.completed ? "#F0FDF4" : "#F8FAFC",
                        border: `1px solid ${d.completed ? "#BBF7D0" : "#E2E8F0"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: d.completed ? "#15803D" : "#1E293B" }}>
                        <span>{d.day}</span>
                        <span>{d.date}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.module_title}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>
                        {d.duration_hours} hrs {d.completed && "• Done"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE PROGRESS UPDATE & CERTIFICATE ISSUANCE TRIGGER */}
            {courseProgress.enrollment_id && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                      Update Course Milestone & Generate Certificate
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Reaching 100% completion automatically generates your verifiable SARATHI Certificate in SQLite.
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB" }}>
                    Current: {courseProgress.completion_percentage}%
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      disabled={updatingProgressId === courseProgress.enrollment_id}
                      onClick={() => handleUpdateProgress(courseProgress.enrollment_id!, pct)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: pct === 100 ? "1px solid #16A34A" : "1px solid #CBD5E1",
                        background: pct === 100 ? "#DCFCE7" : (courseProgress.completion_percentage === pct ? "#EFF6FF" : "#FFFFFF"),
                        color: pct === 100 ? "#15803D" : (courseProgress.completion_percentage === pct ? "#1D4ED8" : "#334155"),
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: updatingProgressId === courseProgress.enrollment_id ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {updatingProgressId === courseProgress.enrollment_id ? "Saving..." : pct === 100 ? "🎉 Complete 100% (Issue Certificate)" : `Set ${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PERSONALIZED 4-PHASE LEARNING ROADMAP (Requirement 43) */}
      <div
        id="personalized-roadmap"
        className="chart-card"
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Personalized 4-Phase Learning Roadmap
              </h2>
              <span
                style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  border: "1px solid #BFDBFE",
                }}
              >
                Coursera & DataCamp Catalogs
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
              Target Role: <strong style={{ color: "#1E293B" }}>{roadmapData?.target_role || profile?.target_role || "Software Engineer"}</strong> · 
              Current Role Readiness: <strong style={{ color: "#2563EB" }}>{roadmapData?.current_match_score ?? profile?.target_role_match_score ?? profile?.skill_score ?? 60}%</strong>
            </p>
          </div>
          {roadmapLoading && (
            <span style={{ fontSize: 12, color: "#64748B" }}>Loading AI Roadmap...</span>
          )}
        </div>

        {roadmapData?.roadmap && roadmapData.roadmap.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {roadmapData.roadmap.map((phase, pIdx) => {
              const phaseNum = phase.phase_number || phase.phase || pIdx + 1;
              const phaseTitle = phase.phase_title || phase.title || `Phase ${phaseNum}`;
              const phaseSkills = phase.targeted_skills || phase.target_skills || [];

              const statusBg =
                phase.status === "COMPLETED" ? "#DCFCE7" : phase.status === "IN_PROGRESS" ? "#DBEAFE" : "#F1F5F9";
              const statusColor =
                phase.status === "COMPLETED" ? "#15803D" : phase.status === "IN_PROGRESS" ? "#1E40AF" : "#475569";
              const statusBorder =
                phase.status === "COMPLETED" ? "#86EFAC" : phase.status === "IN_PROGRESS" ? "#93C5FD" : "#CBD5E1";

              return (
                <div
                  key={phaseNum}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${statusBorder}`,
                    background: "#F8FAFC",
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: phase.status === "COMPLETED" ? "#16A34A" : "#2563EB",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {phaseNum}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                        {phaseTitle}
                      </h3>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: statusBg,
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: 700,
                        border: `1px solid ${statusBorder}`,
                      }}
                    >
                      {phase.status.replace("_", " ")}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "#475569", margin: "4px 0 10px 0" }}>
                    {phase.focus_area}
                  </p>

                  {/* TARGET SKILLS */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {phaseSkills.map((skill: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* COURSE CARDS IN THIS PHASE */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    {phase.courses.map((course, cIdx) => {
                      const isEnrolled = course.is_enrolled || course.enrolled;
                      const ratingDisplay = typeof course.rating === "number" ? course.rating.toFixed(1) : String(course.rating || "4.8");
                      const durationDisplay = course.duration || (course.estimated_hours ? `~${course.estimated_hours} hours` : "Self-paced");

                      return (
                        <div
                          key={cIdx}
                          style={{
                            background: "#FFFFFF",
                            borderRadius: 8,
                            border: isEnrolled ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
                            padding: 12,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: course.provider === "DataCamp" ? "#FEF3C7" : "#EFF6FF",
                                  color: course.provider === "DataCamp" ? "#92400E" : "#1E40AF",
                                }}
                              >
                                {course.provider}
                              </span>
                              <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>
                                ★ {ratingDisplay}
                              </span>
                            </div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0", lineHeight: 1.3 }}>
                              {course.title}
                            </h4>
                            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
                              {course.difficulty} · {durationDisplay}
                            </div>
                          </div>

                          <div>
                            {isEnrolled ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF4", padding: "6px 10px", borderRadius: 6, border: "1px solid #BBF7D0" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>
                                  ✓ Enrolled ({course.progress_percentage}%)
                                </span>
                                {course.progress_percentage === 100 ? (
                                  <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D" }}>🏆 Completed</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProgress(course.enrollment_id!, 100)}
                                    disabled={updatingProgressId === course.enrollment_id}
                                    style={{
                                      border: "none",
                                      background: "#16A34A",
                                      color: "#FFFFFF",
                                      borderRadius: 4,
                                      padding: "3px 8px",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Complete 100%
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEnrollRoadmapCourse(course.title, course.provider)}
                                disabled={enrollingRoadmapTitle === course.title}
                                style={{
                                  width: "100%",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  background: "#2563EB",
                                  color: "#FFFFFF",
                                  border: "none",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: enrollingRoadmapTitle === course.title ? "not-allowed" : "pointer",
                                }}
                              >
                                {enrollingRoadmapTitle === course.title ? "Enrolling..." : "Enroll in Course"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
            Roadmap generated based on your target role and skills. Update your profile to see personalized course recommendations.
          </div>
        )}
      </div>

      {/* TWO COLUMNS: ENROLLED COURSES & PROGRESS (Req 44 & 45) + SKILL GAPS & RECOMMENDATIONS (Req 43) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ENROLLED COURSES & PROGRESS */}
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Enrolled Courses & Live Progress
            </h2>
            <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>
              Live SQLite Records
            </span>
          </div>

          {enrolledCourses.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
              You are not currently enrolled in any course. Check available courses below!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {enrolledCourses.map((enr) => (
                <div
                  key={enr.enrollment_id}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: 14, color: "#0F172A" }}>{enr.name || enr.course_name}</strong>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        Attendance: <strong>{enr.attendance_percentage}%</strong> · Status: {enr.status}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1D4ED8" }}>
                      {enr.progress_percentage}%
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{ width: "100%", height: 7, background: "#E2E8F0", borderRadius: 4, margin: "10px 0", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${enr.progress_percentage}%`,
                        height: "100%",
                        background: "#1D4ED8",
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  {/* MODULES LIST */}
                  {enr.modules && enr.modules.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                      {enr.modules.map((m: any) => (
                        <div
                          key={m.id || m.title}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: m.completed || m.is_completed ? "#166534" : "#64748B",
                          }}
                        >
                          <span>{m.completed || m.is_completed ? "✓" : "○"} {m.title}</span>
                          <span style={{ fontWeight: 600 }}>
                            {m.completed || m.is_completed ? "Completed" : `${m.duration_hours || 10}h`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILL GAPS & RECOMMENDATIONS (Requirement 43) */}
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Calculated Skill Gaps & Roadmap
            </h2>
            <span style={{ fontSize: 11, color: "#64748B" }}>Backend Engine</span>
          </div>

          {skillGaps.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
              No skill gaps recorded. Take the Skill Assessment to generate personalized recommendations!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {skillGaps.map((g) => (
                <div
                  key={g.id || g.skill_name}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #FDE68A",
                    background: "#FFFBEB",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13, color: "#92400E" }}>{g.skill_name}</strong>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: g.priority === "Critical" ? "#FEE2E2" : "#FEF3C7",
                        color: g.priority === "Critical" ? "#991B1B" : "#B45309",
                      }}
                    >
                      {g.priority} Priority · Gap: -{g.gap_score}%
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#78350F", marginTop: 4 }}>
                    Recommended: <strong>{g.recommended_course}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
            {/* REAL SKILLS FROM DATASET (Requirement 4B & 4F) */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                National Skill Registry (skills_rows.csv)
              </div>
              {realSkills.length === 0 && !realDataLoading ? (
                <div style={{ fontSize: 11, color: "#64748B" }}>No matching records found.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {realSkills.slice(0, 8).map((s) => (
                    <span
                      key={s.id || s.name}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#EFF6FF",
                        color: "#1E40AF",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("skillgap")}
                className="btn-secondary"
                style={{ fontSize: 12, width: "100%", marginTop: 8 }}
              >
                View Detailed Career Roadmap →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AVAILABLE COURSES CATALOG WITH ENROLL (Requirement 44) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Course Offerings & Training Batches
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
              One-click direct enrollment with live seat validation in database (Requirement 44)
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {availableCourses.map((c) => {
            const isEnrolled = enrolledCourses.some((e) => (e.course_id === c.id) || (e.name === c.name));
            const seatsRemaining = c.seats_available !== undefined ? c.seats_available : (c.training_capacity - c.enrolled_students);

            return (
              <div
                key={c.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: isEnrolled ? "2px solid #059669" : "1px solid #CBD5E1",
                  background: isEnrolled ? "#F0FDF4" : "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 4 }}>
                      {c.duration_months || 3} Months
                    </span>
                    <span style={{ fontSize: 11, color: seatsRemaining > 0 ? "#059669" : "#DC2626", fontWeight: 700 }}>
                      {seatsRemaining > 0 ? `${seatsRemaining} seats open` : "Batch Full"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "8px 0 4px" }}>
                    {c.name}
                  </h3>

                  <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineClamp: 2, WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {c.description || "Comprehensive hands-on training curriculum aligned with national industrial demand standards."}
                  </p>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                  {isEnrolled ? (
                    <div style={{ color: "#059669", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                      ✓ Currently Enrolled
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={enrollingId === c.id || seatsRemaining <= 0}
                      onClick={() => handleEnroll(c.id)}
                      className="btn-primary"
                      style={{ width: "100%", fontSize: 12, padding: "7px 0" }}
                    >
                      {enrollingId === c.id ? "Enrolling..." : "Enroll in Course"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* REAL COURSES FROM COURSERA & DATACAMP (Requirement 4D & 4F) */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🌐</span> Global Industry Certifications (Coursera & DataCamp)
              </h3>
              <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>
                Real courses from official course catalogs (Coursera_catalog.csv & datacamp_courses.csv)
              </p>
            </div>
            {realDataLoading && <span style={{ fontSize: 11, color: "#64748B" }}>Loading real courses...</span>}
          </div>

          {realDataError ? (
            <div style={{ fontSize: 12, color: "#DC2626", padding: 8, background: "#FEF2F2", borderRadius: 6 }}>
              {realDataError}
            </div>
          ) : (realCoursera.length === 0 && realDataCamp.length === 0 && !realDataLoading) ? (
            <div style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: 12 }}>No matching records found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {realCoursera.map((c, idx) => (
                <div key={`coursera-${idx}`} style={{ padding: 12, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 6px", borderRadius: 4 }}>
                      Coursera
                    </span>
                    <span style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>
                      {c.course_difficulty || "All Levels"}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "4px 0" }}>
                    {c.course_title}
                  </h4>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{c.course_organization}</div>
                  {c.course_URL && (
                    <a
                      href={c.course_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
                    >
                      View on Coursera ↗
                    </a>
                  )}
                </div>
              ))}
              {realDataCamp.map((d, idx) => (
                <div key={`datacamp-${idx}`} style={{ padding: 12, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "2px 6px", borderRadius: 4 }}>
                      DataCamp
                    </span>
                    <span style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600 }}>
                      {d.technology || "Data & AI"}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "4px 0" }}>
                    {d.title}
                  </h4>
                  <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineClamp: 2, WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.description}
                  </p>
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "#059669", fontWeight: 600, textDecoration: "none" }}
                    >
                      View on DataCamp ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* JOB OPPORTUNITIES & APPLICATIONS PIPELINE (Requirements 47 & 48) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* RECOMMENDED JOBS WITH 1-CLICK APPLY */}
        <div className="chart-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
            Recommended Jobs & Candidate Match
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recommendedJobs.slice(0, 4).map((j) => {
              const hasApplied = myApplications.some((a) => a.job_id === j.id);

              return (
                <div
                  key={j.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{j.title}</strong>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      {j.company || j.company_name} · {j.location}
                    </div>
                    <div style={{ fontSize: 11, color: "#1D4ED8", marginTop: 2 }}>
                      {j.salary_range} · Skills: {(j.skills || j.required_skills || []).slice(0, 3).join(", ")}
                    </div>
                  </div>

                  <div>
                    {hasApplied ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#DCFCE7", padding: "4px 8px", borderRadius: 6 }}>
                        Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={applyingJobId === j.id}
                        onClick={() => handleApply(j.id)}
                        className="btn-primary"
                        style={{ fontSize: 11, padding: "5px 12px" }}
                      >
                        {applyingJobId === j.id ? "Applying..." : "Apply Now"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* REAL JOB RECOMMENDATIONS DATASET (Requirement 4C & 4F) */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Live Multi-Sector Recommendations (50k Dataset)</span>
              {realDataLoading && <span style={{ fontSize: 11, color: "#64748B" }}>Loading...</span>}
            </div>
            {realDataError ? (
              <div style={{ fontSize: 11, color: "#DC2626" }}>{realDataError}</div>
            ) : realJobRecs.length === 0 && !realDataLoading ? (
              <div style={{ fontSize: 11, color: "#64748B" }}>No matching records found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {realJobRecs.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ padding: "8px 10px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 12, color: "#0F172A" }}>{r["Job Title"]}</strong>
                      <span style={{ fontSize: 10, background: "#EFF6FF", color: "#1D4ED8", padding: "1px 6px", borderRadius: 4 }}>
                        {r["Industry"] || "Tech"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      {r["Company"]} · {r["Location"]} · {r["Salary"]}
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                      Skills: {r["Required Skills"]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MY JOB APPLICATIONS PIPELINE */}
        <div className="chart-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
            My Active Applications Status
          </h2>

          {myApplications.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
              No applications submitted yet. Browse jobs and click Apply!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myApplications.map((app) => (
                <div
                  key={app.id || app.application_id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, color: "#0F172A" }}>{app.job_title}</strong>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{app.company_name}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Applied on {app.applied_at}</div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        app.status === "Selected"
                          ? "#DCFCE7"
                          : app.status === "Interview"
                          ? "#FEF3C7"
                          : app.status === "Shortlisted"
                          ? "#EFF6FF"
                          : "#F1F5F9",
                      color:
                        app.status === "Selected"
                          ? "#166534"
                          : app.status === "Interview"
                          ? "#B45309"
                          : app.status === "Shortlisted"
                          ? "#1D4ED8"
                          : "#475569",
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MY CERTIFICATES & VERIFICATION (Requirement 46) */}
      <div className="chart-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Issued Certificates & Verification
            </h2>
            <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
              Permanent tamper-proof credentials generated by backend upon course completion
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setIsUploadingCert(true)}
              style={{
                background: "#1D4ED8",
                color: "white",
                border: "none",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>+</span> Upload External Certificate
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("verify")}
                className="btn-secondary"
                style={{ fontSize: 12 }}
              >
                Open Verification Portal →
              </button>
            )}
          </div>
        </div>

        {/* SYSTEM ISSUED CERTIFICATES */}
        {certificates.length === 0 ? (
          <div style={{ padding: "16px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
            No platform-issued certificates yet. Complete all modules of a course to earn official certification.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
            {certificates.map((cert) => (
              <div
                key={cert.id || cert.certificate_number}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1.5px solid #059669",
                  background: "#F0FDF4",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                    ✓ {cert.status || "Verified"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>
                    Grade {cert.grade || "A+"}
                  </span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "6px 0 2px" }}>
                  {cert.course_name}
                </h3>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  {cert.institute_name} · Issued {cert.issue_date}
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "#334155" }}>
                  Verification ID: <code style={{ color: "#1D4ED8", fontWeight: 700 }}>{cert.certificate_number}</code>
                </div>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate("verify")}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "6px 0",
                      background: "#059669",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Verify Credential Authenticity →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CANDIDATE UPLOADED CERTIFICATES */}
        {uploadedCerts.length > 0 && (
          <div style={{ marginTop: 16, borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 10 }}>
              Candidate-Uploaded External Certificates & Verification States
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {uploadedCerts.map((uc) => (
                <div
                  key={uc.id}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        background:
                          uc.verification_status === "VERIFIED"
                            ? "#DCFCE7"
                            : uc.verification_status === "REJECTED"
                            ? "#FEE2E2"
                            : "#FEF3C7",
                        color:
                          uc.verification_status === "VERIFIED"
                            ? "#15803D"
                            : uc.verification_status === "REJECTED"
                            ? "#B91C1C"
                            : "#B45309",
                      }}
                    >
                      ● {uc.verification_status}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>
                      {new Date(uc.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 6 }}>
                    {uc.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Issuer: {uc.issuing_organization}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 11, color: "#64748B" }}>
                    SHA-256 Hash: <code style={{ color: "#0F172A" }}>{uc.file_hash_sha256.substring(0, 16)}...</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CERTIFICATE UPLOAD MODAL */}
      {isUploadingCert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              padding: 24,
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                Upload Certificate for Verification
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadingCert(false)}
                style={{ background: "none", border: "none", color: "#64748B", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadCertificate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Certificate Title *
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g. AWS Certified Cloud Practitioner / Python Masterclass"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  placeholder="e.g. NPTEL / Coursera / Amazon Web Services"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Credential ID / Number
                </label>
                <input
                  type="text"
                  value={certCredId}
                  onChange={(e) => setCertCredId(e.target.value)}
                  placeholder="e.g. CERT-AWS-84920"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Attach Document (Computes Cryptographic SHA-256 Hash)
                </label>
                <input
                  type="file"
                  onChange={handleFileHashCompute}
                  style={{ width: "100%", fontSize: 12 }}
                />
                {certHash && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#059669", wordBreak: "break-all" }}>
                    ✓ SHA-256 Digest: {certHash}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setIsUploadingCert(false)}
                  style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #CBD5E1", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCertLoading}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#1D4ED8", color: "white", fontSize: 12, fontWeight: 700, cursor: uploadingCertLoading ? "not-allowed" : "pointer" }}
                >
                  {uploadingCertLoading ? "Submitting..." : "Submit to Verification Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT ONBOARDING MODAL */}
      {showOnboarding && (
        <StudentOnboarding
          onComplete={() => {
            setShowOnboarding(false);
            loadAllData();
            setSuccessMsg("Career roadmap customized! Daily lessons now match your technical interests.");
          }}
          onCancel={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
