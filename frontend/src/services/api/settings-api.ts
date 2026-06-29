import { apiRequest } from "@/services/api/client";
import type {
  ApiKeyRecord,
  CoreNotificationRecord,
  CoreUser,
  EffectiveAccessDebugRecord,
  CurrentUserPermissions,
  EffectivePermissionsRecord,
  InvitationRecord,
  PermissionGapRecord,
  PermissionInventoryRecord,
  Organization,
  OrganizationMember,
  PermissionRecord,
  PermissionRegistryItem,
  ProjectMembershipRecord,
  ProjectRecord,
  RoleAssignmentRecord,
  RoleMappingSuggestion,
  RoleRecord,
  RoleTemplateRecord,
  TeamMemberRecord,
  TeamRecord,
  UserRoleRecord,
  WorkspaceMember,
  WorkspaceRecord,
  PermissionRegistrySyncResult
} from "@/types/core";

const CORE_PREFIX = "/api/core/api/v1";

export type OrgSettingsRecord = {
  default_timezone: string | null;
  allow_public_invites: boolean;
  default_member_role: string;
  domain: string | null;
  website_url: string | null;
  industry: string | null;
  logo_url: string | null;
  primary_color: string | null;
  locale: string | null;
  date_format: string | null;
};

export type WorkspaceSettingsRecord = {
  default_project_visibility: string;
  default_timezone: string | null;
  enable_activity_feed: boolean;
  visibility: string;
  locale: string | null;
  enabled_modules: string[];
};

export type ActivityLogRecord = {
  id: number;
  created_at: string;
  updated_at: string;
  actor_user_id: number | null;
  organization_id: number | null;
  workspace_id: number | null;
  project_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  summary: string | null;
  event_metadata: Record<string, unknown> | null;
};

export type NamedCreatePayload = {
  name: string;
  description?: string;
};

