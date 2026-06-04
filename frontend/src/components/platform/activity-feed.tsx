import { EntityLink } from "@/components/platform/entity-link";
import type { ActivityItem } from "@/types/platform";

export function PlatformActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No platform activity yet.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border bg-card p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{item.actor}</span>
            <span className="text-muted-foreground">{item.action}</span>
            <span className="text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
          </div>
          <EntityLink reference={item.entity} compact />
        </div>
      ))}
    </div>
  );
}
