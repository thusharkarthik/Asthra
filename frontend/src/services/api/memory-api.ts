import { apiRequest } from "@/services/api/client";
import { apiConfig } from "@/services/api/config";
import type { WorkspaceSearchRequest, WorkspaceSearchResponse } from "@/types/assistant";

export const memoryApi = {
  workspaceSearch(accessToken: string, payload: WorkspaceSearchRequest) {
    return apiRequest<WorkspaceSearchResponse>(apiConfig.workspaceSearchPath, {
      method: "POST",
      authToken: accessToken,
      json: payload
    });
  }
};
