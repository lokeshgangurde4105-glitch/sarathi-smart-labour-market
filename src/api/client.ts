/**
 * Centralized API Client (Requirements 39, Task 2 & 3, Safe Single-Pass Response Parser)
 * Reads base URL from VITE_API_URL environment configuration (defaults to relative /api proxied by Vite).
 * Handles Bearer token injection, automatic 401 refresh rotation, timeouts, and JSON/FormData payload normalization.
 *
 * CRITICAL FIX: Response body stream is read EXACTLY ONCE via safeParseResponse.
 * Never attempts .json() and then .text() on the same Response object.
 */

const envApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim();

// Production default: Render backend. Development default: empty string (for Vite proxy /api) or env url
export const API_BASE_URL = (
  envApiUrl && !envApiUrl.startsWith("/")
    ? envApiUrl
    : import.meta.env.PROD
      ? "https://sarathi-smart-labour-market.onrender.com"
      : envApiUrl
).replace(/\/+$/, "");

/**
 * Resolves an API endpoint path against the configured base URL (or relative proxy).
 * Seamlessly handles base URLs with or without /api, and endpoints with or without /api.
 */
export function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanBase = API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!cleanBase) {
    // Relative Vite proxy mode: ensure path begins with /api
    return cleanEndpoint.startsWith("/api") ? cleanEndpoint : `/api${cleanEndpoint}`;
  }

  if (cleanBase.endsWith("/api")) {
    if (cleanEndpoint.startsWith("/api")) {
      return `${cleanBase}${cleanEndpoint.slice(4)}`;
    }
    return `${cleanBase}${cleanEndpoint}`;
  } else {
    if (cleanEndpoint.startsWith("/api")) {
      return `${cleanBase}${cleanEndpoint}`;
    }
    return `${cleanBase}/api${cleanEndpoint}`;
  }
}

export interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ParsedResponse<T = any> {
  status: number;
  ok: boolean;
  isJson: boolean;
  data: T | null;
  text: string;
}

/**
 * Safely parses any Fetch Response body exactly ONCE.
 * Reads as text first into memory, preventing 'body stream already read' errors,
 * then attempts JSON parsing if Content-Type or payload structure matches JSON.
 */
