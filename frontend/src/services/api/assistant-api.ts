import { apiRequest } from "@/services/api/client";
import { apiConfig } from "@/services/api/config";
import type { AssistantChatRequest, AssistantChatResponse, AssistantMessage, AssistantSession } from "@/types/assistant";

export const assistantApi = {
  listSessions(accessToken: string, workspaceId?: number | null) {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : "";
    return apiRequest<AssistantSession[]>(`${apiConfig.assistantSessionsPath}${query}`, {
      method: "GET",
      authToken: accessToken
    });
  },
  createSession(accessToken: string, workspaceId: number) {
    return apiRequest<AssistantSession>(apiConfig.assistantSessionsPath, {
      method: "POST",
      authToken: accessToken,
      json: { workspace_id: workspaceId }
    });
  },
  listMessages(accessToken: string, sessionId: string | number) {
    return apiRequest<AssistantMessage[]>(`${apiConfig.assistantSessionsPath}/${sessionId}/messages`, {
      method: "GET",
      authToken: accessToken
    });
  },
  chat(accessToken: string, payload: AssistantChatRequest) {
    return apiRequest<AssistantChatResponse>(apiConfig.assistantChatPath, {
      method: "POST",
      authToken: accessToken,
      json: payload
    });
  }
};
