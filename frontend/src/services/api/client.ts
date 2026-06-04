import { apiConfig } from "@/services/api/config";
import { generateRequestId } from "@/lib/utils";
import { ApiError, friendlyNetworkError, parseApiErrorPayload } from "@/services/api/errors";

export { ApiError } from "@/services/api/errors";

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

  let response: Response;
  try {
    response = await fetch(`${apiConfig.gatewayUrl}${path}`, {
      ...options,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body
    });
  } catch (error) {
    throw friendlyNetworkError(error);
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    const parsed = parseApiErrorPayload(payload, response.status);
    throw new ApiError(parsed.message, response.status, payload, parsed.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
