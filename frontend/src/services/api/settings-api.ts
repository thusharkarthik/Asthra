import { apiRequest } from "@/services/api/client";
import type {
  ApiKeyRecord,
  CoreNotificationRecord,
  CoreUser,
  InvitationRecord,
  Organization,
  OrganizationMember,
  PermissionRecord,
  ProjectRecord,
  RoleRecord,
  RoleTemplateRecord,
  TeamMemberRecord,
  TeamRecord,
  UserRoleRecord,
  WorkspaceMember,
  WorkspaceRecord
} from "@/types/core";

const CORE_PREFIX = "/api/core/api/v1";

export type NamedCreatePayload = {
  name: string;
  description?: string;
};

export const settingsApi = {
  listOrganizations(token: string) {
    return apiRequest<Organization[]>(`${CORE_PREFIX}/organizations`, { method: "GET", authToken: token });
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

  listWorkspaces(token: string) {
    return apiRequest<WorkspaceRecord[]>(`${CORE_PREFIX}/workspaces`, { method: "GET", authToken: token });
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

  listProjects(token: string) {
    return apiRequest<ProjectRecord[]>(`${CORE_PREFIX}/projects`, { method: "GET", authToken: token });
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

  listPermissions(token: string) {
    return apiRequest<PermissionRecord[]>(`${CORE_PREFIX}/permissions`, { method: "GET", authToken: token });
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
  createApiKey(token: string, payload: { name: string; organization_id?: number | null; workspace_id?: number | null; scopes?: string[] }) {
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
  getUser(token: string, userId: number) {
    return apiRequest<CoreUser>(`${CORE_PREFIX}/users/${userId}`, { method: "GET", authToken: token });
  },
  assignUserRole(token: string, userId: number, roleId: number) {
    return apiRequest<UserRoleRecord>(`${CORE_PREFIX}/users/${userId}/roles`, { method: "POST", authToken: token, json: { role_id: roleId } });
  },
  listUserRoles(token: string, userId: number) {
    return apiRequest<UserRoleRecord[]>(`${CORE_PREFIX}/users/${userId}/roles`, { method: "GET", authToken: token });
  },
  removeUserRole(token: string, userId: number, roleId: number) {
    return apiRequest<void>(`${CORE_PREFIX}/users/${userId}/roles/${roleId}`, { method: "DELETE", authToken: token });
  }
};
