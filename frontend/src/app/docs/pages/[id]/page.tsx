"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PageDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isEditing, setEditing] = useState(false);
  const pageQuery = useQuery({ queryKey: ["docs", "page", id], queryFn: () => docsApi.getPage(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["docs", "comments", id], queryFn: () => docsApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const updateMutation = useMutation({
    mutationFn: () => docsApi.updatePage(accessToken ?? "", id, { title, content, updated_by_id: currentUser?.id }),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["docs", "page", id] });
    }
  });
  const commentMutation = useMutation({
    mutationFn: (comment: string) => docsApi.createComment(accessToken ?? "", id, { content: comment, user_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs", "comments", id] })
  });
  const page = pageQuery.data;
  const startEditing = () => {
    setTitle(page?.title ?? "");
    setContent(page?.content ?? "");
    setEditing(true);
  };
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate();
  };

  if (pageQuery.isLoading) return <DetailPanel title="Page"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!page) return <DetailPanel title="Page"><div className="text-sm text-destructive">Unable to load page.</div></DetailPanel>;

  return (
    <div className="space-y-4">
      <DetailPanel title={page.title}>
        {isEditing ? (
          <form className="space-y-3" onSubmit={handleSave}>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            <textarea className="min-h-48 w-full rounded-md border bg-background p-3 text-sm" value={content} onChange={(event) => setContent(event.target.value)} />
            <div className="flex gap-2">
              <Button disabled={updateMutation.isPending}>Save</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={page.status ?? "draft"} />
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Version info placeholder</span>
            </div>
            <article className="whitespace-pre-wrap text-sm">{page.content || "No content."}</article>
            <div className="flex gap-2">
              <Button size="sm" onClick={startEditing}>Edit</Button>
              <Button size="sm" variant="outline">AI summary placeholder</Button>
            </div>
          </div>
        )}
      </DetailPanel>
      <DetailPanel title="Comments">
        <div className="space-y-3">
          <CommentList comments={commentsQuery.data ?? []} />
          <CommentComposer onSubmit={(comment) => commentMutation.mutate(comment)} isSubmitting={commentMutation.isPending} />
        </div>
      </DetailPanel>
    </div>
  );
}
