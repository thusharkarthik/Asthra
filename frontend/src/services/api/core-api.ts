import { apiRequest } from "@/services/api/client";
import type { ContextVersionSnapshot, CoreUser, Organization } from "@/types/core";

const CORE_PREFIX = "/api/core/api/v1";

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
  }
};
