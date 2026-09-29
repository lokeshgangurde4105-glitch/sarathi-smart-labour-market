import { apiClient } from "./client";

export interface PaymentStatus {
  success: boolean;
  gateway: string;
  status: string;
  mode: string;
  currency: string;
  supported_methods: string[];
}

export const paymentsAPI = {
  getStatus: () =>
    apiClient<PaymentStatus>("/api/payments/status"),

  createOrder: (data: { amount: number; currency?: string; purpose?: string }) =>
    apiClient<{
      success: boolean;
      order_id: string;
      amount: number;
      currency: string;
      key_id?: string;
    }>("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyPayment: (data: { order_id: string; payment_id?: string; signature?: string }) =>
    apiClient<{ success: boolean; message: string; data?: any }>("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
