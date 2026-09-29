import { apiClient } from "./client";

export interface StudentProfileData {
  id: number;
  user_id?: number;
  name: string;
  full_name?: string;
  email: string;
  role: string;
  phone?: string;
  dob?: string;
  gender?: string;
  college?: string;
  year?: number;
  current_year?: number;
  course?: string;
  course_name?: string;
  branch?: string;
  semester?: number;
  graduation_year?: number;
  target_role?: string;
  preferred_industry?: string;
  preferred_location?: string;
  work_preference?: string;
  skills: string[];
  programming_languages?: string;
  tools_technologies?: string;
  experience_level?: string;
  internship_experience?: string;
  projects?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  bio?: string;
  location?: string;
  resume_headline?: string;
  skill_score: number;
  industry_readiness: number;
  target_role_match_score?: number;
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  interests?: string[];
}

export interface RoadmapCourse {
  title: string;
  provider: string;
  organization?: string;
  difficulty: string;
  rating: string | number;
  url: string;
  is_enrolled: boolean;
  enrolled?: boolean;
  enrollment_id?: number;
  progress_percentage: number;
  status: string;
  estimated_hours?: number;
  duration?: string;
}

export interface RoadmapPhase {
  phase_number: number;
  phase_title: string;
  focus_area: string;
  duration: string;
  targeted_skills: string[];
  status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
  milestone: string;
  courses: RoadmapCourse[];
  phase?: number;
  title?: string;
  target_skills?: string[];
}

export interface RoadmapResponse {
  success: boolean;
  student_id: number;
  student_name: string;
  target_role: string;
  known_skills: string[];
  total_phases: number;
  roadmap: RoadmapPhase[];
  current_match_score?: number;
}

export interface StudentUploadedCert {
  id: number;
  title: string;
  issuing_organization: string;
  credential_id?: string;
  credential_url?: string;
  file_hash_sha256: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED" | "UNVERIFIED";
  rejection_reason?: string;
  verified_at?: string;
  created_at: string;
}

export interface StudentDashboardResponse {
  success: boolean;
  data: {
    user: { id: number; name: string; email: string; role: string };
    profile: StudentProfileData;
    enrolled_courses: any[];
    skill_gaps: any[];
    certificates: any[];
    applications: any[];
    latest_assessment: any;
  };
}

export interface CourseProgressData {
  has_enrollment?: boolean;
  enrollment_id?: number | null;
  course_id: number | null;
  course_name: string | null;
  completion_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  completed_hours: number;
  remaining_hours: number;
  total_hours: number;
  recommended_daily_hours: number;
  target_completion_date: string;
  days_remaining: number;
  pace_status: "ON_TRACK" | "AHEAD" | "BEHIND" | "NOT_STARTED" | "NOT_ENROLLED";
  streak_days: number;
  modules: {
    id: number;
    title: string;
    duration_hours: number;
    completed: boolean;
  }[];
  daily_plan: {
    day: string;
    date: string;
    module_title: string;
    duration_hours: number;
    completed: boolean;
  }[];
  weekly_plan: {
    week_number: number;
    week_title: string;
    target_hours: number;
    completed_hours: number;
    status: "COMPLETED" | "CURRENT" | "UPCOMING";
  }[];
}

export const studentsAPI = {
  getProfile: () =>
    apiClient<{ success: boolean; data: StudentProfileData }>("/api/students/profile"),

  updateProfile: (profile: Partial<StudentProfileData>) =>
    apiClient<{ success: boolean; message: string; data: StudentProfileData }>(
      "/api/students/profile",
      {
        method: "PUT",
        body: JSON.stringify(profile),
      }
    ),

  completeOnboarding: (data: {
    interests: string[];
    target_role: string;
    work_preference?: string;
    known_skills?: string[];
    location?: string;
    college?: string;
    year?: number;
  }) =>
    apiClient<{ success: boolean; message: string; data: any }>("/api/students/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadCertificate: (data: {
    title: string;
    issuing_organization: string;
    issue_date?: string;
    credential_id?: string;
    credential_url?: string;
    file_hash_sha256: string;
  }) =>
    apiClient<{ success: boolean; message: string; data: StudentUploadedCert }>(
      "/api/students/certificates/upload",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  getUploadedCertificates: () =>
    apiClient<{ success: boolean; count: number; data: StudentUploadedCert[] }>(
      "/api/students/certificates/uploaded"
    ),

  getDashboard: () =>
    apiClient<StudentDashboardResponse>("/api/students/me/dashboard"),

  getCourseProgress: (courseId?: number) => {
    const q = courseId ? `?course_id=${courseId}` : "";
    return apiClient<{ success: boolean; data: CourseProgressData }>(
      `/api/students/me/course-progress${q}`
    );
  },

  setTargetCompletionDate: (target_date: string) =>
    apiClient<{ success: boolean; message: string; data: CourseProgressData }>(
      "/api/students/me/target-completion-date",
      {
        method: "POST",
        body: JSON.stringify({ target_date }),
      }
    ),

  toggleModuleComplete: (moduleId: number) =>
    apiClient<{ success: boolean; message: string; data: CourseProgressData }>(
      "/api/students/me/toggle-module-complete",
      {
        method: "POST",
        body: JSON.stringify({ module_id: moduleId }),
      }
    ),

  getAll: (search?: string, course?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (course) params.append("course", course);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: any[] }>(
      `/api/students/${q ? `?${q}` : ""}`
    );
  },

  getById: (id: number) =>
    apiClient<{ success: boolean; data: any }>(`/api/students/${id}`),

  startStudy: (course_id: number, module_id?: number, lesson_id?: number, activity_type = "LESSON") =>
    apiClient<{ success: boolean; message: string; data: { session_id: number; started_at: string } }>(
      "/api/students/me/study/start",
      {
        method: "POST",
        body: JSON.stringify({ course_id, module_id, lesson_id, activity_type }),
      }
    ),

  studyHeartbeat: (session_id: number, duration_seconds: number) =>
    apiClient<{ success: boolean; session_id: number; duration_seconds: number }>(
      "/api/students/me/study/heartbeat",
      {
        method: "POST",
        body: JSON.stringify({ session_id, duration_seconds }),
      }
    ),

  completeStudy: (session_id: number, duration_seconds: number, is_completed = true) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/students/me/study/complete",
      {
        method: "POST",
        body: JSON.stringify({ session_id, duration_seconds, is_completed }),
      }
    ),

  getStudyStats: () =>
    apiClient<{ success: boolean; data: any }>("/api/students/me/study/stats"),

  getRoadmap: () =>
    apiClient<RoadmapResponse>("/api/students/me/roadmap"),

  enrollRoadmapCourse: (course_title: string, provider = "Coursera") =>
    apiClient<{ success: boolean; message: string; data: any }>("/api/students/me/roadmap/enroll", {
      method: "POST",
      body: JSON.stringify({ course_title, provider }),
    }),

  updateEnrollmentProgress: (enrollmentId: number, progress_percentage: number) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/students/me/progress/${enrollmentId}`,
      {
        method: "PUT",
        body: JSON.stringify({ progress_percentage }),
      }
    ),

  getDashboardAlias: () =>
    apiClient<StudentDashboardResponse>("/api/students/dashboard"),

  getRoadmapAlias: () =>
    apiClient<RoadmapResponse>("/api/students/roadmap"),
};

