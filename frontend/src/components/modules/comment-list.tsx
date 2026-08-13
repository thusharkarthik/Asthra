export type CommentItem = {
  id: number | string;
  content: string;
  user_id?: number | null;
  created_at?: string;
};

export function CommentList({ comments }: { comments: CommentItem[] }) {
  if (comments.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No comments yet.</div>;
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-md border bg-background p-3 text-sm">
          <div className="mb-1 text-xs text-muted-foreground">User {comment.user_id ?? "unknown"}</div>
          <div className="whitespace-pre-wrap">{comment.content}</div>
        </div>
      ))}
    </div>
  );
}
