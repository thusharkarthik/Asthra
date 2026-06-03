import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsthraShell } from "@/layouts/asthra-shell";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

function renderShell(children: React.ReactNode) {
  return render(<QueryProvider><AsthraShell>{children}</AsthraShell></QueryProvider>);
}

describe("AsthraShell", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
    navigationMock.push.mockClear();
    navigationMock.replace.mockClear();
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }],
      projects: [{ id: 3, workspace_id: 2, name: "Frontend" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
  });

  it("renders shell regions and child content", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    renderShell(<div>Test content</div>);

    expect(screen.getAllByText("Asthra").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByLabelText(/ai assistant/i)).toBeInTheDocument();
  });

  it("redirects protected routes without auth", () => {
    useAuthStore.setState({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      hasHydrated: true
    });

    renderShell(<div>Protected content</div>);

    expect(navigationMock.replace).toHaveBeenCalledWith("/login");
  });
});
