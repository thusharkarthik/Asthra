import { apiConfig } from "@/services/api/config";
import { generateRequestId } from "@/lib/utils";

export type ApiRequestOptions = RequestInit & {
  requestId?: string;
  authToken?: string;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  headers.set("X-Request-ID", options.requestId ?? generateRequestId());
  if (options.authToken) {
    headers.set("Authorization", `Bearer ${options.authToken}`);
  }

  const response = await fetch(`${apiConfig.gatewayUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
