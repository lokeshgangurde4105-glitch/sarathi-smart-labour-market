import { apiClient } from "./client";

export interface IndustryItem {
  id: number;
  name: string;
  short_name: string;
  demand: number;
  growth: string;
  jobs: number;
  top_skills: string[];
  status: string;
}

export const industriesAPI = {
  getAll: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient<{ success: boolean; count: number; data: IndustryItem[] }>(
      `/api/industries/${q}`
    );
  },

  getById: (id: number) =>
    apiClient<{ success: boolean; data: IndustryItem }>(`/api/industries/${id}`),

  getTop: () =>
    apiClient<{ success: boolean; data: IndustryItem[] }>("/api/industries/analytics/top"),

  getGrowth: () =>
    apiClient<{ success: boolean; data: IndustryItem[] }>("/api/industries/analytics/growth"),

  getSummary: () =>
    apiClient<{
      success: boolean;
      data: {
        total_industries: number;
        total_tracked_jobs: number;
        average_growth: string;
        top_industry: string;
      };
    }>("/api/industries/analytics/summary"),

  getSkills: (id: number) =>
    apiClient<{ success: boolean; industry: string; skills: string[] }>(
      `/api/industries/${id}/skills`
    ),

  checkStatus: () =>
    apiClient<{ success: boolean; status: string; module: string; version: string }>(
      "/api/industries/status/check"
    ),
};
