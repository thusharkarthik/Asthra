import { apiRequest } from "@/services/api/client";
import type { Approval, ChangeRequest, DeskIncident, Queue, SLA, Ticket, TicketAIClassification, TicketComment, TicketCreate } from "@/types/desk";

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
  listTickets(accessToken: string, filters: { workspace_id?: number | null; project_id?: number | null; status?: string; limit?: number } = {}) {
    return apiRequest<Ticket[]>(`${DESK_PREFIX}/tickets${toQuery(filters)}`, { method: "GET", authToken: accessToken });
  },
  createTicket(accessToken: string, payload: TicketCreate) {
    return apiRequest<Ticket>(`${DESK_PREFIX}/tickets`, { method: "POST", authToken: accessToken, json: payload });
  },
  getTicket(accessToken: string, id: string | number) {
    return apiRequest<Ticket>(`${DESK_PREFIX}/tickets/${id}`, { method: "GET", authToken: accessToken });
  },
  listQueues(accessToken: string) {
    return apiRequest<Queue[]>(`${DESK_PREFIX}/queues`, { method: "GET", authToken: accessToken });
  },
  listSlas(accessToken: string) {
    return apiRequest<SLA[]>(`${DESK_PREFIX}/slas`, { method: "GET", authToken: accessToken });
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
