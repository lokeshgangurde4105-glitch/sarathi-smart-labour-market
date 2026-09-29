import { apiClient } from "./client";

export const trainersAPI = {
  getMe: () =>
    apiClient<{ success: boolean; data: any }>("/api/training/trainer/me"),

  getAssignedStudents: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/training/trainer/students"
    ),

  markAttendance: (enrollmentId: number, attendancePercentage: number) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/training/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          attendance_percentage: attendancePercentage,
        }),
      }
    ),

  updateModuleProgress: (
    enrollmentId: number,
    moduleId: number,
    isCompleted: boolean,
    score = 90.0
  ) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/training/progress",
      {
        method: "POST",
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          module_id: moduleId,
          is_completed: isCompleted,
          score,
        }),
      }
    ),

  addFeedback: (
    studentId: number,
    skillName: string,
    feedback: string,
    gapScore = 25.0,
    priority = "High"
  ) =>
    apiClient<{ success: boolean; message: string }>("/api/training/feedback", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        skill_name: skillName,
        feedback,
        gap_score: gapScore,
        priority,
      }),
    }),

  createAssessmentQuestion: (question: {
    skill_name: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation?: string;
    difficulty?: string;
    category?: string;
  }) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/training/assessment",
      {
        method: "POST",
        body: JSON.stringify(question),
      }
    ),

  getPrograms: () =>
    apiClient<{ success: boolean; data: any[] }>("/api/training/"),
};
