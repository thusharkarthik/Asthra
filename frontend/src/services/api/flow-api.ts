import { apiRequest } from "@/services/api/client";
import type {
  Board,
  BoardColumn,
  CustomFieldDefinition,
  CustomFieldDefinitionCreate,
  CustomFieldDefinitionUpdate,
  CustomFieldValue,
  CustomFieldValueUpsert,
  LinkedEntity,
  LinkedEntityCreate,
  ProjectHierarchy,
  Release,
  ReleaseCreate,
  ReleaseUpdate,
  Sprint,
  SprintCreate,
  SprintUpdate,
  TeamCapacity,
  TeamCapacityCreate,
  TeamCapacityUpdate,
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
  WorkItemRelationCreate,
  WorkLog,
  WorkLogCreate
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
  listLinks(accessToken: string, workItemId: string | number) {
    return apiRequest<LinkedEntity[]>(`${FLOW_PREFIX}/work-items/${workItemId}/links`, { method: "GET", authToken: accessToken });
  },
  createLink(accessToken: string, workItemId: string | number, payload: LinkedEntityCreate) {
    return apiRequest<LinkedEntity>(`${FLOW_PREFIX}/work-items/${workItemId}/links`, { method: "POST", authToken: accessToken, json: payload });
  },
  deleteLink(accessToken: string, workItemId: string | number, linkId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/work-items/${workItemId}/links/${linkId}`, { method: "DELETE", authToken: accessToken });
  },
  listSprints(accessToken: string, filters: { project_id?: number | null; status?: string | null; limit?: number; offset?: number } = {}) {
    return apiRequest<Sprint[]>(`${FLOW_PREFIX}/sprints${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createSprint(accessToken: string, payload: SprintCreate) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints`, { method: "POST", authToken: accessToken, json: payload });
  },
  getSprint(accessToken: string, sprintId: string | number) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints/${sprintId}`, { method: "GET", authToken: accessToken });
  },
  updateSprint(accessToken: string, sprintId: string | number, payload: SprintUpdate) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints/${sprintId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteSprint(accessToken: string, sprintId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/sprints/${sprintId}`, { method: "DELETE", authToken: accessToken });
  },
  startSprint(accessToken: string, sprintId: string | number) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints/${sprintId}/start`, { method: "POST", authToken: accessToken });
  },
  completeSprint(accessToken: string, sprintId: string | number) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints/${sprintId}/complete`, { method: "POST", authToken: accessToken });
  },
  assignWorkItemToSprint(accessToken: string, sprintId: string | number, workItemId: string | number) {
    return apiRequest<Sprint>(`${FLOW_PREFIX}/sprints/${sprintId}/work-items`, { method: "POST", authToken: accessToken, json: { work_item_id: Number(workItemId) } });
  },
  listReleases(accessToken: string, filters: { project_id?: number | null; status?: string | null; limit?: number; offset?: number } = {}) {
    return apiRequest<Release[]>(`${FLOW_PREFIX}/releases${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createRelease(accessToken: string, payload: ReleaseCreate) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases`, { method: "POST", authToken: accessToken, json: payload });
  },
  getRelease(accessToken: string, releaseId: string | number) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases/${releaseId}`, { method: "GET", authToken: accessToken });
  },
  updateRelease(accessToken: string, releaseId: string | number, payload: ReleaseUpdate) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases/${releaseId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteRelease(accessToken: string, releaseId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/releases/${releaseId}`, { method: "DELETE", authToken: accessToken });
  },
  activateRelease(accessToken: string, releaseId: string | number) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases/${releaseId}/activate`, { method: "POST", authToken: accessToken });
  },
  markReleaseReleased(accessToken: string, releaseId: string | number) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases/${releaseId}/release`, { method: "POST", authToken: accessToken });
  },
  assignWorkItemToRelease(accessToken: string, releaseId: string | number, workItemId: string | number) {
    return apiRequest<Release>(`${FLOW_PREFIX}/releases/${releaseId}/work-items`, { method: "POST", authToken: accessToken, json: { work_item_id: Number(workItemId) } });
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
  },
  listWorkLogs(accessToken: string, workItemId: string | number) {
    return apiRequest<WorkLog[]>(`${FLOW_PREFIX}/work-items/${workItemId}/work-logs`, { method: "GET", authToken: accessToken });
  },
  createWorkLog(accessToken: string, workItemId: string | number, payload: WorkLogCreate) {
    return apiRequest<WorkLog>(`${FLOW_PREFIX}/work-items/${workItemId}/work-logs`, { method: "POST", authToken: accessToken, json: payload });
  },
  deleteWorkLog(accessToken: string, workItemId: string | number, workLogId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/work-items/${workItemId}/work-logs/${workLogId}`, { method: "DELETE", authToken: accessToken });
  },
  listCapacity(accessToken: string, filters: { project_id?: number | null; sprint_id?: number | null; user_id?: number | null; team_id?: number | null; limit?: number; offset?: number } = {}) {
    return apiRequest<TeamCapacity[]>(`${FLOW_PREFIX}/capacity${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createCapacity(accessToken: string, payload: TeamCapacityCreate) {
    return apiRequest<TeamCapacity>(`${FLOW_PREFIX}/capacity`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateCapacity(accessToken: string, capacityId: string | number, payload: TeamCapacityUpdate) {
    return apiRequest<TeamCapacity>(`${FLOW_PREFIX}/capacity/${capacityId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteCapacity(accessToken: string, capacityId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/capacity/${capacityId}`, { method: "DELETE", authToken: accessToken });
  },
  listCustomFieldDefinitions(accessToken: string, filters: { project_id?: number | null } = {}) {
    return apiRequest<CustomFieldDefinition[]>(`${FLOW_PREFIX}/custom-field-definitions${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createCustomFieldDefinition(accessToken: string, payload: CustomFieldDefinitionCreate) {
    return apiRequest<CustomFieldDefinition>(`${FLOW_PREFIX}/custom-field-definitions`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateCustomFieldDefinition(accessToken: string, definitionId: string | number, payload: CustomFieldDefinitionUpdate) {
    return apiRequest<CustomFieldDefinition>(`${FLOW_PREFIX}/custom-field-definitions/${definitionId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteCustomFieldDefinition(accessToken: string, definitionId: string | number) {
    return apiRequest<void>(`${FLOW_PREFIX}/custom-field-definitions/${definitionId}`, { method: "DELETE", authToken: accessToken });
  },
  listCustomFieldValues(accessToken: string, workItemId: string | number) {
    return apiRequest<CustomFieldValue[]>(`${FLOW_PREFIX}/work-items/${workItemId}/custom-fields`, { method: "GET", authToken: accessToken });
  },
  saveCustomFieldValue(accessToken: string, workItemId: string | number, payload: CustomFieldValueUpsert) {
    return apiRequest<CustomFieldValue>(`${FLOW_PREFIX}/work-items/${workItemId}/custom-fields`, { method: "POST", authToken: accessToken, json: payload });
  }
};
