export type TimelineItem = {
  id: string | number;
  title: string;
  content: string;
  timestamp?: string;
};

export function SimpleTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">No timeline events yet.</div>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-muted pl-3">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="text-sm text-muted-foreground">{item.content}</div>
          {item.timestamp ? <div className="mt-1 text-xs text-muted-foreground">{item.timestamp}</div> : null}
        </li>
      ))}
    </ol>
  );
}
