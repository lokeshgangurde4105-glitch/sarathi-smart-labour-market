import { apiClient } from "./client";

export interface DashboardFilterParams {
  state?: string;
  sector?: string;
  search?: string;
  period?: string;
}

export const dashboardAPI = {
  getSummary: (params: DashboardFilterParams = {}) => {
    const q = new URLSearchParams();
    if (params.state) q.append("state", params.state);
    if (params.sector) q.append("sector", params.sector);
    if (params.search) q.append("search", params.search);
    const qs = q.toString();
    return apiClient<{ success: boolean; data: any }>(`/api/dashboard/summary${qs ? `?${qs}` : ""}`);
  },

  getTrends: (params: DashboardFilterParams = {}) => {
    const q = new URLSearchParams();
    if (params.period) q.append("period", params.period);
    if (params.state) q.append("state", params.state);
    if (params.sector) q.append("sector", params.sector);
    const qs = q.toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/trends${qs ? `?${qs}` : ""}`);
  },

  getSectorDistribution: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/sector-distribution?${q}`);
  },

  getTopRoles: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/top-roles?${q}`);
  },

  getAlerts: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/alerts?${q}`);
  },

  getSources: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/sources?${q}`);
  },

  getEmerging: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/emerging?${q}`);
  },

  getSalary: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/salary?${q}`);
  },

  getDeclining: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/declining?${q}`);
  },

  getDistricts: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any[] }>(`/api/dashboard/districts?${q}`);
  },

  getJobMarket: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any }>(`/api/dashboard/job-market?${q}`);
  },

  getSkillGap: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any }>(`/api/dashboard/skill-gap?${q}`);
  },

  getCurriculumAlignment: (state = "All States", sector = "All Sectors") => {
    const q = new URLSearchParams({ state, sector }).toString();
    return apiClient<{ success: boolean; data: any }>(`/api/dashboard/curriculum?${q}`);
  },
};
