import type { Queue, Ticket } from "@/types/desk";

export const DESK_TICKET_STATUSES = ["open", "assigned", "in_progress", "waiting", "resolved", "closed"];
export const DESK_PRIORITIES = ["low", "medium", "high", "critical"];
export const DESK_CHANGE_STATUSES = ["draft", "submitted", "approved", "scheduled", "completed", "rejected"];
export const DESK_RISK_LEVELS = ["low", "medium", "high", "critical"];

export function deskDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function queueNameFor(ticket: Ticket, queues: Queue[]) {
  return queues.find((queue) => queue.id === ticket.queue_id)?.name ?? (ticket.queue_id ? `Queue ${ticket.queue_id}` : "Unqueued");
}

export function isOpenTicket(ticket: Ticket) {
  return !["resolved", "closed"].includes(ticket.status);
}

export function isHighPriorityTicket(ticket: Ticket) {
  return ["high", "critical"].includes(ticket.priority);
}

export function isSlaAtRisk(ticket: Ticket) {
  return isOpenTicket(ticket) && ["high", "critical"].includes(ticket.priority);
}

export function needsAttention(ticket: Ticket) {
  return isSlaAtRisk(ticket) || ticket.status === "waiting" || !ticket.assignee_id;
}
