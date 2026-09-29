import { apiClient } from "./client";

export interface VerificationRecordItem {
  id: number;
  user_id: number;
  entity_type: string;
  entity_name: string;
  document_type: string | null;
  document_id: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  country?: string;
  account_status: string;
  email_verified: boolean;
  phone_verified: boolean;
  organization_verified: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  user_role: string | null;
  action: string;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const adminAPI = {
  getVerifications: (status?: string, entity_type?: string) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (entity_type && entity_type !== "all") params.append("entity_type", entity_type);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: VerificationRecordItem[] }>(
      `/api/admin/verifications${q ? `?${q}` : ""}`
    );
  },

  reviewVerification: (id: number, status: string, notes?: string) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/admin/verifications/${id}/review`,
      {
        method: "POST",
        body: JSON.stringify({ status, reviewer_notes: notes }),
      }
    ),

  approveVerification: (id: number, notes?: string) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/admin/verifications/${id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    ),

  rejectVerification: (id: number, reason?: string) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/admin/verifications/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    ),

  getMetrics: () =>
    apiClient<{
      success: boolean;
      timestamp: string;
      database: { engine: string; status: string; source_of_truth: boolean };
      metrics: {
        total_users: number;
        users_by_role: Record<string, number>;
        total_jobs: number;
        total_applications: number;
        total_courses: number;
        total_certificates: number;
        total_dataset_imports: number;
        total_verifications: number;
        pending_verifications: number;
      };
    }>("/api/admin/metrics"),

  getUsers: (role?: string, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (role && role !== "ALL") params.append("role", role);
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: AdminUserItem[] }>(
      `/api/admin/users${q ? `?${q}` : ""}`
    );
  },

  activateUser: (userId: number) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/admin/users/${userId}/activate`,
      { method: "POST" }
    ),

  getAuditLogs: (limit = 50, action?: string) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (action) params.append("action", action);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: AuditLogItem[] }>(
      `/api/admin/audit-logs${q ? `?${q}` : ""}`
    );
  },

  getMyVerificationStatus: () =>
    apiClient<{
      success: boolean;
      is_verified: boolean;
      status: string;
      record?: any;
    }>("/api/admin/verifications/my-status"),

  submitVerification: (data: {
    entity_type: string;
    entity_name: string;
    document_type?: string;
    document_id?: string;
    notes?: string;
  }) =>
    apiClient<{
      success: boolean;
      message: string;
      data: any;
    }>("/api/admin/verifications/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOverviewStats: () =>
    apiClient<{
      success: boolean;
      authority: string;
      role: string;
      kpis: {
        total_registered_users: number;
        total_students: number;
        total_employers: number;
        total_institutes: number;
        total_trainers: number;
        total_jobs: number;
        total_courses: number;
        total_certificates: number;
        total_assessments: number;
        total_skills: number;
      };
      verifications: {
        pending: number;
        under_review: number;
        verified: number;
        total: number;
      };
      users_by_role: Record<string, number>;
      real_datasets: Record<string, number>;
    }>("/api/admin/overview-stats"),

  getStudents: (params?: {
    search?: string;
    college?: string;
    branch?: string;
    year?: number;
    location?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.college) q.append("college", params.college);
    if (params?.branch) q.append("branch", params.branch);
    if (params?.year) q.append("year", params.year.toString());
    if (params?.location) q.append("location", params.location);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/students${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getEmployers: (params?: { search?: string; sector?: string; location?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.sector) q.append("sector", params.sector);
    if (params?.location) q.append("location", params.location);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/employers${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getInstitutes: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/institutes${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getTrainers: (params?: { search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/trainers${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getJobs: (params?: { search?: string; location?: string; source?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.location) q.append("location", params.location);
    if (params?.source) q.append("source", params.source);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      data: any[];
    }>(`/api/admin/jobs${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getCourses: (params?: { search?: string; provider?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.provider) q.append("provider", params.provider);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/courses${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getCertificates: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.status) q.append("status", params.status);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/certificates${q.toString() ? `?${q.toString()}` : ""}`);
  },

  getAssessments: (params?: { search?: string; skill?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.skill) q.append("skill", params.skill);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return apiClient<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      data: any[];
    }>(`/api/admin/assessments${q.toString() ? `?${q.toString()}` : ""}`);
  },
};
