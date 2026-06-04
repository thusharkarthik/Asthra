import { apiRequest } from "@/services/api/client";
import type { Board, BoardColumn, WorkItem, WorkItemComment, WorkItemCreate, WorkItemFilters, WorkItemUpdate } from "@/types/flow";

const FLOW_PREFIX = "/api/flow/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const flowApi = {
  listWorkItems(accessToken: string, filters: WorkItemFilters = {}) {
    return apiRequest<WorkItem[]>(`${FLOW_PREFIX}/work-items${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createWorkItem(accessToken: string, payload: WorkItemCreate) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items`, { method: "POST", authToken: accessToken, json: payload });
  },
  getWorkItem(accessToken: string, id: string | number) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items/${id}`, { method: "GET", authToken: accessToken });
  },
  updateWorkItem(accessToken: string, id: string | number, payload: WorkItemUpdate) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items/${id}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  listBoards(accessToken: string) {
    return apiRequest<Board[]>(`${FLOW_PREFIX}/boards`, { method: "GET", authToken: accessToken });
  },
  createBoard(accessToken: string, payload: Partial<Board>) {
    return apiRequest<Board>(`${FLOW_PREFIX}/boards`, { method: "POST", authToken: accessToken, json: payload });
  },
  listBoardColumns(accessToken: string, boardId: string | number) {
    return apiRequest<BoardColumn[]>(`${FLOW_PREFIX}/boards/${boardId}/columns`, { method: "GET", authToken: accessToken });
  },
  listComments(accessToken: string, workItemId: string | number) {
    return apiRequest<WorkItemComment[]>(`${FLOW_PREFIX}/work-items/${workItemId}/comments`, { method: "GET", authToken: accessToken });
  },
  createComment(accessToken: string, workItemId: string | number, payload: { user_id?: number | null; content: string }) {
    return apiRequest<WorkItemComment>(`${FLOW_PREFIX}/work-items/${workItemId}/comments`, {
      method: "POST",
      authToken: accessToken,
      json: payload
    });
  }
};
