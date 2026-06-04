"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";

export default function WorkItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);

  const itemQuery = useQuery({ queryKey: ["flow", "work-item", id], queryFn: () => flowApi.getWorkItem(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["flow", "comments", id], queryFn: () => flowApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentMutation = useMutation({
    mutationFn: (content: string) => flowApi.createComment(accessToken ?? "", id, { content, user_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flow", "comments", id] })
  });

  if (itemQuery.isLoading) return <DetailPanel title="Work item"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (itemQuery.error || !itemQuery.data) return <DetailPanel title="Work item"><div className="text-sm text-destructive">Unable to load work item.</div></DetailPanel>;

  const item = itemQuery.data;
  return (
    <div className="space-y-4">
      <DetailPanel title={item.title}>
        <div className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{item.description || "No description."}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={item.status_id} />
            <PriorityBadge value={item.priority_id} />
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Assignee: {item.assignee_id ?? "Unassigned"}</span>
          </div>
          <Button variant="outline" size="sm">AI breakdown placeholder</Button>
        </div>
      </DetailPanel>
      <DetailPanel title="Comments">
        <div className="space-y-3">
          <CommentList comments={commentsQuery.data ?? []} />
          <CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} />
        </div>
      </DetailPanel>
    </div>
  );
}
