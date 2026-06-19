import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import AccessControlPage from "@/app/settings/access-control/page";
import AccessControlMappingPage from "@/app/settings/access-control/mapping/page";
import AccessControlPermissionsPage from "@/app/settings/access-control/permissions/page";
import { MemberDetailView, MembersView, OrganizationDetailView, ProjectDetailView, TeamDetailView, WorkspaceDetailView } from "@/components/settings/settings-admin-views";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    listOrganizations: vi.fn(async () => [{ id: 1, name: "Asthra", description: "Platform org", is_active: true }]),
    listWorkspaces: vi.fn(async () => [{ id: 2, organization_id: 1, name: "Platform", description: "Default workspace", is_active: true }]),
    listProjects: vi.fn(async () => [
      { id: 3, workspace_id: 2, name: "Frontend", status: "active", owner_id: 1, is_active: true },
      { id: 7, workspace_id: 2, name: "Unowned Project", status: "active", owner_id: null, is_active: true }
    ]),
    listApiKeys: vi.fn(async () => []),
    listRoles: vi.fn(async () => [
      { id: 1, name: "Platform Owner", key: "platform_owner", scope: "platform", organization_id: null, is_system: true, is_editable: false, is_active: true, permission_preset: "platform:platform_owner:placeholder" },
      { id: 2, name: "Platform Admin", key: "platform_admin", scope: "platform", organization_id: null, is_system: true, is_editable: false, is_active: true, permission_preset: "platform:platform_admin:placeholder" },
      { id: 4, name: "Workspace Admin", key: "workspace_admin", scope: "workspace", organization_id: 1, is_system: true, is_editable: false, is_active: true, permission_preset: "workspace:workspace_admin:placeholder" },
      { id: 5, name: "Workspace Viewer", key: "workspace_viewer", scope: "workspace", organization_id: 1, is_system: true, is_editable: false, is_active: true, permission_preset: "workspace:workspace_viewer:placeholder" },
      { id: 6, name: "Product Owner", key: "product_owner", scope: "functional", organization_id: 1, is_system: true, is_editable: false, is_active: true, permission_preset: "functional:product_owner:placeholder" },
      { id: 8, name: "Project Manager", key: "project_manager", scope: "project", organization_id: null, is_system: true, is_editable: false, is_active: true, permission_preset: "project:project_manager:placeholder" },
      { id: 9, name: "Project Contributor", key: "project_contributor", scope: "project", organization_id: null, is_system: true, is_editable: false, is_active: true, permission_preset: "project:project_contributor:placeholder" }
    ]),
    listRoleTemplates: vi.fn(async () => [
      { name: "Platform Owner", key: "platform_owner", scope: "platform", description: "Full platform administration.", permission_patterns: ["*"], is_system: true, is_editable: false },
      { name: "Project Manager", key: "project_manager", scope: "project", description: "Manage delivery.", permission_patterns: ["flow.work_item.*"], is_system: true, is_editable: false }
    ]),
    listPermissions: vi.fn(async () => [
      { id: 5, code: "settings.workspace.manage", name: "Manage workspace", module: "settings", scope: "workspace", status: "active", is_active: true },
      { id: 6, code: "flow.work_item.view", name: "View work items", module: "flow", scope: "project", status: "active", is_active: true },
      { id: 7, code: "flow.work_item.create", name: "Create work items", module: "flow", scope: "project", status: "active", is_active: true },
      { id: 8, code: "docs.page.edit", name: "Edit Docs pages", module: "docs", scope: "workspace", status: "active", is_active: true },
      { id: 9, code: "automation.rule.manage", name: "Manage automation rules", module: "automation", scope: "workspace", status: "active", is_active: true }
    ]),
    listOrganizationMembers: vi.fn(async () => [{ id: 10, organization_id: 1, user_id: 1, role_id: 4, member_role: "owner", created_at: "2026-01-01T00:00:00Z" }]),
    listWorkspaceMembers: vi.fn(async () => [{ id: 11, workspace_id: 2, user_id: 1, role_id: 4, member_role: "admin", created_at: "2026-01-01T00:00:00Z" }]),
    listInvitations: vi.fn(async () => [{ id: 12, email: "invite@example.com", organization_id: 1, workspace_id: 2, status: "pending", invited_by_id: 1, expires_at: "2026-01-08T00:00:00Z" }]),
    listTeams: vi.fn(async () => [{ id: 6, workspace_id: 2, name: "Engineering", description: "Build team", created_by_id: 1, is_active: true }]),
    getTeam: vi.fn(async () => ({ id: 6, workspace_id: 2, name: "Engineering", description: "Build team", created_by_id: 1, is_active: true })),
    listTeamMembers: vi.fn(async () => [{ id: 13, team_id: 6, user_id: 1, role_id: 4, member_role: "lead" }]),
    getUser: vi.fn(async () => ({ id: 1, email: "user@example.com", full_name: "Test User", is_active: true })),
    listUserRoles: vi.fn(async () => [{ id: 14, user_id: 1, role_id: 4 }]),
    listRolePermissions: vi.fn(async (_token: string, roleId: number) => roleId === 4 ? [{ id: 15, role_id: 4, permission_id: 5 }] : roleId === 8 ? [{ id: 16, role_id: 8, permission_id: 6 }, { id: 17, role_id: 8, permission_id: 7 }] : []),
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
    removeUserRole: vi.fn(),
    addRolePermission: vi.fn(),
    removeRolePermission: vi.fn(),
    replaceRolePermissions: vi.fn(),
    addTeamMember: vi.fn(),
    updateProject: vi.fn(),
    updateOrganizationMember: vi.fn(async () => ({ id: 10, organization_id: 1, user_id: 1, role_id: 4, member_role: "admin" })),
    updateWorkspaceMember: vi.fn(async () => ({ id: 11, workspace_id: 2, user_id: 1, role_id: 4, member_role: "admin" })),
    removeOrganizationMember: vi.fn(async () => undefined),
    removeWorkspaceMember: vi.fn(async () => undefined),
    resendInvitation: vi.fn(async () => ({ id: 12, email: "invite@example.com", organization_id: 1, workspace_id: 2, status: "pending", invited_by_id: 1 })),
    revokeInvitation: vi.fn(async () => ({ id: 12, email: "invite@example.com", organization_id: 1, workspace_id: 2, status: "cancelled", invited_by_id: 1 })),
    listNotifications: vi.fn(async () => []),
    markNotificationRead: vi.fn()
  }
}));

