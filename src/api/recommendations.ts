import { apiClient } from "./client";

export interface AIRecommendationItem {
  id: number;
  title: string;
  recommendation: string;
  reason: string;
  priority: string;
  confidence_score: number;
  status: string;
  generated_at: string;
}

export const recommendationsAPI = {
  getAll: () =>
    apiClient<{
      success: boolean;
      data: Record<string, string[]>;
      ai_recommendations: AIRecommendationItem[];
    }>("/api/recommendations/"),

  getForStudent: (studentId: number) =>
    apiClient<{
      success: boolean;
      student: { id: number; name: string; course: string };
      current_skills: string[];
      recommended_skills: string[];
      count: number;
    }>(`/api/recommendations/student/${studentId}`),

  getByCourse: (courseName: string) =>
    apiClient<{
      success: boolean;
      course?: string;
      recommended_skills?: string[];
      count?: number;
      message?: string;
    }>(`/api/recommendations/course/${encodeURIComponent(courseName)}`),

  getSkillGaps: (studentId: number) =>
    apiClient<{
      success: boolean;
      student_id: number;
      gaps: Array<{
        skill: string;
        gap: number;
        priority: string;
        recommended_course?: string;
      }>;
    }>(`/api/recommendations/skill-gap/${studentId}`),
};
