"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { deskDate, isSlaAtRisk, queueNameFor } from "@/components/desk/desk-utils";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function TicketDetailPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);

  const ticketQuery = useQuery({ queryKey: ["desk", "ticket", id], queryFn: () => deskApi.getTicket(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["desk", "ticket-comments", id], queryFn: () => deskApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const approvalsQuery = useQuery({ queryKey: ["desk", "approvals", id], queryFn: () => deskApi.listApprovals(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const queuesQuery = useQuery({ queryKey: ["desk", "queues", selectedWorkspaceId], queryFn: () => deskApi.listQueues(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken && selectedWorkspaceId), retry: 1 });
  const incidentsQuery = useQuery({ queryKey: ["desk", "incidents", selectedWorkspaceId], queryFn: () => deskApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken && selectedWorkspaceId), retry: 1 });
  const classifyMutation = useMutation({ mutationFn: () => deskApi.classifyTicket(accessToken ?? "", id) });
  const commentMutation = useMutation({
    mutationFn: (content: string) => deskApi.createComment(accessToken ?? "", id, { content, author_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["desk", "ticket-comments", id] })
  });

  if (ticketQuery.isLoading) return <DetailPanel title="Ticket"><div className="text-sm text-muted-foreground">Loading ticket...</div></DetailPanel>;
  if (!ticketQuery.data) return <DetailPanel title="Ticket"><div className="text-sm text-destructive">Unable to load ticket.</div></DetailPanel>;

  const ticket = ticketQuery.data;
  const queues = queuesQuery.data ?? [];
  const linkedIncidents = (incidentsQuery.data ?? []).filter((incident) => incident.ticket_id === ticket.id);

  return (
    <div className="space-y-4">
      <DeskSubnav />
      <EntityDetailHeader
        title={ticket.title}
        description={ticket.description}
        meta={<><SLABadge value={ticket.status} /><PriorityBadge value={ticket.priority} /><span className="text-xs text-muted-foreground">Updated {deskDate(ticket.updated_at ?? ticket.created_at)}</span></>}
        actions={<Button onClick={() => classifyMutation.mutate()} disabled={classifyMutation.isPending}>{classifyMutation.isPending ? "Classifying..." : "AI classify ticket"}</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Overview">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Workspace</dt><dd className="font-medium">{ticket.workspace_id}</dd></div>
            <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{ticket.project_id ?? "Workspace-level"}</dd></div>
            <div><dt className="text-muted-foreground">Requester</dt><dd className="font-medium">{ticket.requester_id ? `User ${ticket.requester_id}` : "Unknown"}</dd></div>
            <div><dt className="text-muted-foreground">Assignee</dt><dd className="font-medium">{ticket.assignee_id ? `User ${ticket.assignee_id}` : "Unassigned"}</dd></div>
          </dl>
        </DetailPanel>
        <DetailPanel title="Queue">
          <div className="text-sm">
            <div className="font-medium">{queueNameFor(ticket, queues)}</div>
            <p className="mt-1 text-muted-foreground">Queue ownership and team capacity are placeholders until routing metadata is expanded.</p>
          </div>
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="SLA">
          <div className="space-y-2 text-sm">
            <SLABadge value={isSlaAtRisk(ticket) ? "at risk" : "on track"} />
            <p className="text-muted-foreground">SLA matching is inferred from priority for now. Queue-linked SLA targets will be shown when persisted relationships are available.</p>
          </div>
        </DetailPanel>
        <DetailPanel title="Approvals">
          {(approvalsQuery.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No approvals yet.</div> : (
            <div className="space-y-2">
              {(approvalsQuery.data ?? []).map((approval) => (
                <div key={approval.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><SLABadge value={approval.status} /><span className="text-muted-foreground">Approver {approval.approver_id ?? "Unassigned"}</span></div>
                  {approval.note ? <p className="mt-2 text-muted-foreground">{approval.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Escalations">
          <p className="text-sm text-muted-foreground">Escalation history placeholder. Future UI will show escalation reason, owner, status, and timestamps.</p>
        </DetailPanel>
        <DetailPanel title="Linked Incident">
          {linkedIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incident linked to this ticket yet.</p>
          ) : (
            <div className="space-y-2">
              {linkedIncidents.map((incident) => (
                <div key={incident.id} className="rounded-md border p-3">
                  <div className="font-medium">{incident.title}</div>
                  <div className="mt-2 flex gap-2"><SeverityBadge value={incident.severity} /><SLABadge value={incident.status} /></div>
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
      </div>
      <DetailPanel title="AI Classification">
        {classifyMutation.data ? (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><h3 className="font-medium">Category</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.category ?? "Uncategorized"}</p></div>
            <div><h3 className="font-medium">Priority Suggestion</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.priority_suggestion ?? "No suggestion"}</p></div>
            <div><h3 className="font-medium">Severity Suggestion</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.severity_suggestion ?? "No suggestion"}</p></div>
            <div><h3 className="font-medium">Routing Suggestion</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.routing_suggestion ?? "No routing suggestion"}</p></div>
            <div><h3 className="font-medium">Duplicate Hints</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.possible_duplicate_hints ?? "No duplicate hints"}</p></div>
            <div><h3 className="font-medium">Recommended Next Action</h3><p className="mt-1 text-muted-foreground">{classifyMutation.data.recommended_next_action ?? classifyMutation.data.raw_response ?? "Review ticket."}</p></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Run AI classification to suggest category, priority, severity, routing, duplicate hints, and recommended next action.</p>
        )}
      </DetailPanel>
      <DetailPanel title="Comments">
        <CommentList comments={(commentsQuery.data ?? []).map((comment) => ({ id: comment.id, content: comment.content, author: comment.author_id ? `User ${comment.author_id}` : "Unknown", created_at: comment.created_at }))} />
        <div className="mt-4"><CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} /></div>
      </DetailPanel>
    </div>
  );
}
