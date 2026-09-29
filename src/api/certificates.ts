import { apiClient } from "./client";

export interface CertificateData {
  id: number;
  certificate_number: string;
  verification_code: string;
  student_name: string;
  course_name: string;
  institute_name: string;
  trainer_name?: string;
  grade: string;
  skills: string;
  status: string;
  issue_date: string;
}

export interface VerificationResponse {
  success: boolean;
  status: "Verified" | "Invalid";
  message: string;
  data: {
    certificate_number: string;
    verification_code: string;
    student_name: string;
    course_name: string;
    institute_name: string;
    trainer_name?: string;
    issue_date: string;
    grade: string;
    skills: string[];
    status: string;
    verification_timestamp: string;
  };
}

export const certificatesAPI = {
  getMyCertificates: () =>
    apiClient<{ success: boolean; count: number; data: CertificateData[] }>(
      "/api/certificates/my"
    ),

  verify: (certificateId: string) =>
    apiClient<VerificationResponse>(
      `/api/certificates/verify/${encodeURIComponent(certificateId.trim())}`
    ),

  issue: (userId: number, courseId: number, grade = "A+") =>
    apiClient<{ success: boolean; message: string; data: any }>(
      "/api/certificates/issue",
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId, course_id: courseId, grade }),
      }
    ),
};
