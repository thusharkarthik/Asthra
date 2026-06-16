import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsthraShell } from "@/layouts/asthra-shell";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useUIStore } from "@/stores/ui-store";
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
    useUIStore.setState({ isAssistantOpen: true, isSearchOpen: false, isCommandPaletteOpen: false });
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
    expect(screen.getByLabelText("Hide assistant")).toBeInTheDocument();
  });

  it("toggles the assistant panel from the header", () => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });

    renderShell(<div>Test content</div>);
    fireEvent.click(screen.getByLabelText("Hide assistant"));

    expect(screen.queryByLabelText(/ai assistant/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Show assistant")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Show assistant"));
    expect(screen.getByLabelText(/ai assistant/i)).toBeInTheDocument();
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
