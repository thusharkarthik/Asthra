import { entityLabel, sourceLabel } from "@/services/platform/entity-links";

export function SourceBadge({ source }: { source: string }) {
  return <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{sourceLabel(source)}</span>;
}

export function EntityBadge({ entityType }: { entityType: string }) {
  return <span className="rounded border px-2 py-0.5 text-xs font-medium">{entityLabel(entityType)}</span>;
}
