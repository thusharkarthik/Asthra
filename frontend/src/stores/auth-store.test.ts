import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: true,
      error: null
    });
    vi.restoreAllMocks();
  });

  it("logs in and stores the current user", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/auth/login")) {
        return new Response(JSON.stringify({ access_token: "test-token", token_type: "bearer" }), { status: 200 });
      }
      if (url.includes("/auth/me")) {
        return new Response(
          JSON.stringify({ id: 1, email: "user@example.com", full_name: "Test User", is_active: true }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    await useAuthStore.getState().login({ email: "user@example.com", password: "password123" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().accessToken).toBe("test-token");
    expect(useAuthStore.getState().currentUser?.email).toBe("user@example.com");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("clears auth state on logout", () => {
    useAuthStore.setState({
      accessToken: "test-token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
