import { apiClient } from "./client";

export interface ReportOverviewData {
  generated_at: string;
  students: {
    total: number;
    industry_ready: number;
    average_readiness: number;
  };
  curriculum: {
    total_courses: number;
    average_alignment: number;
    needing_update: number;
  };
  jobs: {
    total_active: number;
    skills_tracked: number;
  };
}

export const reportsAPI = {
  getOverview: () =>
    apiClient<{ success: boolean; data: ReportOverviewData }>("/api/reports/overview"),

  getSkillGap: () =>
    apiClient<{
      success: boolean;
      data: Array<{
        skill: string;
        category: string;
        demand: number;
        supply: number;
        gap: number;
      }>;
    }>("/api/reports/skill-gap"),

  getPlacement: () =>
    apiClient<{
      success: boolean;
      data: {
        total_applicants: number;
        placed_students: number;
        placement_percentage: number;
        average_salary_lpa: number;
        top_companies: string[];
      };
    }>("/api/reports/placement"),
};
