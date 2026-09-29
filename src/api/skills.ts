import { apiClient } from "./client";

export const skillsAPI = {
  getAll: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: any[] }>(
      `/api/skills/${q ? `?${q}` : ""}`
    );
  },

  getEmerging: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/skills/emerging"
    ),

  getById: (id: number) =>
    apiClient<{ success: boolean; data: any }>(`/api/skills/${id}`),

  getMyGaps: () =>
    apiClient<{ success: boolean; data: any }>("/api/skill-gap/me"),

  calculateGaps: (targetRole?: string) =>
    apiClient<{ success: boolean; data: any }>("/api/skill-gap/calculate", {
      method: "POST",
      body: JSON.stringify({ target_role: targetRole }),
    }),

  getMacroGaps: () =>
    apiClient<{ success: boolean; data: any[] }>("/api/skill-gap/analysis"),

  getAllGaps: () =>
    apiClient<{ success: boolean; data: any[] }>("/api/skill-gap/"),

  create: (skill: { name: string; category?: string; is_emerging?: boolean }) =>
    apiClient<{ success: boolean; data: any }>("/api/skills/", {
      method: "POST",
      body: JSON.stringify(skill),
    }),
};
