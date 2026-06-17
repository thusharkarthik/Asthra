import { apiRequest } from "@/services/api/client";
import type {
  Board,
  BoardColumn,
  ProjectHierarchy,
  Workflow,
  WorkflowCreate,
  WorkflowStatus,
  WorkflowStatusCreate,
  WorkflowTransition,
  WorkflowTransitionCreate,
  WorkflowUpdate,
  WorkItem,
  WorkItemAttachment,
  WorkItemAttachmentCreate,
  WorkItemComment,
  WorkItemCreate,
  WorkItemFilters,
  WorkItemOperationalUpdate,
  WorkItemRelation,
  WorkItemRelationCreate
} from "@/types/flow";

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
  updateWorkItem(accessToken: string, id: string | number, payload: WorkItemOperationalUpdate) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items/${id}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteWorkItem(accessToken: string, id: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/work-items/${id}`, { method: "DELETE", authToken: accessToken });
  },
  getProjectHierarchy(accessToken: string, projectId: string | number) {
    return apiRequest<ProjectHierarchy>(`${FLOW_PREFIX}/projects/${projectId}/hierarchy`, { method: "GET", authToken: accessToken });
  },
  createSubtask(accessToken: string, workItemId: string | number, payload: WorkItemCreate) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items/${workItemId}/subtasks`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateParent(accessToken: string, workItemId: string | number, parentId: number | null) {
    return apiRequest<WorkItem>(`${FLOW_PREFIX}/work-items/${workItemId}/parent`, { method: "PATCH", authToken: accessToken, json: { parent_id: parentId } });
  },
  listChildren(accessToken: string, workItemId: string | number) {
    return apiRequest<WorkItem[]>(`${FLOW_PREFIX}/work-items/${workItemId}/children`, { method: "GET", authToken: accessToken });
  },
  listRelations(accessToken: string, workItemId: string | number) {
    return apiRequest<WorkItemRelation[]>(`${FLOW_PREFIX}/work-items/${workItemId}/relations`, { method: "GET", authToken: accessToken });
  },
  createRelation(accessToken: string, workItemId: string | number, payload: WorkItemRelationCreate) {
    return apiRequest<WorkItemRelation>(`${FLOW_PREFIX}/work-items/${workItemId}/relations`, { method: "POST", authToken: accessToken, json: payload });
  },
  deleteRelation(accessToken: string, workItemId: string | number, relationId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/work-items/${workItemId}/relations/${relationId}`, { method: "DELETE", authToken: accessToken });
  },
  listAttachments(accessToken: string, workItemId: string | number) {
    return apiRequest<WorkItemAttachment[]>(`${FLOW_PREFIX}/work-items/${workItemId}/attachments`, { method: "GET", authToken: accessToken });
  },
  createAttachment(accessToken: string, workItemId: string | number, payload: WorkItemAttachmentCreate) {
    return apiRequest<WorkItemAttachment>(`${FLOW_PREFIX}/work-items/${workItemId}/attachments`, { method: "POST", authToken: accessToken, json: payload });
  },
  uploadAttachment(accessToken: string, workItemId: string | number, file: File, uploadedById?: number | null) {
    const formData = new FormData();
    formData.set("file", file);
    if (uploadedById) formData.set("uploaded_by_id", String(uploadedById));
    return apiRequest<WorkItemAttachment>(`${FLOW_PREFIX}/work-items/${workItemId}/attachments`, { method: "POST", authToken: accessToken, body: formData });
  },
  deleteAttachment(accessToken: string, workItemId: string | number, attachmentId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/work-items/${workItemId}/attachments/${attachmentId}`, { method: "DELETE", authToken: accessToken });
  },
  attachmentDownloadPath(workItemId: string | number, attachmentId: string | number) {
    return `${FLOW_PREFIX}/work-items/${workItemId}/attachments/${attachmentId}/download`;
  },
  listWorkflows(accessToken: string, filters: { project_id?: number | null; workspace_id?: number | null } = {}) {
    return apiRequest<Workflow[]>(`${FLOW_PREFIX}/workflows${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createWorkflow(accessToken: string, payload: WorkflowCreate) {
    return apiRequest<Workflow>(`${FLOW_PREFIX}/workflows`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateWorkflow(accessToken: string, workflowId: string | number, payload: WorkflowUpdate) {
    return apiRequest<Workflow>(`${FLOW_PREFIX}/workflows/${workflowId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteWorkflow(accessToken: string, workflowId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/workflows/${workflowId}`, { method: "DELETE", authToken: accessToken });
  },
  createWorkflowFromTemplate(accessToken: string, templateName: string, params: { project_id?: number | null; workspace_id?: number | null } = {}) {
    return apiRequest<Workflow>(`${FLOW_PREFIX}/workflows/templates/${templateName}${toQuery(params)}`, { method: "POST", authToken: accessToken });
  },
  getProjectWorkflow(accessToken: string, projectId: string | number) {
    return apiRequest<Workflow>(`${FLOW_PREFIX}/projects/${projectId}/workflow`, { method: "GET", authToken: accessToken });
  },
  assignWorkflowToProject(accessToken: string, workflowId: string | number, projectId: number) {
    return apiRequest<Workflow>(`${FLOW_PREFIX}/workflows/${workflowId}/assign-project`, { method: "POST", authToken: accessToken, json: { project_id: projectId } });
  },
  createWorkflowStatus(accessToken: string, workflowId: string | number, payload: WorkflowStatusCreate) {
    return apiRequest<WorkflowStatus>(`${FLOW_PREFIX}/workflows/${workflowId}/statuses`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateWorkflowStatus(accessToken: string, workflowId: string | number, statusId: string | number, payload: Partial<WorkflowStatusCreate> & { is_active?: boolean }) {
    return apiRequest<WorkflowStatus>(`${FLOW_PREFIX}/workflows/${workflowId}/statuses/${statusId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  createWorkflowTransition(accessToken: string, workflowId: string | number, payload: WorkflowTransitionCreate) {
    return apiRequest<WorkflowTransition>(`${FLOW_PREFIX}/workflows/${workflowId}/transitions`, { method: "POST", authToken: accessToken, json: payload });
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
