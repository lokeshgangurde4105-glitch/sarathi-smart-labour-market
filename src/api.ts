export * from "./api/index";
import { apiClient, checkBackendHealth, API_BASE_URL } from "./api/client";

export { API_BASE_URL };

export const healthAPI = {
  check: () => checkBackendHealth(),
};

export const dashboardAPI = {
  getAnalytics: () => apiClient("/api/dashboard/summary"),
};

export const curriculumAPI = {
  getAll: (search?: string, course?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (course) params.append("course", course);
    const query = params.toString();
    return apiClient(`/api/curriculum/${query ? `?${query}` : ""}`);
  },
  getById: (id: number) => apiClient(`/api/curriculum/${id}`),
  getSummary: () => apiClient("/api/curriculum/analytics/summary"),
  getNeedsUpdate: () => apiClient("/api/curriculum/analytics/needs-update"),
  getTopAligned: () => apiClient("/api/curriculum/analytics/top-aligned"),
};