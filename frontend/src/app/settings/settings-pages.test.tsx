import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/settings/page";
import AccountSettingsPage from "@/app/settings/account/page";
import ApiKeysSettingsPage from "@/app/settings/api-keys/page";
import AdministrationSettingsPage from "@/app/settings/administration/page";
import OrganizationsSettingsPage from "@/app/settings/organizations/page";
import PermissionsSettingsPage from "@/app/settings/permissions/page";
import PreferencesSettingsPage from "@/app/settings/preferences/page";
import RolesSettingsPage from "@/app/settings/roles/page";
import TeamsSettingsPage from "@/app/settings/teams/page";
import WorkspaceSettingsPage from "@/app/settings/workspace/page";
import { MemberDetailView, MembersView, OrganizationDetailView, ProjectDetailView, TeamDetailView, WorkspaceDetailView } from "@/components/settings/settings-admin-views";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra", description: "Platform org", is_active: true }]),
    listWorkspaces: vi.fn(async () => [{ id: 2, organization_id: 1, name: "Platform", description: "Default workspace", is_active: true }]),
    listProjects: vi.fn(async () => [{ id: 3, workspace_id: 2, name: "Frontend", status: "active", owner_id: 1, is_active: true }]),
    listApiKeys: vi.fn(async () => []),
    listRoles: vi.fn(async () => [{ id: 4, name: "Admin", scope: "organization", organization_id: 1, is_active: true }]),
    listPermissions: vi.fn(async () => [{ id: 5, code: "workspace.manage", name: "Manage workspace", is_active: true }]),
    listOrganizationMembers: vi.fn(async () => [{ id: 10, organization_id: 1, user_id: 1, role_id: 4, member_role: "owner", created_at: "2026-01-01T00:00:00Z" }]),
    listWorkspaceMembers: vi.fn(async () => [{ id: 11, workspace_id: 2, user_id: 1, role_id: 4, member_role: "admin", created_at: "2026-01-01T00:00:00Z" }]),
    listInvitations: vi.fn(async () => [{ id: 12, email: "invite@example.com", organization_id: 1, workspace_id: 2, status: "pending", invited_by_id: 1, expires_at: "2026-01-08T00:00:00Z" }]),
    listTeams: vi.fn(async () => [{ id: 6, workspace_id: 2, name: "Engineering", description: "Build team", created_by_id: 1, is_active: true }]),
    getTeam: vi.fn(async () => ({ id: 6, workspace_id: 2, name: "Engineering", description: "Build team", created_by_id: 1, is_active: true })),
    listTeamMembers: vi.fn(async () => [{ id: 13, team_id: 6, user_id: 1, role_id: 4, member_role: "lead" }]),
    getUser: vi.fn(async () => ({ id: 1, email: "user@example.com", full_name: "Test User", is_active: true })),
    listUserRoles: vi.fn(async () => [{ id: 14, user_id: 1, role_id: 4 }]),
    listRolePermissions: vi.fn(async () => [{ id: 15, role_id: 4, permission_id: 5 }]),
    createOrganization: vi.fn(),
    createWorkspace: vi.fn(),
    createProject: vi.fn(),
    createInvitation: vi.fn(),
    createTeam: vi.fn(),
    deleteTeam: vi.fn(),
    createRole: vi.fn(),
    deleteRole: vi.fn(),
    createPermission: vi.fn(),
    deletePermission: vi.fn(),
    assignUserRole: vi.fn(),
    addTeamMember: vi.fn(),
    updateProject: vi.fn()
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

  it("renders administration dashboard", async () => {
    renderWithQuery(<AdministrationSettingsPage />);
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
    expect(await screen.findByText("Organizations")).toBeInTheDocument();
  });

  it("renders organization tabs", async () => {
    renderWithQuery(<OrganizationDetailView organizationId={1} />);
    expect(await screen.findByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Permissions")).toBeInTheDocument();
  });

  it("renders workspace tabs", async () => {
    renderWithQuery(<WorkspaceDetailView workspaceId={2} />);
    expect(await screen.findByText("Teams")).toBeInTheDocument();
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
  });

  it("renders members without raw-only columns", async () => {
    renderWithQuery(<MembersView workspaceId={2} />);
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Change Role")).toBeInTheDocument();
  });

  it("renders member detail", async () => {
    renderWithQuery(<MemberDetailView userId={1} />);
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Activity Placeholder")).toBeInTheDocument();
  });

  it("renders teams and team detail", async () => {
    renderWithQuery(<TeamsSettingsPage />);
    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    renderWithQuery(<TeamDetailView teamId={6} />);
    expect(await screen.findByText("Assign Member")).toBeInTheDocument();
  });

  it("renders project ownership", async () => {
    renderWithQuery(<ProjectDetailView projectId={3} />);
    expect(await screen.findByText("Owner Email")).toBeInTheDocument();
    expect(screen.getByText("Change Owner")).toBeInTheDocument();
  });

  it("renders roles and permissions", async () => {
    renderWithQuery(<RolesSettingsPage />);
    expect(await screen.findByText("Admin")).toBeInTheDocument();
    renderWithQuery(<PermissionsSettingsPage />);
    expect(await screen.findByText("Permission matrix")).toBeInTheDocument();
  });
});
