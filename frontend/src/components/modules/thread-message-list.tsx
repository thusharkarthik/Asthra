export type ThreadMessageItem = {
  id: string | number;
  content: string;
  author_id?: number | null;
  created_at?: string | null;
};

export function ThreadMessageList({ messages }: { messages: ThreadMessageItem[] }) {
  if (messages.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No messages yet.</div>;
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <div key={message.id} className="rounded-md border bg-background p-3">
          <div className="mb-1 text-xs text-muted-foreground">User {message.author_id ?? "unknown"}</div>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
