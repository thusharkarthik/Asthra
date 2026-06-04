import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FavoritesPage from "@/app/favorites/page";
import CrudChecklistPage from "@/app/platform/crud-checklist/page";
import PlatformHealthPage from "@/app/platform/health/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

describe("platform beta pages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ accessToken: "token", currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true }, isAuthenticated: true, hasHydrated: true });
  });

  it("renders platform health page with mocked gateway response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: {
        gateway: { service: "asthra-api-gateway", version: "0.1.0", environment: "test", status: "ready" },
        status: "healthy",
        services: [{ name: "core-service", route_prefix: "core", status: "healthy", health_url: "http://core/health" }]
      }
    }), { status: 200 }));

    renderWithQuery(<PlatformHealthPage />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Platform Health" })).toBeInTheDocument());
    expect(screen.getByText("core-service")).toBeInTheDocument();
  });

  it("renders favorites page", () => {
    render(<FavoritesPage />);

    expect(screen.getByRole("heading", { name: "Favorites" })).toBeInTheDocument();
    expect(screen.getByText("Platform beta guide")).toBeInTheDocument();
  });

  it("renders CRUD checklist page", () => {
    render(<CrudChecklistPage />);

    expect(screen.getByRole("heading", { name: "CRUD Checklist" })).toBeInTheDocument();
    expect(screen.getByText("Flow")).toBeInTheDocument();
    expect(screen.getByText("Delete/Archive")).toBeInTheDocument();
  });
});
