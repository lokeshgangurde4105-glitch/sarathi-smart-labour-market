import { apiClient } from "./client";

export interface Question {
  id: number;
  skill_name: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  difficulty: string;
  category?: string;
}

export interface AssessmentResult {
  attempt_id: number;
  total_questions: number;
  correct_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  skill_scores: Record<string, number>;
  skill_gaps: Array<{
    skill_name: string;
    current_score: number;
    required_score: number;
    gap_score: number;
    priority: string;
    recommended_course: string;
  }>;
  recommended_courses: string[];
  answers_review: Array<{
    question_id: number;
    skill_name: string;
    question: string;
    selected_option: string;
    correct_option: string;
    is_correct: boolean;
    explanation?: string;
  }>;
  submitted_at: string;
}

export const assessmentsAPI = {
  getQuestions: (limit = 10, category?: string, skill?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category) params.append("category", category);
    if (skill) params.append("skill", skill);
    return apiClient<{ success: boolean; total: number; data: Question[] }>(
      `/api/assessments/questions?${params.toString()}`
    );
  },

  submit: (answers: Array<{ question_id: number; selected_option: string }>) =>
    apiClient<{ success: boolean; message: string; data: AssessmentResult }>(
      "/api/assessments/submit",
      {
        method: "POST",
        body: JSON.stringify({ answers }),
      }
    ),

  getHistory: () =>
    apiClient<{ success: boolean; count: number; data: any[] }>(
      "/api/assessments/history"
    ),

  getAttempt: (attemptId: number) =>
    apiClient<{ success: boolean; data: any }>(
      `/api/assessments/attempt/${attemptId}`
    ),
};
