import { apiRequest } from "@/services/api/client";
import type {
  ApiKeyRecord,
  Organization,
  OrganizationMember,
  PermissionRecord,
  ProjectRecord,
  RoleRecord,
  TeamRecord,
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
  listOrganizationMembers(token: string, organizationId: number) {
    return apiRequest<OrganizationMember[]>(`${CORE_PREFIX}/organizations/${organizationId}/members`, { method: "GET", authToken: token });
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
  listWorkspaceMembers(token: string, workspaceId: number) {
    return apiRequest<WorkspaceMember[]>(`${CORE_PREFIX}/workspaces/${workspaceId}/members`, { method: "GET", authToken: token });
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
  updateProject(token: string, projectId: number, payload: Partial<NamedCreatePayload> & { status?: string; is_active?: boolean }) {
    return apiRequest<ProjectRecord>(`${CORE_PREFIX}/projects/${projectId}`, { method: "PATCH", authToken: token, json: payload });
  },

  listTeams(token: string) {
    return apiRequest<TeamRecord[]>(`${CORE_PREFIX}/teams`, { method: "GET", authToken: token });
  },
  createTeam(token: string, payload: NamedCreatePayload & { workspace_id: number }) {
    return apiRequest<TeamRecord>(`${CORE_PREFIX}/teams`, { method: "POST", authToken: token, json: payload });
  },

  listRoles(token: string) {
    return apiRequest<RoleRecord[]>(`${CORE_PREFIX}/roles`, { method: "GET", authToken: token });
  },
  createRole(token: string, payload: NamedCreatePayload & { organization_id?: number; scope?: string }) {
    return apiRequest<RoleRecord>(`${CORE_PREFIX}/roles`, { method: "POST", authToken: token, json: payload });
  },

  listPermissions(token: string) {
    return apiRequest<PermissionRecord[]>(`${CORE_PREFIX}/permissions`, { method: "GET", authToken: token });
  },
  createPermission(token: string, payload: { code: string; name: string; description?: string }) {
    return apiRequest<PermissionRecord>(`${CORE_PREFIX}/permissions`, { method: "POST", authToken: token, json: payload });
  },

  listApiKeys(token: string) {
    return apiRequest<ApiKeyRecord[]>(`${CORE_PREFIX}/api-keys`, { method: "GET", authToken: token });
  },
  createApiKey(token: string, payload: { name: string; organization_id?: number | null; workspace_id?: number | null; scopes?: string[] }) {
    return apiRequest<ApiKeyRecord>(`${CORE_PREFIX}/api-keys`, { method: "POST", authToken: token, json: payload });
  },
  revokeApiKey(token: string, apiKeyId: number) {
    return apiRequest<ApiKeyRecord>(`${CORE_PREFIX}/api-keys/${apiKeyId}/revoke`, { method: "POST", authToken: token });
  }
};
