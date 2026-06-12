import { mockApiRequest } from "./mock-api";

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

/**
 * GymFlow portfolio/demo mode.
 *
 * This frontend is deployed without the backend.
 * Every API call is routed to the in-browser mock API.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  return mockApiRequest<T>(endpoint, options);
}
