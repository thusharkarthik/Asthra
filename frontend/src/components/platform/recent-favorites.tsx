import { EntityLink } from "@/components/platform/entity-link";
import type { FavoriteItem, RecentItem } from "@/types/platform";

export function RecentItemsList({ title, items }: { title: string; items: RecentItem[] }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      {items.length === 0 ? <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No recent items yet.</div> : items.map((item) => <EntityLink key={`${item.source}-${item.entity_type}-${item.entity_id}`} reference={item} compact />)}
    </div>
  );
}

export function FavoritesList({ items }: { items: FavoriteItem[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No favorites yet.</div> : items.map((item) => <EntityLink key={`${item.source}-${item.entity_type}-${item.entity_id}`} reference={item} compact />)}
    </div>
  );
}
