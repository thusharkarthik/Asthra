import { apiRequest } from "@/services/api/client";
import type { AutomationAuditLog, Envelope, ScheduledJob, Workflow, WorkflowAction, WorkflowCondition, WorkflowCreate, WorkflowExecution, WorkflowTrigger } from "@/types/automation";

const PREFIX = "/api/automation/api/v1";
const q = (params: Record<string, string | number | boolean | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== "") search.set(key, String(value)); });
  const text = search.toString();
  return text ? `?${text}` : "";
};
const unwrap = async <T>(promise: Promise<Envelope<T>>) => (await promise).data;

export const automationApi = {
  listWorkflows: (token: string, filters: { workspace_id?: number | null; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<Workflow[]>>(`${PREFIX}/workflows${q(filters)}`, { method: "GET", authToken: token })),
  createWorkflow: (token: string, payload: WorkflowCreate) => unwrap(apiRequest<Envelope<Workflow>>(`${PREFIX}/workflows`, { method: "POST", authToken: token, json: payload })),
  getWorkflow: (token: string, id: string | number) => unwrap(apiRequest<Envelope<Workflow>>(`${PREFIX}/workflows/${id}`, { method: "GET", authToken: token })),
  listTriggers: (token: string, workflowId: string | number) => unwrap(apiRequest<Envelope<WorkflowTrigger[]>>(`${PREFIX}/workflows/${workflowId}/triggers`, { method: "GET", authToken: token })),
  listConditions: (token: string, workflowId: string | number) => unwrap(apiRequest<Envelope<WorkflowCondition[]>>(`${PREFIX}/workflows/${workflowId}/conditions`, { method: "GET", authToken: token })),
  listActions: (token: string, workflowId: string | number) => unwrap(apiRequest<Envelope<WorkflowAction[]>>(`${PREFIX}/workflows/${workflowId}/actions`, { method: "GET", authToken: token })),
  listExecutions: (token: string, filters: { workflow_id?: number | null; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<WorkflowExecution[]>>(`${PREFIX}/executions${q(filters)}`, { method: "GET", authToken: token })),
  listSchedules: (token: string, filters: { workflow_id?: number | null; is_active?: boolean; limit?: number } = {}) => unwrap(apiRequest<Envelope<ScheduledJob[]>>(`${PREFIX}/schedules${q(filters)}`, { method: "GET", authToken: token })),
  listAuditLogs: (token: string, filters: { workflow_id?: number | null; status?: string; limit?: number } = {}) => unwrap(apiRequest<Envelope<AutomationAuditLog[]>>(`${PREFIX}/audit-logs${q(filters)}`, { method: "GET", authToken: token }))
};