export const settingsApi = {
  getMyProfile(token: string) {
    return apiRequest<CoreUser>(`${CORE_PREFIX}/me`, { method: "GET", authToken: token });
  },
  updateMyProfile(token: string, payload: { full_name?: string | null; job_title?: string | null; timezone?: string | null; locale?: string | null; avatar_url?: string | null }) {
    return apiRequest<CoreUser>(`${CORE_PREFIX}/me`, { method: "PATCH", authToken: token, json: payload });
  },
  changePassword(token: string, payload: { current_password: string; new_password: string }) {
    return apiRequest<void>(`${CORE_PREFIX}/me/change-password`, { method: "POST", authToken: token, json: payload });
  },
  deactivateMyAccount(token: string) {
    return apiRequest<void>(`${CORE_PREFIX}/me/deactivate`, { method: "POST", authToken: token });
  },
  getCurrentPermissions(token: string, params: { org_id?: number | null; workspace_id?: number | null; project_id?: number | null } = {}) {
    const search = new URLSearchParams();
    if (params.org_id) search.set("org_id", String(params.org_id));
    if (params.workspace_id) search.set("workspace_id", String(params.workspace_id));
    if (params.project_id) search.set("project_id", String(params.project_id));
    const query = search.toString();
    return apiRequest<CurrentUserPermissions>(`${CORE_PREFIX}/me/permissions${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  listOrganizations(token: string, params: { status?: string; include_inactive?: boolean } = {}) {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.include_inactive) search.set("include_inactive", "true");
    const query = search.toString();
    return apiRequest<Organization[]>(`${CORE_PREFIX}/organizations${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  onboardOrganization(token: string, payload: { name: string; description?: string | null }) {
    return apiRequest<Organization>(`${CORE_PREFIX}/organizations/onboard`, { method: "POST", authToken: token, json: payload });
  },
  platformOnboardOrganization(token: string, payload: { name: string; description?: string; owner_user_id: number }) {
    return apiRequest<Organization>(`${CORE_PREFIX}/organizations/platform-onboard`, { method: "POST", authToken: token, json: payload });
  },
  createOrganization(token: string, payload: NamedCreatePayload) {
    return apiRequest<Organization>(`${CORE_PREFIX}/organizations`, { method: "POST", authToken: token, json: payload });
  },
  getOrganization(token: string, organizationId: number) {
    return apiRequest<Organization>(`${CORE_PREFIX}/organizations/${organizationId}`, { method: "GET", authToken: token });
  },
  updateOrganization(token: string, organizationId: number, payload: Partial<NamedCreatePayload> & { is_active?: boolean }) {
    return apiRequest<Organization>(`${CORE_PREFIX}/organizations/${organizationId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteOrganization(token: string, organizationId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/organizations/${organizationId}`, { method: "DELETE", authToken: token });
  },
  listOrganizationMembers(token: string, organizationId: number) {
    return apiRequest<OrganizationMember[]>(`${CORE_PREFIX}/organizations/${organizationId}/members`, { method: "GET", authToken: token });
  },
  updateOrganizationMember(token: string, organizationId: number, userId: number, payload: { role_id?: number | null; member_role?: string | null }) {
    return apiRequest<OrganizationMember>(`${CORE_PREFIX}/organizations/${organizationId}/members/${userId}`, { method: "PATCH", authToken: token, json: payload });
  },
  removeOrganizationMember(token: string, organizationId: number, userId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/organizations/${organizationId}/members/${userId}`, { method: "DELETE", authToken: token });
  },

  listWorkspaces(token: string, params: { organization_id?: number | null; status?: string; include_inactive?: boolean } = {}) {
    const search = new URLSearchParams();
    if (params.organization_id) search.set("organization_id", String(params.organization_id));
    if (params.status) search.set("status", params.status);
    if (params.include_inactive) search.set("include_inactive", "true");
    const query = search.toString();
    return apiRequest<WorkspaceRecord[]>(`${CORE_PREFIX}/workspaces${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  createWorkspace(token: string, payload: NamedCreatePayload & { organization_id: number }) {
    return apiRequest<WorkspaceRecord>(`${CORE_PREFIX}/workspaces`, { method: "POST", authToken: token, json: payload });
  },
  getWorkspace(token: string, workspaceId: number) {
    return apiRequest<WorkspaceRecord>(`${CORE_PREFIX}/workspaces/${workspaceId}`, { method: "GET", authToken: token });
  },
  updateWorkspace(token: string, workspaceId: number, payload: Partial<NamedCreatePayload> & { is_active?: boolean }) {
    return apiRequest<WorkspaceRecord>(`${CORE_PREFIX}/workspaces/${workspaceId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteWorkspace(token: string, workspaceId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/workspaces/${workspaceId}`, { method: "DELETE", authToken: token });
  },
  listWorkspaceMembers(token: string, workspaceId: number) {
    return apiRequest<WorkspaceMember[]>(`${CORE_PREFIX}/workspaces/${workspaceId}/members`, { method: "GET", authToken: token });
  },
  updateWorkspaceMember(token: string, workspaceId: number, userId: number, payload: { role_id?: number | null; member_role?: string | null }) {
    return apiRequest<WorkspaceMember>(`${CORE_PREFIX}/workspaces/${workspaceId}/members/${userId}`, { method: "PATCH", authToken: token, json: payload });
  },
  removeWorkspaceMember(token: string, workspaceId: number, userId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE", authToken: token });
  },

  listProjects(token: string, params: { workspace_id?: number | null; status?: string; include_inactive?: boolean } = {}) {
    const search = new URLSearchParams();
    if (params.workspace_id) search.set("workspace_id", String(params.workspace_id));
    if (params.status) search.set("status", params.status);
    if (params.include_inactive) search.set("include_inactive", "true");
    const query = search.toString();
    return apiRequest<ProjectRecord[]>(`${CORE_PREFIX}/projects${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  createProject(token: string, payload: NamedCreatePayload & { workspace_id: number; status?: string }) {
    return apiRequest<ProjectRecord>(`${CORE_PREFIX}/projects`, { method: "POST", authToken: token, json: payload });
  },
  getProject(token: string, projectId: number) {
    return apiRequest<ProjectRecord>(`${CORE_PREFIX}/projects/${projectId}`, { method: "GET", authToken: token });
  },
  updateProject(token: string, projectId: number, payload: Partial<NamedCreatePayload> & { status?: string; owner_id?: number | null; is_active?: boolean }) {
    return apiRequest<ProjectRecord>(`${CORE_PREFIX}/projects/${projectId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteProject(token: string, projectId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/projects/${projectId}`, { method: "DELETE", authToken: token });
  },
  listProjectMembers(token: string, projectId: number) {
    return apiRequest<ProjectMembershipRecord[]>(`${CORE_PREFIX}/projects/${projectId}/members`, { method: "GET", authToken: token });
  },
  addProjectMember(token: string, projectId: number, payload: { user_id: number; role_id?: number | null; team_id?: number | null; status?: string }) {
    return apiRequest<ProjectMembershipRecord>(`${CORE_PREFIX}/projects/${projectId}/members`, { method: "POST", authToken: token, json: payload });
  },
  updateProjectMember(token: string, projectId: number, membershipId: number, payload: { role_id?: number | null; team_id?: number | null; status?: string }) {
    return apiRequest<ProjectMembershipRecord>(`${CORE_PREFIX}/projects/${projectId}/members/${membershipId}`, { method: "PATCH", authToken: token, json: payload });
  },
  removeProjectMember(token: string, projectId: number, membershipId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/projects/${projectId}/members/${membershipId}`, { method: "DELETE", authToken: token });
  },

  listTeams(token: string) {
    return apiRequest<TeamRecord[]>(`${CORE_PREFIX}/teams`, { method: "GET", authToken: token });
  },
  createTeam(token: string, payload: NamedCreatePayload & { workspace_id: number }) {
    return apiRequest<TeamRecord>(`${CORE_PREFIX}/teams`, { method: "POST", authToken: token, json: payload });
  },
  getTeam(token: string, teamId: number) {
    return apiRequest<TeamRecord>(`${CORE_PREFIX}/teams/${teamId}`, { method: "GET", authToken: token });
  },
  updateTeam(token: string, teamId: number, payload: Partial<NamedCreatePayload> & { is_active?: boolean }) {
    return apiRequest<TeamRecord>(`${CORE_PREFIX}/teams/${teamId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteTeam(token: string, teamId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/teams/${teamId}`, { method: "DELETE", authToken: token });
  },
  listTeamMembers(token: string, teamId: number) {
    return apiRequest<TeamMemberRecord[]>(`${CORE_PREFIX}/teams/${teamId}/members`, { method: "GET", authToken: token });
  },
  addTeamMember(token: string, teamId: number, payload: { user_id: number; role_id?: number | null; member_role?: string }) {
    return apiRequest<TeamMemberRecord>(`${CORE_PREFIX}/teams/${teamId}/members`, { method: "POST", authToken: token, json: payload });
  },
  updateTeamMember(token: string, teamId: number, membershipId: number, payload: { role_id?: number | null; member_role?: string; status?: string }) {
    return apiRequest<TeamMemberRecord>(`${CORE_PREFIX}/teams/${teamId}/members/${membershipId}`, { method: "PATCH", authToken: token, json: payload });
  },
  removeTeamMember(token: string, teamId: number, userId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/teams/${teamId}/members/${userId}`, { method: "DELETE", authToken: token });
  },

  listRoles(token: string) {
    return apiRequest<RoleRecord[]>(`${CORE_PREFIX}/roles`, { method: "GET", authToken: token });
  },
  listRoleTemplates(token: string) {
    return apiRequest<RoleTemplateRecord[]>(`${CORE_PREFIX}/role-templates`, { method: "GET", authToken: token });
  },
  createRole(token: string, payload: NamedCreatePayload & { organization_id?: number; scope?: string; is_system?: boolean; is_editable?: boolean }) {
    return apiRequest<RoleRecord>(`${CORE_PREFIX}/roles`, { method: "POST", authToken: token, json: payload });
  },
  updateRole(token: string, roleId: number, payload: Partial<NamedCreatePayload> & { scope?: string; is_active?: boolean }) {
    return apiRequest<RoleRecord>(`${CORE_PREFIX}/roles/${roleId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteRole(token: string, roleId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/roles/${roleId}`, { method: "DELETE", authToken: token });
  },
  listRolePermissions(token: string, roleId: number) {
    return apiRequest<Array<{ id: number; role_id: number; permission_id: number }>>(`${CORE_PREFIX}/roles/${roleId}/permissions`, { method: "GET", authToken: token });
  },
  addRolePermission(token: string, roleId: number, permissionId: number) {
    return apiRequest<{ id: number; role_id: number; permission_id: number }>(`${CORE_PREFIX}/roles/${roleId}/permissions`, {
      method: "POST",
      authToken: token,
      json: { permission_id: permissionId }
    });
  },
  removeRolePermission(token: string, roleId: number, permissionId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/roles/${roleId}/permissions/${permissionId}`, { method: "DELETE", authToken: token });
  },
  replaceRolePermissions(token: string, roleId: number, permissionIds: number[]) {
    return apiRequest<Array<{ id: number; role_id: number; permission_id: number }>>(`${CORE_PREFIX}/roles/${roleId}/permissions`, {
      method: "PUT",
      authToken: token,
      json: { permission_ids: permissionIds }
    });
  },
  listRoleAssignments(token: string, params: { user_id?: number; role_id?: number; scope_type?: string; scope_id?: number; status?: string } = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    });
    const query = search.toString();
    return apiRequest<RoleAssignmentRecord[]>(`${CORE_PREFIX}/role-assignments${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  createRoleAssignment(token: string, payload: { user_id: number; role_id: number; scope_type: string; scope_id?: number | null; status?: string }) {
    return apiRequest<RoleAssignmentRecord>(`${CORE_PREFIX}/role-assignments`, { method: "POST", authToken: token, json: payload });
  },
  updateRoleAssignment(token: string, assignmentId: number, payload: { role_id?: number; status?: string }) {
    return apiRequest<RoleAssignmentRecord>(`${CORE_PREFIX}/role-assignments/${assignmentId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deleteRoleAssignment(token: string, assignmentId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/role-assignments/${assignmentId}`, { method: "DELETE", authToken: token });
  },

  listPermissions(token: string) {
    return apiRequest<PermissionRecord[]>(`${CORE_PREFIX}/permissions`, { method: "GET", authToken: token });
  },
  listPermissionRegistry(token: string) {
    return apiRequest<PermissionRegistryItem[]>(`${CORE_PREFIX}/permissions/registry`, { method: "GET", authToken: token });
  },
  listPermissionGaps(token: string) {
    return apiRequest<PermissionGapRecord[]>(`${CORE_PREFIX}/permissions/gaps`, { method: "GET", authToken: token });
  },
  getPermissionInventory(token: string) {
    return apiRequest<PermissionInventoryRecord>(`${CORE_PREFIX}/access-control/permission-inventory`, { method: "GET", authToken: token });
  },
  previewPermissionRegistrySync(token: string) {
    return apiRequest<PermissionRegistrySyncResult>(`${CORE_PREFIX}/access-control/permission-registry/sync-preview`, { method: "GET", authToken: token });
  },
  syncPermissionRegistry(token: string) {
    return apiRequest<PermissionRegistrySyncResult>(`${CORE_PREFIX}/access-control/permission-registry/sync`, { method: "POST", authToken: token });
  },
  listRoleMappingSuggestions(token: string) {
    return apiRequest<RoleMappingSuggestion[]>(`${CORE_PREFIX}/access-control/role-mapping-suggestions`, { method: "GET", authToken: token });
  },
  getEffectiveAccessDebug(token: string, params: { user_id: number; scope_type?: string; scope_id?: number | null; action_keys?: string[] }) {
    const search = new URLSearchParams();
    search.set("user_id", String(params.user_id));
    if (params.scope_type) search.set("scope_type", params.scope_type);
    if (params.scope_id) search.set("scope_id", String(params.scope_id));
    (params.action_keys ?? []).forEach((actionKey) => search.append("action_keys", actionKey));
    return apiRequest<EffectiveAccessDebugRecord>(`${CORE_PREFIX}/access-control/debug/effective-access?${search.toString()}`, { method: "GET", authToken: token });
  },
  createPermission(token: string, payload: { code: string; name: string; description?: string; module?: string; scope?: string; status?: string }) {
    return apiRequest<PermissionRecord>(`${CORE_PREFIX}/permissions`, { method: "POST", authToken: token, json: payload });
  },
  updatePermission(token: string, permissionId: number, payload: { code?: string; name?: string; description?: string; is_active?: boolean }) {
    return apiRequest<PermissionRecord>(`${CORE_PREFIX}/permissions/${permissionId}`, { method: "PATCH", authToken: token, json: payload });
  },
  deletePermission(token: string, permissionId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/permissions/${permissionId}`, { method: "DELETE", authToken: token });
  },

  listApiKeys(token: string) {
    return apiRequest<ApiKeyRecord[]>(`${CORE_PREFIX}/api-keys`, { method: "GET", authToken: token });
  },
  getOrganizationSettings(token: string, orgId: number) {
    return apiRequest<OrgSettingsRecord>(`${CORE_PREFIX}/organizations/${orgId}/settings`, { method: "GET", authToken: token });
  },
  updateOrganizationSettings(token: string, orgId: number, payload: Partial<OrgSettingsRecord>) {
    return apiRequest<OrgSettingsRecord>(`${CORE_PREFIX}/organizations/${orgId}/settings`, { method: "PATCH", authToken: token, json: payload });
  },
  getWorkspaceSettings(token: string, wsId: number) {
    return apiRequest<WorkspaceSettingsRecord>(`${CORE_PREFIX}/workspaces/${wsId}/settings`, { method: "GET", authToken: token });
  },
  updateWorkspaceSettings(token: string, wsId: number, payload: Partial<WorkspaceSettingsRecord>) {
    return apiRequest<WorkspaceSettingsRecord>(`${CORE_PREFIX}/workspaces/${wsId}/settings`, { method: "PATCH", authToken: token, json: payload });
  },
  createApiKey(token: string, payload: { name: string; organization_id?: number | null; workspace_id?: number | null; scopes?: string[]; expires_at?: string | null }) {
    return apiRequest<ApiKeyRecord>(`${CORE_PREFIX}/api-keys`, { method: "POST", authToken: token, json: payload });
  },
  revokeApiKey(token: string, apiKeyId: number) {
    return apiRequest<ApiKeyRecord>(`${CORE_PREFIX}/api-keys/${apiKeyId}/revoke`, { method: "POST", authToken: token });
  },

  createInvitation(token: string, payload: { email: string; organization_id: number; workspace_id?: number | null; role_id?: number | null }) {
    return apiRequest<InvitationRecord>(`${CORE_PREFIX}/invitations`, { method: "POST", authToken: token, json: payload });
  },
  listInvitations(token: string) {
    return apiRequest<InvitationRecord[]>(`${CORE_PREFIX}/invitations`, { method: "GET", authToken: token });
  },
  resendInvitation(token: string, invitationId: number) {
    return apiRequest<InvitationRecord>(`${CORE_PREFIX}/invitations/${invitationId}/resend`, { method: "POST", authToken: token });
  },
  revokeInvitation(token: string, invitationId: number) {
    return apiRequest<InvitationRecord>(`${CORE_PREFIX}/invitations/${invitationId}/revoke`, { method: "POST", authToken: token });
  },
  listNotifications(token: string) {
    return apiRequest<CoreNotificationRecord[]>(`${CORE_PREFIX}/notifications`, { method: "GET", authToken: token });
  },
  markNotificationRead(token: string, notificationId: number) {
    return apiRequest<CoreNotificationRecord>(`${CORE_PREFIX}/notifications/${notificationId}/read`, { method: "PATCH", authToken: token });
  },
  markAllNotificationsRead(token: string) {
    return apiRequest<{ updated: number }>(`${CORE_PREFIX}/notifications/read-all`, { method: "PATCH", authToken: token });
  },
  deleteNotification(token: string, notificationId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/notifications/${notificationId}`, { method: "DELETE", authToken: token });
  },
  getUser(token: string, userId: number) {
    return apiRequest<CoreUser>(`${CORE_PREFIX}/users/${userId}`, { method: "GET", authToken: token });
  },
  listUsers(token: string) {
    return apiRequest<CoreUser[]>(`${CORE_PREFIX}/users`, { method: "GET", authToken: token });
  },
  assignUserRole(token: string, userId: number, roleId: number) {
    return apiRequest<UserRoleRecord>(`${CORE_PREFIX}/users/${userId}/roles`, { method: "POST", authToken: token, json: { role_id: roleId } });
  },
  listUserRoles(token: string, userId: number) {
    return apiRequest<UserRoleRecord[]>(`${CORE_PREFIX}/users/${userId}/roles`, { method: "GET", authToken: token });
  },
  removeUserRole(token: string, userId: number, roleId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/users/${userId}/roles/${roleId}`, { method: "DELETE", authToken: token });
  },
  getUserEffectivePermissions(token: string, userId: number, params: { scope_type?: string; scope_id?: number | null } = {}) {
    const search = new URLSearchParams();
    if (params.scope_type) search.set("scope_type", params.scope_type);
    if (params.scope_id) search.set("scope_id", String(params.scope_id));
    const query = search.toString();
    return apiRequest<EffectivePermissionsRecord>(`${CORE_PREFIX}/users/${userId}/effective-permissions${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
  listActivityLogs(token: string, params: {
    organization_id?: number;
    workspace_id?: number;
    project_id?: number;
    actor_user_id?: number;
    action?: string;
    entity_type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const search = new URLSearchParams();
    if (params.organization_id != null) search.set("organization_id", String(params.organization_id));
    if (params.workspace_id != null) search.set("workspace_id", String(params.workspace_id));
    if (params.project_id != null) search.set("project_id", String(params.project_id));
    if (params.actor_user_id != null) search.set("actor_user_id", String(params.actor_user_id));
    if (params.action) search.set("action", params.action);
    if (params.entity_type) search.set("entity_type", params.entity_type);
    if (params.limit != null) search.set("limit", String(params.limit));
    if (params.offset != null) search.set("offset", String(params.offset));
    const query = search.toString();
    return apiRequest<ActivityLogRecord[]>(`${CORE_PREFIX}/activity${query ? `?${query}` : ""}`, { method: "GET", authToken: token });
  },
};
