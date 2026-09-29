import { apiClient } from "./client";

export interface JobData {
  id: number;
  title: string;
  company: string;
  company_name: string;
  location: string;
  job_type: string;
  experience: string;
  vacancies: number;
  salary_range: string;
  description?: string;
  skills: string[];
  required_skills: string[];
  applicants_count: number;
  posted_date: string;
}

export const jobsAPI = {
  getAll: (search?: string, location?: string, job_type?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (location) params.append("location", location);
    if (job_type) params.append("job_type", job_type);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: JobData[] }>(
      `/api/jobs/${q ? `?${q}` : ""}`
    );
  },

  getById: (id: number) =>
    apiClient<{ success: boolean; data: JobData }>(`/api/jobs/${id}`),

  create: (job: {
    title: string;
    company_name: string;
    location?: string;
    job_type?: string;
    experience?: string;
    vacancies?: number;
    salary_range?: string;
    description?: string;
    required_skills: string;
  }) =>
    apiClient<{ success: boolean; message: string; data: any }>("/api/jobs/", {
      method: "POST",
      body: JSON.stringify(job),
    }),

  postJob: (job: {
    title: string;
    company_name: string;
    location?: string;
    job_type?: string;
    experience?: string;
    vacancies?: number;
    salary_range?: string;
    description?: string;
    required_skills: string;
  }) =>
    apiClient<{ success: boolean; message: string; data: any }>("/api/jobs/post", {
      method: "POST",
      body: JSON.stringify(job),
    }),

  getMatches: (jobId: number) =>
    apiClient<{
      success: boolean;
      job_id: number;
      job_title: string;
      required_skills: string[];
      total_candidates: number;
      data: any[];
    }>(`/api/jobs/${jobId}/matches`),

  apply: (jobId: number, cover_note?: string) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/jobs/${jobId}/apply`,
      {
        method: "POST",
        body: JSON.stringify({ cover_note }),
      }
    ),

  getMyApplications: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/jobs/my/applications"
    ),

  getCompanyApplications: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/jobs/company/applications"
    ),

  updateApplicationStatus: (applicationId: number, status: string, notes?: string) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/jobs/applications/${applicationId}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      }
    ),
};
