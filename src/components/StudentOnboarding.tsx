import React, { useState, useEffect } from "react";
import { studentsAPI, StudentProfileData } from "../api";

interface StudentOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
  initialProfile?: Partial<StudentProfileData>;
}

const TARGET_ROLES = [
  "Full Stack Developer",
  "AI / Machine Learning Engineer",
  "Backend Systems Engineer",
  "Cloud & DevOps Architect",
  "Data Analyst & BI Specialist",
  "Cyber Security Analyst",
];

const INDUSTRIES = [
  "IT & Software Engineering",
  "Banking, Financial Services & FinTech",
  "Artificial Intelligence & Research",
  "Healthcare & Biotechnology",
  "E-Commerce & Digital Platforms",
  "Manufacturing & Core Engineering",
];

const LOCATIONS = [
  "Pune, Maharashtra",
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Hyderabad, Telangana",
  "Delhi NCR (Noida / Gurugram)",
  "Chennai, Tamil Nadu",
];

const WORK_MODES = ["Hybrid", "Remote", "On-site"];

const EXPERIENCE_LEVELS = [
  "Fresher / Student",
  "Internship Completed",
  "Entry Level (0-1 yrs)",
  "Junior Developer (1-2 yrs)",
];

export default function StudentOnboarding({ onComplete, onCancel, initialProfile }: StudentOnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Retrieve current user from localStorage to prepopulate name if available
  const storedUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  // SECTION 1: PERSONAL
  const [fullName, setFullName] = useState(initialProfile?.full_name || storedUser?.name || "");
  const [dob, setDob] = useState(initialProfile?.dob || "");
  const [gender, setGender] = useState(initialProfile?.gender || "Male");
  const [phone, setPhone] = useState(initialProfile?.phone || "");

  // SECTION 2: EDUCATION
  const [college, setCollege] = useState(initialProfile?.college || "");
  const [course, setCourse] = useState(initialProfile?.course || "");
  const [branch, setBranch] = useState(initialProfile?.branch || "");
  const [year, setYear] = useState<number>(initialProfile?.year || 3);
  const [semester, setSemester] = useState<number>(initialProfile?.semester || 6);
  const [graduationYear, setGraduationYear] = useState<number>(initialProfile?.graduation_year || 2026);

  // SECTION 3: CAREER
  const [targetRole, setTargetRole] = useState(initialProfile?.target_role || "");
  const [preferredIndustry, setPreferredIndustry] = useState(initialProfile?.preferred_industry || "IT & Software Engineering");
  const [preferredLocation, setPreferredLocation] = useState(initialProfile?.preferred_location || "Pune, Maharashtra");
  const [workPreference, setWorkPreference] = useState(initialProfile?.work_preference || "Hybrid");

  // SECTION 4: SKILLS
  const [skills, setSkills] = useState((initialProfile?.skills || []).join(", "));
  const [programmingLanguages, setProgrammingLanguages] = useState(initialProfile?.programming_languages || "");
  const [toolsTechnologies, setToolsTechnologies] = useState(initialProfile?.tools_technologies || "");

  // SECTION 5: EXPERIENCE & LINKS
  const [experienceLevel, setExperienceLevel] = useState(initialProfile?.experience_level || "Fresher / Student");
  const [internshipExperience, setInternshipExperience] = useState(initialProfile?.internship_experience || "");
  const [projects, setProjects] = useState(initialProfile?.projects || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile?.linkedin_url || "");
  const [githubUrl, setGithubUrl] = useState(initialProfile?.github_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(initialProfile?.portfolio_url || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateStep = (currentStep: number): boolean => {
    setError("");
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setError("Full Name is required.");
        return false;
      }
      if (!phone.trim()) {
        setError("Phone Number is required.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!college.trim()) {
        setError("College / University name is required.");
        return false;
      }
      if (!course.trim()) {
        setError("Degree / Course name is required (e.g. B.Tech Computer Engineering).");
        return false;
      }
      if (!branch.trim()) {
        setError("Branch / Specialization is required (e.g. Computer Science).");
        return false;
      }
    } else if (currentStep === 3) {
      if (!targetRole.trim()) {
        setError("Please choose or enter your Target Career Role.");
        return false;
      }
    } else if (currentStep === 4) {
      if (!skills.trim() && !programmingLanguages.trim()) {
        setError("Please provide at least your primary technical skills or programming languages.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    try {
      setSubmitting(true);
      setError("");

      const profilePayload: Partial<StudentProfileData> = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        dob: dob.trim() || undefined,
        gender,
        phone: phone.trim(),
        college: college.trim(),
        course: course.trim(),
        course_name: course.trim(),
        branch: branch.trim(),
        year,
        current_year: year,
        semester,
        graduation_year: graduationYear,
        target_role: targetRole.trim(),
        preferred_industry: preferredIndustry,
        preferred_location: preferredLocation,
        work_preference: workPreference,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        programming_languages: programmingLanguages.trim() || undefined,
        tools_technologies: toolsTechnologies.trim() || undefined,
        experience_level: experienceLevel,
        internship_experience: internshipExperience.trim() || undefined,
        projects: projects.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        location: preferredLocation,
        profile_completed: true,
      };

      const res = await studentsAPI.updateProfile(profilePayload);

      // Update user in localStorage
      if (storedUser) {
        storedUser.profile_completed = true;
        storedUser.name = fullName.trim();
        localStorage.setItem("user", JSON.stringify(storedUser));
      }

      onComplete();
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please verify your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          border: "1px solid #CBD5E1",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
        }}
      >
        {/* PROGRESS INDICATOR */}
        <div style={{ background: "#F1F5F9", height: 6, width: "100%" }}>
          <div
            style={{
              background: "linear-gradient(90deg, #1D4ED8, #0D9488)",
              height: "100%",
              width: `${(step / totalSteps) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* HEADER */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#1D4ED8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Step {step} of {totalSteps} • Student Profile & Intelligence Setup
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
          <h2 style={{ margin: "6px 0 2px", fontSize: 19, fontWeight: 800, color: "#0F172A" }}>
            {step === 1 && "1. Personal Information"}
            {step === 2 && "2. Academic & Education Background"}
            {step === 3 && "3. Target Career Role & Preferences"}
            {step === 4 && "4. Skills & Technical Competencies"}
            {step === 5 && "5. Experience, Projects & Portfolio"}
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
            {step === 1 && "Official identity details for academic certificates and recruiter verification."}
            {step === 2 && "Your university and branch define curriculum alignment and semester roadmap."}
            {step === 3 && "Used by SARATHI to match 50,000 real market openings and calculate skill gaps."}
            {step === 4 && "Live skill overlap determines your Skill Score and dynamic course recommendations."}
            {step === 5 && "Projects and internships boost your calculated Industry Readiness metric."}
          </p>
        </div>

        {/* STEP BODY */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  color: "#B91C1C",
                  fontSize: 13,
                  marginBottom: 16,
                  fontWeight: 600,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Full Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        boxSizing: "border-box",
                        background: "white",
                        outline: "none",
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Phone Number <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: EDUCATION */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    College / University Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Pune Institute of Computer Technology"
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Degree / Program <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech Computer Engineering"
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Branch / Department <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science"
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Current Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        background: "white",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                      <option value={5}>Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Current Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        background: "white",
                        boxSizing: "border-box",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Graduation Year
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        background: "white",
                        boxSizing: "border-box",
                      }}
                    >
                      {[2024, 2025, 2026, 2027, 2028, 2029].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CAREER & LOCATION */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Target Job Role <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                    {TARGET_ROLES.map((r) => {
                      const sel = targetRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTargetRole(r)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: sel ? "2px solid #1D4ED8" : "1px solid #CBD5E1",
                            background: sel ? "#EFF6FF" : "#FFFFFF",
                            color: sel ? "#1E40AF" : "#334155",
                            fontSize: 12,
                            fontWeight: sel ? 700 : 500,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {sel ? "✓ " : ""}{r}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Or type a custom role (e.g. Mobile Developer)"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Preferred Industry
                    </label>
                    <select
                      value={preferredIndustry}
                      onChange={(e) => setPreferredIndustry(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        background: "white",
                        boxSizing: "border-box",
                      }}
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Preferred Location
                    </label>
                    <select
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        background: "white",
                        boxSizing: "border-box",
                      }}
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Work Mode Preference
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {WORK_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setWorkPreference(mode)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 8,
                          border: workPreference === mode ? "2px solid #1D4ED8" : "1px solid #CBD5E1",
                          background: workPreference === mode ? "#EFF6FF" : "white",
                          color: workPreference === mode ? "#1D4ED8" : "#334155",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SKILLS */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Primary Technical Skills (Comma-separated) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Python, SQL, React, REST APIs, Git"
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                    These skills will be matched live against 50,000 real openings from SIH-134 datasets to determine your Skill Score.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Programming Languages
                  </label>
                  <input
                    type="text"
                    value={programmingLanguages}
                    onChange={(e) => setProgrammingLanguages(e.target.value)}
                    placeholder="e.g. Python, TypeScript, JavaScript, C++, Java"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Tools & Technologies
                  </label>
                  <input
                    type="text"
                    value={toolsTechnologies}
                    onChange={(e) => setToolsTechnologies(e.target.value)}
                    placeholder="e.g. FastAPI, Docker, PostgreSQL, AWS, TailwindCSS"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: EXPERIENCE & LINKS */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Internship / Practical Experience
                  </label>
                  <textarea
                    rows={2}
                    value={internshipExperience}
                    onChange={(e) => setInternshipExperience(e.target.value)}
                    placeholder="e.g. Summer Intern at Tech Solutions (3 months) - Developed REST APIs with FastAPI"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Academic / Self Projects
                  </label>
                  <textarea
                    rows={2}
                    value={projects}
                    onChange={(e) => setProjects(e.target.value)}
                    placeholder="e.g. E-Commerce Microservices (Python, Docker, React), ML Classifier for Job Recommendations"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 12,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        fontSize: 12,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Professional Bio / Headline
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Aspiring Full Stack Engineer passionate about scalable architectures and AI systems"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              padding: "16px 24px",
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#475569",
                }}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: "9px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1D4ED8",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: submitting ? "#93C5FD" : "#059669",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Computing Real Metrics & Activating..." : "Complete Profile & Launch Platform 🚀"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
