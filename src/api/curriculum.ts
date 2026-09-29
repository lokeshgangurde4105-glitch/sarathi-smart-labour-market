import { apiClient } from "./client";

export interface CurriculumItem {
  id: number;
  course: string;
  subject: string;
  institution: string;
  alignment_score: number;
  industry_demand: number;
  skill_gap: number;
  status: string;
  skills: string[];
  recommended_skills: string[];
}

export const curriculumAPI = {
  getAll: (query?: string, course?: string) => {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (course) params.append("course", course);
    const qs = params.toString();
    return apiClient<{ success: boolean; count: number; data: CurriculumItem[] }>(
      `/api/curriculum/${qs ? `?${qs}` : ""}`
    );
  },

  getById: (id: number) =>
    apiClient<{ success: boolean; data: CurriculumItem }>(`/api/curriculum/${id}`),

  create: (item: Partial<CurriculumItem>) =>
    apiClient<{ success: boolean; data: CurriculumItem }>("/api/curriculum/", {
      method: "POST",
      body: JSON.stringify(item),
    }),

  update: (id: number, item: Partial<CurriculumItem>) =>
    apiClient<{ success: boolean; data: CurriculumItem }>(`/api/curriculum/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),

  delete: (id: number) =>
    apiClient<{ success: boolean; message: string }>(`/api/curriculum/${id}`, {
      method: "DELETE",
    }),

  getSummary: () =>
    apiClient<{
      success: boolean;
      data: {
        total_courses: number;
        average_alignment: number;
        average_skill_gap: number;
        courses_needing_update: number;
      };
    }>("/api/curriculum/analytics/summary"),

  getNeedsUpdate: () =>
    apiClient<{ success: boolean; count: number; data: CurriculumItem[] }>(
      "/api/curriculum/analytics/needs-update"
    ),

  getTopAligned: () =>
    apiClient<{ success: boolean; count: number; data: CurriculumItem[] }>(
      "/api/curriculum/analytics/top-aligned"
    ),

  checkStatus: () =>
    apiClient<{ success: boolean; status: string; module: string; version: string }>(
      "/api/curriculum/status/check"
    ),
};
