export type ActivityFeedItem = {
  id: string | number;
  title: string;
  description?: string | null;
  actor?: string | null;
  timestamp?: string | null;
};

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No activity yet.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border bg-background p-3">
          <div className="text-sm font-medium">{item.title}</div>
          {item.description ? <div className="mt-1 text-sm text-muted-foreground">{item.description}</div> : null}
          <div className="mt-2 text-xs text-muted-foreground">{item.actor ?? "System"}{item.timestamp ? ` · ${item.timestamp}` : ""}</div>
        </div>
      ))}
    </div>
  );
}
