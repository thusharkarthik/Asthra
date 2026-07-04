import { apiRequest } from "@/services/api/client";
import type { AIContextMetadata, ConfigurationMetadata, ContextVersionSnapshot, CoreUser, CurrentUserResolvedRole, ModuleRegistryItem, Organization, OrganizationTemplateMetadata, SearchMetadata } from "@/types/core";

const CORE_PREFIX = "/api/core/api/v1";

export type PlatformContextUser = {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  is_superuser: boolean;
  is_active: boolean;
};

export type PlatformContextOrg = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  description: string | null;
  settings: Record<string, unknown>;
};

export type PlatformContextWorkspace = {
  id: number;
  name: string;
  slug: string;
  organization_id: number;
  is_active: boolean;
  description: string | null;
};

export type PlatformContextProject = {
  id: number;
  name: string;
  key: string;
  workspace_id: number;
  status: string;
  is_active: boolean;
  description: string | null;
};

export type PlatformContextData = {
  user: PlatformContextUser;
  permissions: string[];
  roles: CurrentUserResolvedRole[];
  organizations: PlatformContextOrg[];
  current_org: PlatformContextOrg | null;
  workspaces: PlatformContextWorkspace[];
  current_workspace: PlatformContextWorkspace | null;
  projects: PlatformContextProject[];
  current_project: PlatformContextProject | null;
  context_version: number;
  generated_at: string;
  feature_flags: Record<string, boolean>;
  enabled_modules: string[];
  modules: ModuleRegistryItem[];
  ai_context?: AIContextMetadata;
  configuration?: ConfigurationMetadata;
  search?: SearchMetadata;
  organization_templates?: OrganizationTemplateMetadata;
  preferences: Record<string, unknown>;
};

export const coreApi = {
  currentUser(accessToken: string) {
    return apiRequest<CoreUser>("/api/core/api/v1/auth/me", {
      method: "GET",
      authToken: accessToken
    });
  },
  listOrganizations(accessToken: string) {
    return apiRequest<Organization[]>("/api/core/api/v1/organizations", {
      method: "GET",
      authToken: accessToken
    });
  },
  getContextVersion(
    accessToken: string,
    params: { organization_id?: number | null; workspace_id?: number | null; project_id?: number | null } = {}
  ) {
    const search = new URLSearchParams();
    if (params.organization_id) search.set("organization_id", String(params.organization_id));
    if (params.workspace_id) search.set("workspace_id", String(params.workspace_id));
    if (params.project_id) search.set("project_id", String(params.project_id));
    const query = search.toString();
    return apiRequest<ContextVersionSnapshot>(`${CORE_PREFIX}/context/version${query ? `?${query}` : ""}`, {
      method: "GET",
      authToken: accessToken
    });
  },
  getPlatformContext(
    accessToken: string,
    params: { org_id?: number | null; workspace_id?: number | null; project_id?: number | null; navigation_mode?: string } = {}
  ) {
    const search = new URLSearchParams();
    if (params.org_id) search.set("org_id", String(params.org_id));
    if (params.workspace_id) search.set("workspace_id", String(params.workspace_id));
    if (params.project_id) search.set("project_id", String(params.project_id));
    if (params.navigation_mode) search.set("navigation_mode", params.navigation_mode);
    const query = search.toString();
    return apiRequest<PlatformContextData>(`${CORE_PREFIX}/context/platform${query ? `?${query}` : ""}`, {
      method: "GET",
      authToken: accessToken
    });
  }
};
