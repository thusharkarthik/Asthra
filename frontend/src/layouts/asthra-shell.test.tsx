import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsthraShell } from "@/layouts/asthra-shell";
import { PlatformContextProvider } from "@/context/platformContext";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; searchParams: string; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

vi.mock("@/services/api/core-api", () => ({
  coreApi: {
    currentUser: vi.fn(async () => ({ id: 1, email: "user@example.com", full_name: "Test User", is_active: true })),
    getContextVersion: vi.fn(async () => ({
      user_id: 1,
      organization_id: 1,
      organization_version: 1,
      workspace_id: 2,
      workspace_version: 1,
      project_id: 3,
      project_version: 1,
      access_version: 1,
      generated_at: "2026-06-22T00:00:00Z"
    })),
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra" }])
  }
}));

vi.mock("@/services/api/workspace-api", () => ({
  workspaceApi: {
    listWorkspaces: vi.fn(async () => [{ id: 2, organization_id: 1, name: "Platform" }])
  }
}));

vi.mock("@/services/api/project-api", () => ({
  projectApi: {
    listProjects: vi.fn(async () => [{ id: 3, workspace_id: 2, name: "Frontend" }])
  }
}));

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    getCurrentPermissions: vi.fn(async () => ({ permission_codes: [], roles: [], scope: { scope_type: "project", scope_id: 3 } }))
  }
}));

function renderShell(children: React.ReactNode) {
  return render(
    <QueryProvider>
      <PlatformContextProvider>
        <AsthraShell>{children}</AsthraShell>
      </PlatformContextProvider>
    </QueryProvider>
  );
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
    navigationMock.searchParams = "";
    useUIStore.setState({ isAssistantOpen: false, isSearchOpen: false, isCommandPaletteOpen: false });
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
    expect(screen.getByLabelText("Open assistant")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: /workspace bottom dock/i })).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByText("Platform workspace")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Organization")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Project")).toBeInTheDocument();
    expect(screen.getByText("Search Asthra")).toBeInTheDocument();
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Help")).toBeInTheDocument();
    expect(screen.getByLabelText("User menu")).toBeInTheDocument();
  });

  it("renders the bottom dock progress indicator without shifting layout", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    renderShell(<div>Test content</div>);

    const progress = screen.getByTestId("bottom-dock-progress");
    expect(progress).toHaveClass("absolute");
    expect(progress.querySelector(".animate-bottom-dock-progress")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: /workspace bottom dock/i })).toHaveClass("relative");
  });

  it("toggles the floating assistant drawer", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    renderShell(<div>Test content</div>);
    fireEvent.click(screen.getByLabelText("Open assistant"));

    expect(screen.getByLabelText(/ai assistant/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Close assistant")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close assistant"));
    expect(screen.queryByLabelText(/ai assistant/i)).not.toBeInTheDocument();
  });

  it("uses separate scroll containers for navigation and main content", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    const { container } = renderShell(<div>Test content</div>);

    expect(container.querySelector("aside .overflow-y-auto")).toBeInTheDocument();
    expect(container.querySelector("main.overflow-y-auto")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: /workspace bottom dock/i })).toHaveClass("shrink-0");
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

  it("opens the command palette with Ctrl+K", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    renderShell(<div>Test content</div>);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to flow/i })).toBeInTheDocument();
  });

  it("opens the notification center", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useNotificationStore.getState().addNotification({ id: "shell-test", type: "approval", title: "Approval needed", message: "Review a request", unread: true, created_at: "2026-06-04T10:00:00.000Z" });

    renderShell(<div>Test content</div>);
    fireEvent.click(screen.getByLabelText("Notifications"));

    expect(screen.getByRole("dialog", { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByText("Approval needed")).toBeInTheDocument();
  });
});
