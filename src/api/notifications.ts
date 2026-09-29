import { apiClient } from "./client";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: "High" | "Medium" | "Low" | string;
  read: boolean;
  created_at?: string;
}

let cachedUnreadCount: { count: number; timestamp: number } | null = null;
let activeUnreadCountPromise: Promise<{ success: boolean; data: { unread_count: number } }> | null = null;
const UNREAD_COUNT_TTL = 60000; // 60s cache TTL to prevent rapid polling

export const notificationsAPI = {
  getNotifications: (unreadOnly = false, notificationType?: string) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append("unread_only", "true");
    if (notificationType) params.append("notification_type", notificationType);
    const q = params.toString();
    return apiClient<{ success: boolean; count: number; data: NotificationItem[] }>(
      `/api/notifications${q ? `?${q}` : ""}`
    );
  },

  getUnreadCount: async (force = false): Promise<{ success: boolean; data: { unread_count: number } }> => {
    const now = Date.now();
    if (!force && cachedUnreadCount && now - cachedUnreadCount.timestamp < UNREAD_COUNT_TTL) {
      return { success: true, data: { unread_count: cachedUnreadCount.count } };
    }

    if (activeUnreadCountPromise) {
      return activeUnreadCountPromise;
    }

    activeUnreadCountPromise = (async () => {
      try {
        const res = await apiClient<{ success: boolean; data: { unread_count: number } }>(
          "/api/notifications/unread-count",
          { timeoutMs: 2000 }
        );
        const count = res?.data?.unread_count ?? 0;
        cachedUnreadCount = { count, timestamp: Date.now() };
        return { success: true, data: { unread_count: count } };
      } catch {
        const fallbackCount = cachedUnreadCount ? cachedUnreadCount.count : 0;
        return { success: false, data: { unread_count: fallbackCount } };
      } finally {
        activeUnreadCountPromise = null;
      }
    })();

    return activeUnreadCountPromise;
  },

  invalidateUnreadCountCache: () => {
    cachedUnreadCount = null;
  },

  setCachedUnreadCount: (count: number) => {
    cachedUnreadCount = { count, timestamp: Date.now() };
  },

  markAsRead: async (id: number) => {
    if (cachedUnreadCount && cachedUnreadCount.count > 0) {
      cachedUnreadCount = { count: cachedUnreadCount.count - 1, timestamp: Date.now() };
    }
    return apiClient<{ success: boolean; message: string; data: NotificationItem }>(
      `/api/notifications/${id}/read`,
      { method: "PUT" }
    );
  },

  markAllAsRead: async () => {
    cachedUnreadCount = { count: 0, timestamp: Date.now() };
    return apiClient<{ success: boolean; message: string }>("/api/notifications/read-all", {
      method: "PUT",
    });
  },

  createNotification: (data: { title: string; message: string; type?: string; priority?: string }) =>
    apiClient<{ success: boolean; message: string; data: NotificationItem }>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getById: (id: number) =>
    apiClient<{ success: boolean; data: NotificationItem }>(`/api/notifications/${id}`),

  checkStatus: () =>
    apiClient<{ success: boolean; status: string; module: string; version: string }>(
      "/api/notifications/status/check"
    ),
};
