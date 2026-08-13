import { apiRequest } from "@/services/api/client";
import type { Approval, ChangeRequest, ChangeRequestCreate, DeskDashboardSummary, DeskIncident, Queue, QueueCreate, SLA, SLACreate, Ticket, TicketAIClassification, TicketComment, TicketCreate, TicketUpdate } from "@/types/desk";

const DESK_PREFIX = "/api/desk/api/v1";

function toQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const deskApi = {
  getDashboardSummary(accessToken: string, workspaceId: number) {
    return apiRequest<DeskDashboardSummary>(`${DESK_PREFIX}/dashboard/summary${toQuery({ workspace_id: workspaceId })}`, { method: "GET", authToken: accessToken });
  },
  listTickets(accessToken: string, filters: { workspace_id?: number | null; project_id?: number | null; status?: string; priority?: string; category?: string | null; queue_id?: number | null; assignee_id?: number | null; requester_id?: number | null; limit?: number } = {}) {
    return apiRequest<Ticket[]>(`${DESK_PREFIX}/tickets${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createTicket(accessToken: string, payload: TicketCreate) {
    return apiRequest<Ticket>(`${DESK_PREFIX}/tickets`, { method: "POST", authToken: accessToken, json: payload });
  },
  getTicket(accessToken: string, id: string | number) {
    return apiRequest<Ticket>(`${DESK_PREFIX}/tickets/${id}`, { method: "GET", authToken: accessToken });
  },
  updateTicket(accessToken: string, id: string | number, payload: TicketUpdate) {
    return apiRequest<Ticket>(`${DESK_PREFIX}/tickets/${id}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  deleteTicket(accessToken: string, id: string | number) {
    return apiRequest<void>(`${DESK_PREFIX}/tickets/${id}`, { method: "DELETE", authToken: accessToken });
  },
  listQueues(accessToken: string, filters: { workspace_id?: number | null } = {}) {
    return apiRequest<Queue[]>(`${DESK_PREFIX}/queues${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createQueue(accessToken: string, payload: QueueCreate) {
    return apiRequest<Queue>(`${DESK_PREFIX}/queues`, { method: "POST", authToken: accessToken, json: payload });
  },
  listSlas(accessToken: string, filters: { workspace_id?: number | null } = {}) {
    return apiRequest<SLA[]>(`${DESK_PREFIX}/slas${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createSla(accessToken: string, payload: SLACreate) {
    return apiRequest<SLA>(`${DESK_PREFIX}/slas`, { method: "POST", authToken: accessToken, json: payload });
  },
  listApprovals(accessToken: string, ticketId: string | number) {
    return apiRequest<Approval[]>(`${DESK_PREFIX}/tickets/${ticketId}/approvals`, { method: "GET", authToken: accessToken });
  },
  listIncidents(accessToken: string, filters: { workspace_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<DeskIncident[]>(`${DESK_PREFIX}/incidents${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  listChangeRequests(accessToken: string, filters: { workspace_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<ChangeRequest[]>(`${DESK_PREFIX}/change-requests${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createChangeRequest(accessToken: string, payload: ChangeRequestCreate) {
    return apiRequest<ChangeRequest>(`${DESK_PREFIX}/change-requests`, { method: "POST", authToken: accessToken, json: payload });
  },
  updateApproval(accessToken: string, approvalId: string | number, payload: { status?: string; note?: string | null }) {
    return apiRequest<Approval>(`${DESK_PREFIX}/approvals/${approvalId}`, { method: "PATCH", authToken: accessToken, json: payload });
  },
  listComments(accessToken: string, ticketId: string | number) {
    return apiRequest<TicketComment[]>(`${DESK_PREFIX}/tickets/${ticketId}/comments`, { method: "GET", authToken: accessToken });
  },
  createComment(accessToken: string, ticketId: string | number, payload: { author_id?: number | null; content: string }) {
    return apiRequest<TicketComment>(`${DESK_PREFIX}/tickets/${ticketId}/comments`, { method: "POST", authToken: accessToken, json: payload });
  },
  classifyTicket(accessToken: string, ticketId: string | number) {
    return apiRequest<TicketAIClassification>(`${DESK_PREFIX}/tickets/${ticketId}/ai-classify`, { method: "POST", authToken: accessToken });
  }
};
