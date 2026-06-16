import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";
import AccountSettingsPage from "@/app/settings/account/page";
import ApiKeysSettingsPage from "@/app/settings/api-keys/page";
import OrganizationsSettingsPage from "@/app/settings/organizations/page";
import PreferencesSettingsPage from "@/app/settings/preferences/page";
import WorkspaceSettingsPage from "@/app/settings/workspace/page";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra", description: "Platform org", is_active: true }]),
    listWorkspaces: vi.fn(async () => [{ id: 2, organization_id: 1, name: "Platform", description: "Default workspace", is_active: true }]),
    listProjects: vi.fn(async () => [{ id: 3, workspace_id: 2, name: "Frontend", status: "active", is_active: true }]),
    listApiKeys: vi.fn(async () => []),
    createOrganization: vi.fn(),
    createWorkspace: vi.fn(),
    createProject: vi.fn()
  }
}));

function renderWithQuery(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("Settings frontend screens", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }],
      projects: [{ id: 3, workspace_id: 2, name: "Frontend" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
  });

  it("renders operational settings page", async () => {
    renderWithQuery(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(await screen.findByText("Operational setup flow")).toBeInTheDocument();
  });

  it("renders account settings", () => {
    renderWithQuery(<AccountSettingsPage />);
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("renders workspace context settings", async () => {
    renderWithQuery(<WorkspaceSettingsPage />);
    expect(screen.getByRole("heading", { name: "Workspace Context" })).toBeInTheDocument();
    expect(await screen.findByText("Platform")).toBeInTheDocument();
  });

  it("renders organizations settings", async () => {
    renderWithQuery(<OrganizationsSettingsPage />);
    expect(screen.getByRole("heading", { name: "Organizations" })).toBeInTheDocument();
    expect(await screen.findByText("Asthra")).toBeInTheDocument();
  });

  it("renders API key settings", async () => {
    renderWithQuery(<ApiKeysSettingsPage />);
    expect(screen.getByRole("heading", { name: "API Keys" })).toBeInTheDocument();
    expect(await screen.findByText("No API keys yet")).toBeInTheDocument();
  });

  it("renders preferences placeholder", () => {
    renderWithQuery(<PreferencesSettingsPage />);
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Theme, notification, shell, and workspace preference controls.")).toBeInTheDocument();
  });
});
