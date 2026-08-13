import type { EntityReference, PlatformSource } from "@/types/platform";

const sourceLabels: Record<string, string> = {
  core: "Core",
  flow: "Flow",
  docs: "Docs",
  discover: "Discover",
  desk: "Desk",
  pulse: "Pulse",
  dev: "Dev",
  collab: "Collab",
  automation: "Automation",
  connect: "Connect",
  guard: "Guard",
  insights: "Insights",
  media: "Media",
  ai: "AI"
};

const entityLabels: Record<string, string> = {
  work_item: "Work Item",
  docs_page: "Docs Page",
  idea: "Idea",
  ticket: "Ticket",
  incident: "Incident",
  release: "Release",
  thread: "Thread",
  workflow: "Workflow",
  dashboard: "Dashboard",
  project: "Project",
  media_asset: "Media Asset"
};

export function sourceLabel(source: PlatformSource | string) {
  return sourceLabels[source] ?? source;
}

export function entityLabel(entityType: string) {
  return entityLabels[entityType] ?? entityType.replaceAll("_", " ");
}

export function buildEntityHref(reference: Omit<Pick<EntityReference, "entity_type" | "entity_id" | "href">, never> & { source: string }) {
  if (reference.href) return reference.href;
  if (reference.source === "flow" && reference.entity_type === "work_item") return `/flow/work-items/${reference.entity_id}`;
  if (reference.source === "docs" && reference.entity_type === "docs_page") return `/docs/pages/${reference.entity_id}`;
  if (reference.source === "discover" && reference.entity_type === "idea") return `/discover/ideas/${reference.entity_id}`;
  if (reference.source === "desk" && reference.entity_type === "ticket") return `/desk/tickets/${reference.entity_id}`;
  if (reference.source === "pulse" && reference.entity_type === "incident") return `/pulse/incidents/${reference.entity_id}`;
  if (reference.source === "dev" && reference.entity_type === "release") return "/dev/releases";
  if (reference.source === "collab" && reference.entity_type === "thread") return `/collab/threads/${reference.entity_id}`;
  if (reference.source === "automation" && reference.entity_type === "workflow") return `/automation/workflows/${reference.entity_id}`;
  if (reference.source === "insights" && reference.entity_type === "dashboard") return "/insights/dashboards";
  if (reference.source === "media" && reference.entity_type === "media_asset") return `/media/assets/${reference.entity_id}`;
  return `/${reference.source}`;
}
