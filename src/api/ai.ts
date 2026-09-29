import { apiClient } from "./client";

export interface WhyRationale {
  title: string;
  labour_market_demand: string;
  personal_gap_analysis: string;
  career_impact?: string;
  certification_status?: string;
}

export interface DailyPlan {
  focus_skill: string;
  target_role: string;
  estimated_duration_minutes: number;
  todays_topic: string;
  actionable_tasks: string[];
  why_explanation: WhyRationale;
  next_milestone: string;
}

export interface CopilotResponse {
  success: boolean;
  provider: string;
  answer: string;
  why_rationale?: WhyRationale;
  suggested_actions?: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon: string;
}

export const aiAPI = {
  getStatus: () => apiClient<{ success: boolean; info: any }>("/api/ai/status"),

  getDailyPlan: () => apiClient<{ success: boolean; data: DailyPlan }>("/api/ai/daily-plan"),

  getQuickActions: () => apiClient<{ success: boolean; actions: QuickAction[] }>("/api/ai/quick-actions"),

  queryCopilot: (query: string) =>
    apiClient<CopilotResponse>("/api/ai/copilot", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};
