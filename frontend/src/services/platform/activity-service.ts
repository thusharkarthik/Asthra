import type { ActivityItem, WorkspaceDashboardSummary } from "@/types/platform";

const now = new Date("2026-06-04T10:00:00.000Z").toISOString();

export async function getWorkspaceActivity(): Promise<ActivityItem[]> {
  return [
    { id: "act-1", source: "flow", actor: "Maya", action: "updated", entity: { source: "flow", entity_type: "work_item", entity_id: 101, title: "API gateway routing", href: "/flow/work-items/101" }, timestamp: now },
    { id: "act-2", source: "docs", actor: "Thushar", action: "published", entity: { source: "docs", entity_type: "docs_page", entity_id: 44, title: "Platform beta guide", href: "/docs/pages/44" }, timestamp: now },
    { id: "act-3", source: "desk", actor: "Support", action: "commented on", entity: { source: "desk", entity_type: "ticket", entity_id: 12, title: "Login troubleshooting", href: "/desk/tickets/12" }, timestamp: now },
    { id: "act-4", source: "pulse", actor: "Reliability", action: "resolved", entity: { source: "pulse", entity_type: "incident", entity_id: 7, title: "API latency", href: "/pulse/incidents/7" }, timestamp: now },
    { id: "act-5", source: "automation", actor: "Automation", action: "scheduled", entity: { source: "automation", entity_type: "workflow", entity_id: 5, title: "Daily digest workflow", href: "/automation/workflows/5" }, timestamp: now }
  ];
}

export async function getWorkspaceDashboardSummary(): Promise<WorkspaceDashboardSummary> {
  return {
    work: { label: "Open work items", value: 8, href: "/flow/work-items" },
    docs: { label: "Recent pages", value: 12, href: "/docs/pages" },
    incidents: { label: "Active incidents", value: 1, href: "/pulse/incidents" },
    engineering: { label: "Deployments", value: 4, href: "/dev/deployments" },
    ai: { label: "Assistant sessions", value: 3, href: "/settings/preferences" }
  };
}
