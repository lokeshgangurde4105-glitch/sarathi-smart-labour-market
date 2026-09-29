import { apiClient } from "./client";
import { jobsAPI } from "./jobs";

export interface EmployerItem {
  id: number;
  name: string;
  industry: string;
  location: string;
  open_positions: number;
  top_skills: string[];
  hiring_status: string;
}

export const companiesAPI = {
  getProfile: () =>
    apiClient<{ success: boolean; data: any }>("/api/employers/"),

  getEmployers: (industry?: string, location?: string) => {
    const params = new URLSearchParams();
    if (industry) params.append("industry", industry);
    if (location) params.append("location", location);
    const qs = params.toString();
    return apiClient<{ success: boolean; count: number; data: EmployerItem[] }>(
      `/api/employers/${qs ? `?${qs}` : ""}`
    );
  },

  getEmployerById: (id: number) =>
    apiClient<{ success: boolean; data: EmployerItem }>(`/api/employers/${id}`),

  getEmployerSkills: (id: number) =>
    apiClient<{ success: boolean; employer: string; skills: string[] }>(`/api/employers/${id}/skills`),

  getOverviewSummary: () =>
    apiClient<{
      success: boolean;
      data: {
        total_employers: number;
        active_employers: number;
        total_open_positions: number;
      };
    }>("/api/employers/summary/overview"),

  checkStatus: () =>
    apiClient<{ success: boolean; status: string; module: string; version: string }>(
      "/api/employers/status/check"
    ),

  getApplications: () => jobsAPI.getCompanyApplications(),

  updateApplicationStatus: (applicationId: number, status: string, notes?: string) =>
    jobsAPI.updateApplicationStatus(applicationId, status, notes),

  postJob: (job: Parameters<typeof jobsAPI.create>[0]) => jobsAPI.create(job),

  getCandidatesForJob: (jobId: number) => jobsAPI.getMatches(jobId),
};

export const employersAPI = companiesAPI;
