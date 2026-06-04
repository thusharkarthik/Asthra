"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";

export default function TicketDetailPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);

  const ticketQuery = useQuery({ queryKey: ["desk", "ticket", id], queryFn: () => deskApi.getTicket(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["desk", "ticket-comments", id], queryFn: () => deskApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const approvalsQuery = useQuery({ queryKey: ["desk", "approvals", id], queryFn: () => deskApi.listApprovals(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const classifyMutation = useMutation({ mutationFn: () => deskApi.classifyTicket(accessToken ?? "", id) });
  const commentMutation = useMutation({
    mutationFn: (content: string) => deskApi.createComment(accessToken ?? "", id, { content, author_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["desk", "ticket-comments", id] })
  });

  if (ticketQuery.isLoading) return <DetailPanel title="Ticket"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!ticketQuery.data) return <DetailPanel title="Ticket"><div className="text-sm text-destructive">Unable to load ticket.</div></DetailPanel>;

  const ticket = ticketQuery.data;

  return (
    <div className="space-y-4">
      <EntityDetailHeader
        title={ticket.title}
        description={ticket.description}
        meta={<><SLABadge value={ticket.status} /><PriorityBadge value={ticket.priority} /><span className="text-xs text-muted-foreground">Workspace {ticket.workspace_id}</span></>}
        actions={<Button onClick={() => classifyMutation.mutate()} disabled={classifyMutation.isPending}>{classifyMutation.isPending ? "Classifying..." : "AI classify"}</Button>}
      />
      {classifyMutation.data ? (
        <DetailPanel title="AI Classification">
          <div className="space-y-2 text-sm">
            <p><strong>Category:</strong> {classifyMutation.data.category ?? "Uncategorized"}</p>
            <p><strong>Next action:</strong> {classifyMutation.data.recommended_next_action ?? classifyMutation.data.raw_response ?? "Review ticket."}</p>
          </div>
        </DetailPanel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Approvals">
          {(approvalsQuery.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No approvals yet.</div> : (
            <div className="space-y-2">{(approvalsQuery.data ?? []).map((approval) => <SLABadge key={approval.id} value={approval.status} />)}</div>
          )}
        </DetailPanel>
        <DetailPanel title="SLA">
          <div className="text-sm text-muted-foreground">SLA target display placeholder. Queue-linked SLA details will be expanded later.</div>
        </DetailPanel>
      </div>
      <DetailPanel title="Comments">
        <CommentList comments={(commentsQuery.data ?? []).map((comment) => ({ id: comment.id, content: comment.content, author: comment.author_id ? `User ${comment.author_id}` : "Unknown", created_at: comment.created_at }))} />
        <div className="mt-4"><CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} /></div>
      </DetailPanel>
    </div>
  );
}
