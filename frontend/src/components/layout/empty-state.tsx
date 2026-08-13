import { Inbox } from "lucide-react";

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
      <Inbox className="mb-3 h-6 w-6 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}
