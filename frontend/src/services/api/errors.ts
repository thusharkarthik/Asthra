export type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
    public code = "api_error"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiErrorPayload(payload: unknown, status: number) {
  const fallback = status === 401 ? "Your session may have expired. Please sign in again." : `API request failed with status ${status}.`;
  if (!payload || typeof payload !== "object") {
    return { message: fallback, code: status === 401 ? "unauthorized" : "api_error" };
  }
  const data = payload as ApiErrorPayload;
  const nestedMessage = typeof data.error?.message === "string" ? data.error.message : undefined;
  const nestedCode = typeof data.error?.code === "string" ? data.error.code : undefined;
  const detail = typeof data.detail === "string" ? data.detail : undefined;
  const message = typeof data.message === "string" ? data.message : undefined;
  return {
    message: nestedMessage ?? detail ?? message ?? fallback,
    code: nestedCode ?? (status === 401 ? "unauthorized" : "api_error")
  };
}

export function friendlyNetworkError(error: unknown) {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error && error.name === "AbortError"
    ? "The request timed out. Please try again."
    : "Unable to reach Asthra services. Check that the API Gateway is running.";
  return new ApiError(message, 0, undefined, "network_error");
}
