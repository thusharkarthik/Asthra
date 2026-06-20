"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DeskBackLink, DeskBreadcrumbs } from "@/components/desk/desk-breadcrumbs";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { DESK_PRIORITIES, DESK_TICKET_STATUSES, deskDate, isSlaAtRisk, queueNameFor } from "@/components/desk/desk-utils";
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
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
  const [feedback, setFeedback] = useState<string | null>(null);

  const ticketQuery = useQuery({ queryKey: ["desk", "ticket", id], queryFn: () => deskApi.getTicket(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["desk", "ticket-comments", id], queryFn: () => deskApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const approvalsQuery = useQuery({ queryKey: ["desk", "approvals", id], queryFn: () => deskApi.listApprovals(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const queuesQuery = useQuery({ queryKey: ["desk", "queues", selectedWorkspaceId], queryFn: () => deskApi.listQueues(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken && selectedWorkspaceId), retry: 1 });
  const incidentsQuery = useQuery({ queryKey: ["desk", "incidents", selectedWorkspaceId], queryFn: () => deskApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken && selectedWorkspaceId), retry: 1 });
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof deskApi.updateTicket>[2]) => deskApi.updateTicket(accessToken ?? "", id, payload),
    onSuccess: async () => {
      setFeedback("Ticket updated.");
      await queryClient.invalidateQueries({ queryKey: ["desk", "ticket", id] });
      await queryClient.invalidateQueries({ queryKey: ["desk", "tickets", selectedWorkspaceId] });
    },
    onError: () => setFeedback("Unable to update ticket.")
  });
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
      <DeskBackLink href="/desk/tickets" label="Back to Tickets" />
      <DeskBreadcrumbs items={[{ label: "Tickets", href: "/desk/tickets" }, { label: ticket.title }]} />
      <EntityDetailHeader
        title={ticket.title}
        description={ticket.description}
        meta={<><SLABadge value={ticket.status} /><PriorityBadge value={ticket.priority} /><span className="text-xs text-muted-foreground">Updated {deskDate(ticket.updated_at ?? ticket.created_at)}</span></>}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => updateMutation.mutate({ status: "resolved" })} disabled={updateMutation.isPending || ticket.status === "resolved" || ticket.status === "closed"}>Resolve Ticket</Button>
            <Button variant="outline" onClick={() => updateMutation.mutate({ status: "closed" })} disabled={updateMutation.isPending || ticket.status === "closed"}>Close Ticket</Button>
          </div>
        }
      />
      {feedback ? <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{feedback}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Overview">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Workspace</dt><dd className="font-medium">{ticket.workspace_id}</dd></div>
            <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{ticket.project_id ?? "Workspace-level"}</dd></div>
            <div><dt className="text-muted-foreground">Requester</dt><dd className="font-medium">{ticket.requester_name || ticket.requester_email || (ticket.requester_id ? `User ${ticket.requester_id}` : "Unknown")}</dd></div>
            <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{ticket.category ?? "uncategorized"}</dd></div>
            <div><dt className="text-muted-foreground">Assignee</dt><dd className="font-medium">{ticket.assignee_id ? `User ${ticket.assignee_id}` : "Unassigned"}</dd></div>
          </dl>
          <div className="mt-4 grid gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Edit title</span>
              <Input aria-label="Edit ticket title" defaultValue={ticket.title} onBlur={(event) => event.target.value.trim() && event.target.value !== ticket.title ? updateMutation.mutate({ title: event.target.value }) : undefined} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Edit description</span>
              <textarea className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" aria-label="Edit ticket description" defaultValue={ticket.description} onBlur={(event) => event.target.value !== ticket.description ? updateMutation.mutate({ description: event.target.value }) : undefined} />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Change status</span>
              <Select aria-label="Change ticket status" value={ticket.status} onChange={(event) => updateMutation.mutate({ status: event.target.value })}>
                {DESK_TICKET_STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Priority</span>
              <Select aria-label="Change ticket priority" value={ticket.priority} onChange={(event) => updateMutation.mutate({ priority: event.target.value })}>
                {DESK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <Input aria-label="Edit ticket category" defaultValue={ticket.category ?? ""} onBlur={(event) => updateMutation.mutate({ category: event.target.value || null })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Assign user ID</span>
              <Input aria-label="Assign ticket user ID" defaultValue={ticket.assignee_id ?? ""} onBlur={(event) => updateMutation.mutate({ assignee_id: event.target.value ? Number(event.target.value) : null, status: event.target.value ? "assigned" : ticket.status })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Queue</span>
              <Select aria-label="Assign ticket queue" value={String(ticket.queue_id ?? "")} onChange={(event) => updateMutation.mutate({ queue_id: event.target.value ? Number(event.target.value) : null })}>
                <option value="">Unqueued</option>
                {queues.map((queue) => <option key={queue.id} value={queue.id}>{queue.name}</option>)}
              </Select>
            </label>
          </div>
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
      <LinkedResourcesPanel entityType="desk_ticket" entityId={ticket.id} entityTitle={ticket.title} />
      <DetailPanel title="Activity">
        <div className="space-y-2 text-sm">
          <div className="rounded-md border p-3">
            <div className="font-medium">Ticket created</div>
            <p className="text-muted-foreground">{deskDate(ticket.created_at)}</p>
          </div>
          <div className="rounded-md border p-3">
            <div className="font-medium">Latest update</div>
            <p className="text-muted-foreground">{deskDate(ticket.updated_at ?? ticket.created_at)}</p>
          </div>
        </div>
      </DetailPanel>
      <DetailPanel title="Comments">
        <CommentList comments={(commentsQuery.data ?? []).map((comment) => ({ id: comment.id, content: comment.content, author: comment.author_id ? `User ${comment.author_id}` : "Unknown", created_at: comment.created_at }))} />
        <div className="mt-4"><CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} /></div>
      </DetailPanel>
    </div>
  );
}
