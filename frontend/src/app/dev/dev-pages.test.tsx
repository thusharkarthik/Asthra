import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DevPage from "@/app/dev/page";
import DeploymentsPage from "@/app/dev/deployments/page";
import RepositoriesPage from "@/app/dev/repositories/page";
import ServicesPage from "@/app/dev/services/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function mockDevFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/repositories")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, project_id: 3, name: "asthra-api", provider: "github", default_branch: "main" }]), { status: 200 });
    }
    if (url.includes("/deployments")) {
      return new Response(JSON.stringify([{ id: 2, workspace_id: 2, environment_id: 1, service_id: 4, version: "2026.06.04", status: "success" }]), { status: 200 });
    }
    if (url.includes("/releases")) {
      return new Response(JSON.stringify([{ id: 3, workspace_id: 2, service_id: 4, version: "v1.2.0", status: "planned" }]), { status: 200 });
    }
    if (url.includes("/services")) {
      return new Response(JSON.stringify([{ id: 4, workspace_id: 2, repository_id: 1, name: "gateway-service", description: "Routes platform traffic", lifecycle_status: "active" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Dev frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ accessToken: "token", currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true }, isAuthenticated: true, hasHydrated: true });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockDevFetch();
  });

  it("renders Dev dashboard", async () => {
    renderWithQuery(<DevPage />);
    expect(screen.getByRole("heading", { name: "Dev" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("gateway-service")).toBeInTheDocument());
  });

  it("renders repositories page", async () => {
    renderWithQuery(<RepositoriesPage />);
    expect(screen.getByRole("heading", { name: "Repositories" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("asthra-api")).toBeInTheDocument());
  });

  it("renders deployments page", async () => {
    renderWithQuery(<DeploymentsPage />);
    expect(screen.getByRole("heading", { name: "Deployments" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("2026.06.04")).toBeInTheDocument());
  });

  it("renders service catalog page", async () => {
    renderWithQuery(<ServicesPage />);
    expect(screen.getByRole("heading", { name: "Service Catalog" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("gateway-service")).toBeInTheDocument());
  });
});
