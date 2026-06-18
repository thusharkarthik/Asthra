import type { Workflow, WorkflowStatus, WorkItem } from "@/types/flow";

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
export const FLOW_WORK_ITEM_TEMPLATES = [
  {
    value: "blank",
    label: "Blank",
    description: "",
    acceptanceCriteria: "",
    definitionOfDone: ""
  },
  {
    value: "bug",
    label: "Bug",
    description: "Problem Summary:\n\nEnvironment:\n\nSteps To Reproduce:\n1. \n2. \n3. \n\nExpected Result:\n\nActual Result:\n",
    acceptanceCriteria: "- Issue is reproduced or root cause is confirmed.\n- Fix covers the reported behavior.\n- Regression coverage is added where practical.",
    definitionOfDone: "- Fix implemented\n- Tests pass\n- Regression checked"
  },
  {
    value: "feature",
    label: "Feature",
    description: "Problem:\n\nProposed Solution:\n\nUser Impact:\n",
    acceptanceCriteria: "- User can complete the intended workflow.\n- Edge states are handled.\n- Documentation or release notes are updated if needed.",
    definitionOfDone: "- Implementation complete\n- Acceptance criteria verified\n- Product review complete"
  },
  {
    value: "task",
    label: "Task",
    description: "Task Summary:\n\nImplementation Notes:\n",
    acceptanceCriteria: "- Task outcome is complete and verifiable.",
    definitionOfDone: "- Work completed\n- Reviewed where needed"
  },
  {
    value: "research",
    label: "Research",
    description: "Goal:\n\nQuestions:\n- \n\nFindings:\n\nRecommendation:\n",
    acceptanceCriteria: "- Key questions are answered.\n- Recommendation is documented.\n- Follow-up work is identified.",
    definitionOfDone: "- Findings documented\n- Recommendation shared"
  },
  {
    value: "incident",
    label: "Incident",
    description: "Impact:\n\nTimeline:\n\nRoot Cause:\n\nResolution:\n\nFollow-Up Actions:\n",
    acceptanceCriteria: "- Incident impact is understood.\n- Resolution or mitigation is documented.\n- Follow-up actions are captured.",
    definitionOfDone: "- Incident notes complete\n- Follow-up actions assigned"
  }
] as const;

export function statusLabel(statusId?: number | null) {
  return FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === statusId)?.label ?? "Untracked";
}

export function statusNameFromId(statusId?: number | null) {
  return FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === statusId)?.name ?? "todo";
}

export function workflowStatusOptions(workflow?: Workflow | null): Array<Pick<WorkflowStatus, "id" | "name" | "key" | "category" | "sort_order">> {
  if (workflow?.statuses?.length) {
    return [...workflow.statuses]
      .filter((status) => status.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((status) => ({
        id: status.id,
        name: status.name,
        key: status.key,
        category: status.category,
        sort_order: status.sort_order ?? 0
      }));
  }
  return FLOW_STATUS_OPTIONS.map((status, index) => ({
    id: Number(status.value),
    name: status.label,
    key: status.name,
    category: status.name === "done" ? "completed" : status.name === "review" ? "review" : status.name === "todo" ? "backlog" : "active",
    sort_order: index
  }));
}

export function workflowStatusKeyFor(workflow: Workflow | null | undefined, statusId?: number | null) {
  return workflowStatusOptions(workflow).find((status) => status.id === statusId)?.key ?? workflowStatusOptions(workflow)[0]?.key ?? "todo";
}

export function workflowStatusLabelFor(workflow: Workflow | null | undefined, statusId?: number | null) {
  return workflowStatusOptions(workflow).find((status) => status.id === statusId)?.name ?? statusLabel(statusId);
}

export function workflowStatusByKey(workflow: Workflow | null | undefined, key?: string | null) {
  return workflowStatusOptions(workflow).find((status) => status.key === key);
}

export function validWorkflowTargets(workflow: Workflow | null | undefined, currentStatusId?: number | null) {
  return workflowStatusOptions(workflow);
}

export function nextWorkflowTargets(workflow: Workflow | null | undefined, currentStatusId?: number | null) {
  return validWorkflowTargets(workflow, currentStatusId).filter((statusOption) => statusOption.id !== currentStatusId);
}

export function priorityNameFromId(priorityId?: number | null) {
  return FLOW_PRIORITY_OPTIONS.find((priority) => Number(priority.value) === priorityId)?.name ?? "medium";
}

export function priorityLabelFor(priorityId?: number | null) {
  return FLOW_PRIORITY_OPTIONS.find((priority) => Number(priority.value) === priorityId)?.label ?? (priorityId ? `Priority ${priorityId}` : "Not set");
}

export function assigneeLabel(assigneeId?: number | null, displayName?: string | null) {
  if (displayName) return displayName;
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

export function isOpenWorkItem(item: WorkItem, workflow?: Workflow | null | number) {
  const status = workflowStatusOptions(typeof workflow === "number" ? null : workflow).find((option) => option.id === item.status_id);
  return status?.category !== "completed";
}

export function isInProgressWorkItem(item: WorkItem, workflow?: Workflow | null | number) {
  const status = workflowStatusOptions(typeof workflow === "number" ? null : workflow).find((option) => option.id === item.status_id);
  return status?.category === "active" || status?.category === "review";
}

export function isBlockedWorkItem(item: WorkItem) {
  return item.priority_id === 4 || item.status_id === 5;
}

export function isCompletedWorkItem(item: WorkItem, workflow?: Workflow | null | number) {
  const status = workflowStatusOptions(typeof workflow === "number" ? null : workflow).find((option) => option.id === item.status_id);
  return status?.category === "completed";
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
