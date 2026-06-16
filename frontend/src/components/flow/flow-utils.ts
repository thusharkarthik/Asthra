import type { WorkItem } from "@/types/flow";

export const FLOW_STATUS_OPTIONS = [
  { value: "1", label: "Todo", name: "todo" },
  { value: "2", label: "In Progress", name: "in_progress" },
  { value: "3", label: "Review", name: "review" },
  { value: "4", label: "Done", name: "done" }
];

export const FLOW_PRIORITY_OPTIONS = [
  { value: "1", label: "Low", name: "low" },
  { value: "2", label: "Medium", name: "medium" },
  { value: "3", label: "High", name: "high" },
  { value: "4", label: "Critical", name: "critical" }
];

export function statusLabel(statusId?: number | null) {
  return FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === statusId)?.label ?? "Untracked";
}

export function statusNameFromId(statusId?: number | null) {
  return FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === statusId)?.name ?? "todo";
}

export function priorityNameFromId(priorityId?: number | null) {
  return FLOW_PRIORITY_OPTIONS.find((priority) => Number(priority.value) === priorityId)?.name ?? "medium";
}

export function assigneeLabel(assigneeId?: number | null) {
  return assigneeId ? `User ${assigneeId}` : "Unassigned";
}

export function reporterLabel(reporterId?: number | null) {
  if (reporterId === 0) return "System";
  return reporterId ? `User ${reporterId}` : "Unknown";
}

export function isOpenWorkItem(item: WorkItem) {
  return item.status_id !== 4;
}

export function isInProgressWorkItem(item: WorkItem) {
  return item.status_id === 2 || item.status_id === 3;
}

export function isBlockedWorkItem(item: WorkItem) {
  return item.priority_id === 4 || item.status_id === 5;
}

export function isCompletedWorkItem(item: WorkItem) {
  return item.status_id === 4;
}

export function sortedByUpdatedAt(items: WorkItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function formatWorkItemDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
