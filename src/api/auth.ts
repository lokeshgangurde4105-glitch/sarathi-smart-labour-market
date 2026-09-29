import { apiClient } from "./client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  account_status?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  organization_verified?: boolean;
  rejection_reason?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  data: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    user?: User;
    user_id?: number;
    name?: string;
    email?: string;
    role?: string;
    account_status?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    organization_verified?: boolean;
  };
}

export const authAPI = {
  login: (email: string, password: string, remember_me = false, role?: string) =>
    apiClient<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
        remember_me,
        role: role || undefined,
        account_type: role || undefined,
      }),
    }),

  register: (name: string, email: string, password: string, role = "student", phone?: string, country = "India") =>
    apiClient<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, phone, country }),
    }),

  sendEmailOtp: (email: string, purpose = "email_verification") =>
    apiClient<{ success: boolean; message: string; cooldown_seconds?: number }>("/api/auth/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), purpose }),
    }),

  verifyEmailOtp: (email: string, otp: string, purpose = "email_verification") =>
    apiClient<{ success: boolean; message: string; email_verified?: boolean; account_status?: string }>("/api/auth/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), purpose }),
    }),

  sendPhoneOtp: (phone: string, channel = "sms", purpose = "phone_verification") =>
    apiClient<{ success: boolean; message: string; cooldown_seconds?: number }>("/api/auth/send-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone: phone.trim(), channel, purpose }),
    }),

  verifyPhoneOtp: (phone: string, otp: string, purpose = "phone_verification") =>
    apiClient<{ success: boolean; message: string; phone_verified?: boolean; account_status?: string }>("/api/auth/verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), purpose }),
    }),

  getVerificationStatus: (email?: string) => {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    return apiClient<{ success: boolean; data: any }>(`/api/auth/verification-status${q}`);
  },

  forgotPassword: (email: string) =>
    apiClient<{ success: boolean; message: string; otp_dispatch?: any }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    }),

  resetPassword: (email: string, otp: string, new_password: string) =>
    apiClient<{ success: boolean; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), new_password }),
    }),

  refreshToken: (refresh_token: string) =>
    apiClient<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  logout: () =>
    apiClient<{ success: boolean; message: string }>("/api/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    apiClient<{ success: boolean; data: User }>("/api/auth/me"),

  checkAdmin: () =>
    apiClient<{ success: boolean; is_admin: boolean; user?: any }>("/api/auth/admin-check"),
};
