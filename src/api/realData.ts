import { apiClient } from "./client";

export interface PaginatedRealData<T = any> {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
  message?: string | null;
}

export interface RealDatasetSummaryItem {
  file: string;
  description: string;
  records: number;
  available: boolean;
}

export interface RealDataAnalytics {
  success: boolean;
  counts: {
    indian_jobs: number;
    ai_jobs: number;
    job_recommendations: number;
    registered_skills: number;
    coursera_courses: number;
    datacamp_courses: number;
  };
  total_jobs_tracked: number;
  total_courses_tracked: number;
  top_market_skills: Array<{
    skill: string;
    category: string;
    demand_index: number;
    openings: number;
  }>;
  top_locations: Array<{
    city: string;
    state: string;
    jobs_share: string;
  }>;
}

export const realDataAPI = {
  summary: () => apiClient<{ success: boolean; total_datasets: number; data: RealDatasetSummaryItem[] }>("/api/real-data/summary"),

  indianJobs: (params: {
    search?: string;
    location?: string;
    company?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedRealData<any>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.location) query.set("location", params.location);
    if (params.company) query.set("company", params.company);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/indian-jobs${qs ? `?${qs}` : ""}`);
  },

  skills: (
    searchOrParams?: string | { search?: string; page?: number; limit?: number },
    legacyLimit = 20
  ): Promise<PaginatedRealData<{ id: string; name: string; created_at?: string }>> => {
    const query = new URLSearchParams();
    if (typeof searchOrParams === "string") {
      if (searchOrParams) query.set("search", searchOrParams);
      query.set("limit", String(legacyLimit));
    } else if (searchOrParams && typeof searchOrParams === "object") {
      if (searchOrParams.search) query.set("search", searchOrParams.search);
      if (searchOrParams.page) query.set("page", String(searchOrParams.page));
      if (searchOrParams.limit) query.set("limit", String(searchOrParams.limit));
    } else {
      query.set("limit", String(legacyLimit));
    }
    const qs = query.toString();
    return apiClient(`/api/real-data/skills${qs ? `?${qs}` : ""}`);
  },

  jobRecommendations: (params: {
    search?: string;
    location?: string;
    industry?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedRealData<any>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.location) query.set("location", params.location);
    if (params.industry) query.set("industry", params.industry);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/job-recommendations${qs ? `?${qs}` : ""}`);
  },

  aiJobs: (params: {
    search?: string;
    country?: string;
    category?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedRealData<any>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.country) query.set("country", params.country);
    if (params.category) query.set("category", params.category);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/ai-jobs${qs ? `?${qs}` : ""}`);
  },

  courseraCourses: (params: {
    search?: string;
    difficulty?: string;
    organization?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedRealData<any>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.difficulty) query.set("difficulty", params.difficulty);
    if (params.organization) query.set("organization", params.organization);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/coursera-courses${qs ? `?${qs}` : ""}`);
  },

  datacampCourses: (params: {
    search?: string;
    technology?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedRealData<any>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.technology) query.set("technology", params.technology);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/datacamp-courses${qs ? `?${qs}` : ""}`);
  },

  matchSkills: (params: {
    skills: string;
    targetRole?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    candidate_skills: string[];
    target_role: string;
    average_match_score: number;
    total_evaluated_jobs: number;
    returned_matches: number;
    ranked_jobs: Array<{
      job_title: string;
      company: string;
      location: string;
      industry: string;
      experience_level: string;
      salary: number;
      required_skills: string[];
      matched_skills: string[];
      missing_skills: string[];
      match_percentage: number;
    }>;
    priority_skill_gaps: string[];
    recommended_courses: Array<{
      missing_skill: string;
      courses: Array<{
        title: string;
        provider: string;
        organization: string;
        difficulty: string;
        rating: string;
        url: string;
      }>;
    }>;
    algorithm: string;
    source_dataset: string;
  }> => {
    const query = new URLSearchParams();
    if (params.skills) query.set("skills", params.skills);
    if (params.targetRole) query.set("target_role", params.targetRole);
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiClient(`/api/real-data/match-skills${qs ? `?${qs}` : ""}`);
  },

  analytics: (): Promise<RealDataAnalytics> => apiClient("/api/real-data/analytics"),
};
