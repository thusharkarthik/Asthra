import { describe, expect, it } from "vitest";
import { ApiError, friendlyNetworkError, parseApiErrorPayload } from "@/services/api/errors";

describe("API error helpers", () => {
  it("parses standard error payloads", () => {
    const parsed = parseApiErrorPayload({ error: { code: "not_found", message: "Record not found" } }, 404);
    expect(parsed).toEqual({ code: "not_found", message: "Record not found" });
  });

  it("uses friendly unauthorized fallback", () => {
    const parsed = parseApiErrorPayload({}, 401);
    expect(parsed.code).toBe("unauthorized");
    expect(parsed.message).toContain("session");
  });

  it("wraps network errors", () => {
    const error = friendlyNetworkError(new Error("fetch failed"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("network_error");
  });
});
