import { mockApiRequest } from "./mock-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

function shouldUseMockApi() {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("gymflow_token");
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  if (shouldUseMockApi()) {
    return mockApiRequest<T>(endpoint, options);
  }

  const method = options.method || "GET";
  const token = options.token === undefined ? getStoredToken() : options.token;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}