export async function safeParseResponse<T = any>(
  response: Response
): Promise<ParsedResponse<T>> {
  const status = response.status;
  const ok = response.ok;

  // For 204 No Content, 205 Reset, or explicit 0 Content-Length, do not read body
  if (status === 204 || status === 205 || response.headers.get("content-length") === "0") {
    return { status, ok, isJson: false, data: null, text: "" };
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    return { status, ok, isJson: false, data: null, text: "" };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { status, ok, isJson: false, data: null, text: "" };
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const looksLikeJson =
    contentType.includes("application/json") ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (looksLikeJson) {
    try {
      const data = JSON.parse(trimmed) as T;
      return { status, ok, isJson: true, data, text: trimmed };
    } catch {
      return { status, ok, isJson: false, data: null, text: trimmed };
    }
  }

  return { status, ok, isJson: false, data: null, text: trimmed };
}

/**
 * Extracts a friendly, descriptive error message from the single parsed response.
 */
export function extractErrorMessage(parsed: ParsedResponse): string {
  const { status, isJson, data, text } = parsed;

  if (isJson && data) {
    // 1. FastAPI standard HTTPException format: { "detail": "..." } or { "detail": [...] }
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      // Pydantic / FastAPI 422 validation errors
      return data.detail
        .map((item: any) => {
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((l: any) => l !== "body").join(".")
            : "";
          const msg = item.msg || item.message || (typeof item === "string" ? item : JSON.stringify(item));
          return loc ? `${loc}: ${msg}` : msg;
        })
        .join("; ");
    }

    // 2. Custom backend message formats: { "message": "..." } or { "error": "..." }
    if (typeof data.message === "string") {
      return data.message;
    }
    if (typeof data.error === "string") {
      return data.error;
    }
    if (typeof data.error?.message === "string") {
      return data.error.message;
    }
    if (typeof data === "string") {
      return data;
    }
  }

  // Plain-text error responses
  if (text && text.trim()) {
    const cleanText = text.trim();
    if (cleanText.length < 250 && !cleanText.startsWith("<")) {
      return cleanText;
    }
  }

  // Canonical status code fallback messages
  switch (status) {
    case 400:
      return "Bad Request (400): The submitted data was invalid.";
    case 401:
      return "Invalid credentials or session expired. Please verify your login details.";
    case 403:
      return "Access Forbidden (403): You do not have permission to access this resource.";
    case 404:
      return "Resource not found (404).";
    case 409:
      return "Conflict (409): An account or record with these details already exists.";
    case 422:
      return "Unprocessable Entity (422): Input validation failed. Please check required fields.";
    case 429:
      return "Too Many Requests (429): Rate limit exceeded. Please wait a moment.";
    case 500:
      return "Internal Server Error (500): The server encountered an unexpected error. Please check server logs.";
    case 502:
      return "⚠️ Bad Gateway (502): The backend service is currently unreachable. Please verify your connection or check backend service status.";
    case 503:
      return "⚠️ Service Unavailable (503): Backend service is currently overloaded or starting up. Please try again in a moment.";
    case 504:
      return "Gateway Timeout (504): The backend server took too long to respond.";
    default:
      return `Request failed with HTTP status ${status}.`;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const refreshUrl = resolveUrl("/api/auth/refresh");
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const parsed = await safeParseResponse<any>(res);
    if (!parsed.ok || !parsed.isJson || !parsed.data) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return null;
    }

    const newAccessToken = parsed.data.access_token || parsed.data.data?.access_token;
    const newRefreshToken = parsed.data.refresh_token || parsed.data.data?.refresh_token;

    if (newAccessToken) {
      localStorage.setItem("access_token", newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiClientFn<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, headers: customHeaders = {}, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...customHeaders,
  };

  // Only set Content-Type if body is not FormData and not already specified
  if (!(restOptions.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("access_token");
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = resolveUrl(endpoint);
  const formattedEndpoint = endpoint.startsWith("http") ? endpoint : endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: restOptions.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    // Automatic 401 refresh token handling
    if (
      response.status === 401 &&
      !formattedEndpoint.includes("/auth/refresh") &&
      !formattedEndpoint.includes("/auth/login") &&
      localStorage.getItem("refresh_token")
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = performTokenRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          ...restOptions,
          headers,
        });

        const retryParsed = await safeParseResponse<T>(retryRes);
        if (!retryParsed.ok) {
          throw new Error(extractErrorMessage(retryParsed));
        }
        return (retryParsed.isJson ? retryParsed.data : (retryParsed.text as any)) as T;
      }
    }

    // Safely parse the response exactly once
    const parsed = await safeParseResponse<T>(response);

    if (!parsed.ok) {
      const errorMessage = extractErrorMessage(parsed);
      if (parsed.status === 401) {
        console.warn("Unauthorized request to", formattedEndpoint);
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content or empty bodies
    if (parsed.status === 204 || (!parsed.isJson && !parsed.text)) {
      return {} as T;
    }

    return (parsed.isJson ? parsed.data : (parsed.text as any)) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${formattedEndpoint}`);
    }

    // If direct fetch to API_BASE_URL failed and it was an absolute URL, fallback to relative proxy
    if (error.name === "TypeError" && formattedEndpoint.startsWith("/api") && url !== formattedEndpoint) {
      try {
        const proxyResponse = await fetch(formattedEndpoint, {
          ...restOptions,
          headers,
        });
        const proxyParsed = await safeParseResponse<T>(proxyResponse);
        if (proxyParsed.ok) {
          return (proxyParsed.isJson ? proxyParsed.data : (proxyParsed.text as any)) as T;
        }
      } catch {
        // Fall through
      }
    }

    if (error.name === "TypeError" && (error.message.includes("fetch") || error.message.includes("NetworkError") || error.message.includes("Failed to fetch"))) {
      throw new Error(
        "Unable to connect to backend service. Please check your network connection and verify backend service availability."
      );
    }
    throw error;
  }
}

// Convenient helper functions attached to apiClient
export interface ApiClientType {
  <T>(endpoint: string, options?: RequestOptions): Promise<T>;
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
  upload<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T>;
}

const apiClient = apiClientFn as ApiClientType;

apiClient.get = function <T>(url: string, options: RequestOptions = {}) {
  return apiClientFn<T>(url, { ...options, method: "GET" });
};

apiClient.post = function <T>(url: string, data?: any, options: RequestOptions = {}) {
  return apiClientFn<T>(url, {
    ...options,
    method: "POST",
    body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
  });
};

apiClient.put = function <T>(url: string, data?: any, options: RequestOptions = {}) {
  return apiClientFn<T>(url, {
    ...options,
    method: "PUT",
    body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
  });
};

apiClient.patch = function <T>(url: string, data?: any, options: RequestOptions = {}) {
  return apiClientFn<T>(url, {
    ...options,
    method: "PATCH",
    body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
  });
};

apiClient.delete = function <T>(url: string, options: RequestOptions = {}) {
  return apiClientFn<T>(url, { ...options, method: "DELETE" });
};

apiClient.upload = function <T>(url: string, formData: FormData, options: RequestOptions = {}) {
  return apiClientFn<T>(url, {
    ...options,
    method: "POST",
    body: formData,
  });
};

export { apiClient };

let activeHealthCheckPromise: Promise<{
  connected: boolean;
  status: string;
  service: string;
  database: string;
}> | null = null;
let lastHealthCheckTime = 0;
let lastHealthCheckResult: {
  connected: boolean;
  status: string;
  service: string;
  database: string;
} | null = null;

const HEALTH_CHECK_TTL = 60000; // 60s cache TTL to prevent rapid polling

export async function checkBackendHealth(force = false): Promise<{
  connected: boolean;
  status: string;
  service: string;
  database: string;
}> {
  const now = Date.now();
  if (!force && lastHealthCheckResult && now - lastHealthCheckTime < HEALTH_CHECK_TTL) {
    return lastHealthCheckResult;
  }
  if (activeHealthCheckPromise) {
    return activeHealthCheckPromise;
  }

  activeHealthCheckPromise = (async () => {
    try {
      const res = await apiClientFn<{ status?: string; service?: string; database?: string; success?: boolean }>("/api/health", {
        timeoutMs: 8000,
      });
      const isOk = res.status === "ok" || res.status === "healthy" || res.success === true;
      const result = {
        connected: isOk,
        status: isOk ? "ok" : (res.status || "offline"),
        service: res.service || "SARATHI",
        database: res.database || (isOk ? "connected" : "disconnected"),
      };
      lastHealthCheckTime = Date.now();
      lastHealthCheckResult = result;
      return result;
    } catch {
      const result = {
        connected: false,
        status: "offline",
        service: "SARATHI",
        database: "disconnected",
      };
      lastHealthCheckTime = Date.now();
      lastHealthCheckResult = result;
      return result;
    } finally {
      activeHealthCheckPromise = null;
    }
  })();

  return activeHealthCheckPromise;
}

