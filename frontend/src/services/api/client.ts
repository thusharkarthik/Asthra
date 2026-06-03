import { apiConfig } from "@/services/api/config";
import { generateRequestId } from "@/lib/utils";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = RequestInit & {
  requestId?: string;
  authToken?: string;
  json?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  }
  headers.set("X-Request-ID", options.requestId ?? generateRequestId());
  if (options.authToken) {
    headers.set("Authorization", `Bearer ${options.authToken}`);
  }

  const response = await fetch(`${apiConfig.gatewayUrl}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : `API request failed: ${response.status}`;
    throw new ApiError(detail, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
