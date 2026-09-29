import { apiClient } from "./client";

export const institutesAPI = {
  getMe: () =>
    apiClient<{ success: boolean; data: any }>("/api/institutes/me"),

  getCourses: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/institutes/courses"
    ),

  createCourse: (course: {
    name: string;
    qualification?: string;
    duration_months?: number;
    training_capacity?: number;
    demand_level?: string;
    description?: string;
  }) =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/institutes/courses",
      {
        method: "POST",
        body: JSON.stringify(course),
      }
    ),

  getStudents: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/institutes/students"
    ),

  getTrainers: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/institutes/trainers"
    ),

  getBatches: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/institutes/batches"
    ),

  getAttendance: () =>
    apiClient<{ success: boolean; data: any }>("/api/institutes/attendance"),

  getPlacements: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/institutes/placements"
    ),
};
