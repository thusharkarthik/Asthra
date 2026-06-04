import type { WorkItem } from "@/types/flow";

export const FLOW_STATUS_OPTIONS = [
  { value: "1", label: "Todo" },
  { value: "2", label: "In Progress" },
  { value: "3", label: "Review" },
  { value: "4", label: "Done" }
];

export const FLOW_PRIORITY_OPTIONS = [
  { value: "1", label: "Low" },
  { value: "2", label: "Medium" },
  { value: "3", label: "High" },
  { value: "4", label: "Critical" }
];

export function statusLabel(statusId?: number | null) {
  return FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === statusId)?.label ?? "Untracked";
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
