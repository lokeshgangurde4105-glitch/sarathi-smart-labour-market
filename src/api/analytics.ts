import { apiClient } from "./client";

export const analyticsAPI = {
  getOverview: () =>
    apiClient<{
      success: boolean;
      is_live_database: boolean;
      data: {
        total_jobs: number;
        active_jobs: number;
        skills_tracked: number;
        emerging_skills: number;
        students_analyzed: number;
        industry_partners: number;
        overall_skill_gap: number;
        curriculum_alignment: number;
        datasets_imported: number;
        last_synced: string;
      };
    }>("/api/analytics/overview"),

  getSkills: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/analytics/skills"
    ),

  getJobs: () =>
    apiClient<{ success: boolean; total_jobs: number; data: any }>(
      "/api/analytics/jobs"
    ),

  getDistricts: () =>
    apiClient<{ success: boolean; state: string; data: any[] }>(
      "/api/analytics/districts"
    ),

  getSectors: () =>
    apiClient<{ success: boolean; data: any[] }>("/api/analytics/sectors"),

  getCurriculum: () =>
    apiClient<{ success: boolean; data: any[] }>("/api/analytics/curriculum"),

  getPlacements: () =>
    apiClient<{ success: boolean; data: any }>("/api/analytics/placements"),

  importDataset: (formData: FormData) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/analytics/import-dataset",
      {
        method: "POST",
        body: formData,
      }
    ),

  // Compatibility methods
  dashboard: () => apiClient<any>("/api/analytics/dashboard"),
  readiness: () => apiClient<any>("/api/analytics/readiness"),
  curriculumAlignment: () => apiClient<any>("/api/analytics/curriculum-alignment"),
  courses: () => apiClient<any>("/api/analytics/courses"),
  skillsCompatibility: () => apiClient<any>("/api/analytics/skills"),
};
