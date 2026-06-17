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

export const FLOW_EFFORT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];
export const FLOW_BUSINESS_VALUE_OPTIONS = ["low", "medium", "high", "critical"];
export const FLOW_RISK_OPTIONS = ["low", "medium", "high"];
export const FLOW_COMPLEXITY_OPTIONS = ["low", "medium", "high"];
export const FLOW_ITEM_LEVEL_OPTIONS = [
  { value: "initiative", label: "Initiative" },
  { value: "feature", label: "Feature" },
  { value: "work_item", label: "Work Item" },
  { value: "subtask", label: "Subtask" }
];
export const FLOW_RELATION_TYPE_OPTIONS = [
  { value: "blocks", label: "Blocks" },
  { value: "blocked_by", label: "Blocked By" },
  { value: "related_to", label: "Related" },
  { value: "duplicate_of", label: "Duplicate Of" }
] as const;

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

export function planningLabel(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "Not set";
  const text = String(value);
  return text.length <= 3 ? text.toUpperCase() : text.replace(/_/g, " ").replace(/^\w/, (first) => first.toUpperCase());
}

export function itemLevelLabel(value?: string | null) {
  return FLOW_ITEM_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? "Work Item";
}

export function relationTypeLabel(value?: string | null) {
  return FLOW_RELATION_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? planningLabel(value);
}

export function effortLabel(effortSize?: string | null, effortScore?: number | null) {
  if (effortSize && effortScore) return `${effortSize} / ${effortScore}`;
  return effortSize ?? (effortScore ? String(effortScore) : "Not set");
}

export function isHighRiskWorkItem(item: WorkItem) {
  return item.risk_level === "high";
}

export function isOverdueWorkItem(item: WorkItem) {
  if (!item.due_date || isCompletedWorkItem(item)) return false;
  return new Date(item.due_date).getTime() < Date.now();
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
