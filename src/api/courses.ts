import { apiClient } from "./client";

export interface CourseData {
  id: number;
  name: string;
  qualification?: string;
  duration_months?: number;
  training_capacity: number;
  enrolled_students: number;
  seats_available: number;
  placement_rate: number;
  alignment_score: number;
  demand_level: string;
  description?: string;
  modules_count?: number;
  modules?: Array<{
    id: number;
    title: string;
    description?: string;
    order_num: number;
    duration_hours: number;
  }>;
}

export const coursesAPI = {
  getAll: (search?: string, demand_level?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (demand_level) params.append("demand_level", demand_level);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: CourseData[] }>(
      `/api/courses/${q ? `?${q}` : ""}`
    );
  },

  getById: (id: number) =>
    apiClient<{ success: boolean; data: CourseData }>(`/api/courses/${id}`),

  enroll: (courseId: number) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/courses/${courseId}/enroll`,
      { method: "POST" }
    ),

  getMyEnrollments: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/courses/my/enrollments"
    ),

  updateProgress: (
    enrollmentId: number,
    progress: {
      module_id?: number;
      is_completed?: boolean;
      attendance_percentage?: number;
      score?: number;
    }
  ) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      `/api/courses/progress/${enrollmentId}`,
      {
        method: "PUT",
        body: JSON.stringify(progress),
      }
    ),

  getCatalog: () =>
    apiClient<{ success: boolean; data: CourseData[] }>("/api/courses/catalog"),
};
