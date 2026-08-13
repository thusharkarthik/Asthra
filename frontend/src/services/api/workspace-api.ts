import { apiRequest } from "@/services/api/client";
import type { WorkspaceRecord } from "@/types/core";

export const workspaceApi = {
  listWorkspaces(accessToken: string, organizationId?: number | null) {
    const query = organizationId ? `?organization_id=${organizationId}` : "";
    return apiRequest<WorkspaceRecord[]>(`/api/core/api/v1/workspaces${query}`, {
      method: "GET",
      authToken: accessToken
    });
  }
};