import { settingsApi } from "@/services/api/settings-api";

function renderWithQuery(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("Settings frontend screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }],
      projects: [
        { id: 3, workspace_id: 2, name: "Frontend" },
        { id: 7, workspace_id: 2, name: "Unowned Project", owner_id: null }
      ],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
  });

  it("renders operational settings page", async () => {
    renderWithQuery(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(await screen.findByText("Operational setup flow")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toBeInTheDocument();
    expect(screen.getByText("Back to Home")).toBeInTheDocument();
    expect(screen.getByText("Administration hierarchy")).toBeInTheDocument();
    expect(screen.getByText("Owners must come from workspace members.")).toBeInTheDocument();
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
    expect((await screen.findAllByText("Organizations")).length).toBeGreaterThan(0);
    expect(screen.getByText("Back to Settings")).toBeInTheDocument();
  });

  it("renders organization tabs", async () => {
    renderWithQuery(<OrganizationDetailView organizationId={1} />);
    expect(await screen.findByText("Organization")).toBeInTheDocument();
    expect(screen.getAllByText("Platform org").length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Members")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Permissions").length).toBeGreaterThan(0);
    expect(screen.getByText("Back to Organizations")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toHaveTextContent(/Settings.*Organizations.*Asthra/);
  });

  it("renders workspace tabs", async () => {
    renderWithQuery(<WorkspaceDetailView workspaceId={2} />);
    expect(await screen.findByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Organization: Asthra")).toBeInTheDocument();
    expect((await screen.findAllByText("Teams")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
    expect(screen.getByText("Back to Workspaces")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toHaveTextContent(/Settings.*Workspaces.*Platform/);
  });

  it("renders members without raw-only columns", async () => {
    renderWithQuery(<MembersView workspaceId={2} />);
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Change Role")).toBeInTheDocument();
    expect(screen.getAllByText("Workspace: Platform").length).toBeGreaterThan(0);
    expect(screen.getByText("Organization: Asthra")).toBeInTheDocument();
    expect(screen.getByText("Back to Workspace")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toHaveTextContent(/Settings.*Workspaces.*Platform.*Members/);
  });

  it("supports member search filters sort and invite actions", async () => {
    renderWithQuery(<MembersView workspaceId={2} />);

    expect((await screen.findAllByText("invite@example.com")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search name or email"), { target: { value: "invite" } });
    expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    expect(screen.getAllByText("invite@example.com").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByPlaceholderText("Search name or email"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Role filter"), { target: { value: "workspace_admin" } });
    expect(screen.getByText("Test User")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Role filter"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Sort members"), { target: { value: "email" } });
    expect(screen.getByLabelText("Sort members")).toHaveValue("email");

    fireEvent.click(screen.getByRole("button", { name: "Resend Invite" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel Invite" }));
    await waitFor(() => expect(settingsApi.resendInvitation).toHaveBeenCalledWith("token", 12));
    expect(settingsApi.revokeInvitation).toHaveBeenCalledWith("token", 12);
  });

  it("validates invite email and changes member role", async () => {
    renderWithQuery(<MembersView workspaceId={2} />);

    fireEvent.click((await screen.findAllByRole("button", { name: "Invite Member" }))[0]);
    expect(screen.getByRole("group", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Functional" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Platform" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("teammate@example.com"), { target: { value: "bad-email" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Invite Member" })[1]);
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("teammate@example.com"), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Invite Member" })[1]);
    await waitFor(() => expect(settingsApi.createInvitation).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    fireEvent.change(screen.getByLabelText("Change member role"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign Role" }));
    await waitFor(() => expect(settingsApi.updateWorkspaceMember).toHaveBeenCalled());
  });

  it("hides member management actions for low roles", async () => {
    vi.mocked(settingsApi.listWorkspaceMembers).mockResolvedValueOnce([{ id: 11, workspace_id: 2, user_id: 1, role_id: null, member_role: "viewer", created_at: "2026-01-01T00:00:00Z" }]);
    renderWithQuery(<MembersView workspaceId={2} />);

    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite Member" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Role" })).not.toBeInTheDocument();
    expect(screen.getByText("Limited access")).toBeInTheDocument();
  });

  it("renders organization member context", async () => {
    renderWithQuery(<MembersView organizationId={1} />);
    expect(await screen.findByText("Test User")).toBeInTheDocument();
    expect(screen.getAllByText("Organization").length).toBeGreaterThan(0);
    expect(screen.getByText("Back to Organization")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toHaveTextContent(/Settings.*Organizations.*Asthra.*Members/);
  });

  it("renders member detail", async () => {
    renderWithQuery(<MemberDetailView userId={1} />);
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Current Roles")).toBeInTheDocument();
    expect(screen.getByText("Inherited Permissions Count")).toBeInTheDocument();
    expect(screen.getByLabelText("Assign member role")).toBeInTheDocument();
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

  it("renders project ownership help when no owner is assigned", async () => {
    renderWithQuery(<ProjectDetailView projectId={7} />);
    expect(await screen.findByText("No owner assigned yet.")).toBeInTheDocument();
    expect(screen.getAllByText("Owners should be selected from workspace members.").length).toBeGreaterThan(0);
    expect(screen.getByText("Back to Projects")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Settings breadcrumbs" })).toHaveTextContent(/Settings.*Projects.*Unowned Project/);
  });

  it("renders roles and permissions", async () => {
    renderWithQuery(<RolesSettingsPage />);
    expect(await screen.findByRole("heading", { name: "Access Control" })).toBeInTheDocument();
    expect(screen.getByText("Role Based Access Control")).toBeInTheDocument();
    expect(await screen.findByText("Workspace Admin")).toBeInTheDocument();
    expect(screen.getByText("Permissions Count")).toBeInTheDocument();

    cleanup();
    renderWithQuery(<PermissionsSettingsPage />);
    expect(await screen.findByRole("heading", { name: "Access Control" })).toBeInTheDocument();
    expect(await screen.findByText("Manage workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Permission module filter")).toBeInTheDocument();
  });

  it("renders unified access control pages", async () => {
    renderWithQuery(<AccessControlPage />);
    expect(await screen.findByText("Role Mapping")).toBeInTheDocument();
    expect(await screen.findByText("System Role")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Custom Role" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Permission" })).toBeInTheDocument();

    cleanup();
    renderWithQuery(<AccessControlPermissionsPage />);
    expect(await screen.findByText("Flow")).toBeInTheDocument();
    expect(await screen.findByText("Create work items")).toBeInTheDocument();

    cleanup();
    renderWithQuery(<AccessControlMappingPage />);
    expect(await screen.findByText("Role Mapping Matrix")).toBeInTheDocument();
    expect(await screen.findByText("View work items")).toBeInTheDocument();
    expect(await screen.findByText("Manage Role Permissions")).toBeInTheDocument();
    expect(screen.getAllByText("Manage Permissions").length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Platform Owner")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Project Manager").length).toBeGreaterThan(0);
  });
});
