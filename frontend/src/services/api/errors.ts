export type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
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

function parseValidationDetail(detail: unknown) {
  if (!Array.isArray(detail)) return undefined;
  const messages = detail
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const error = item as { loc?: unknown; msg?: unknown; type?: unknown };
      const location = Array.isArray(error.loc)
        ? error.loc.filter((part) => part !== "body").join(".")
        : undefined;
      const message = typeof error.msg === "string" ? error.msg : undefined;
      const type = typeof error.type === "string" ? error.type : undefined;
      if (!location && !message) return null;
      return [location, message ?? type].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  return messages.length ? `Validation failed: ${messages.join("; ")}` : undefined;
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
  const validationDetail = parseValidationDetail(data.detail) ?? parseValidationDetail(data.error?.details);
  const message = typeof data.message === "string" ? data.message : undefined;
  return {
    message: validationDetail ?? nestedMessage ?? detail ?? message ?? fallback,
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
