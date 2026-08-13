import { apiRequest } from "@/services/api/client";
import type { ProjectRecord } from "@/types/core";

export const projectApi = {
  listProjects(accessToken: string, workspaceId?: number | null) {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : "";
    return apiRequest<ProjectRecord[]>(`/api/core/api/v1/projects${query}`, {
      method: "GET",
      authToken: accessToken
    });
  }
};
