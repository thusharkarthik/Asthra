"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateChangeRequestDialog, CreateQueueDialog, CreateSlaDialog, CreateTicketDialog } from "@/components/desk/desk-create-dialogs";
import { DeskHeaderActions } from "@/components/desk/desk-header-actions";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { isHighPriorityTicket, isOpenTicket, isSlaAtRisk, needsAttention, queueNameFor } from "@/components/desk/desk-utils";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DeskPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ["desk", "tickets", selectedWorkspaceId],
    queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const queuesQuery = useQuery({ queryKey: ["desk", "queues", selectedWorkspaceId], queryFn: () => deskApi.listQueues(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const slasQuery = useQuery({ queryKey: ["desk", "slas", selectedWorkspaceId], queryFn: () => deskApi.listSlas(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const incidentsQuery = useQuery({ queryKey: ["desk", "incidents", selectedWorkspaceId], queryFn: () => deskApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const changesQuery = useQuery({ queryKey: ["desk", "change-requests", selectedWorkspaceId], queryFn: () => deskApi.listChangeRequests(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  const tickets = ticketsQuery.data ?? [];
  const queues = queuesQuery.data ?? [];
  const slas = slasQuery.data ?? [];
  const incidents = incidentsQuery.data ?? [];
  const changes = changesQuery.data ?? [];
  const openTickets = tickets.filter(isOpenTicket);
  const highPriority = tickets.filter(isHighPriorityTicket);
  const slaAtRisk = tickets.filter(isSlaAtRisk);
  const myTickets = tickets.filter((ticket) => ticket.assignee_id === currentUser?.id || ticket.requester_id === currentUser?.id);
  const attentionTickets = tickets.filter(needsAttention);
  const queueCounts = queues.map((queue) => ({ queue, count: tickets.filter((ticket) => ticket.queue_id === queue.id).length }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Desk"
        description="Manage support tickets, service requests, queues, SLAs, approvals, incidents, escalations, and operational changes."
        actions={<DeskHeaderActions onCreateTicket={() => setTicketOpen(true)} onCreateQueue={() => setQueueOpen(true)} onCreateSla={() => setSlaOpen(true)} onCreateChangeRequest={() => setChangeOpen(true)} />}
      />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : (
        <>
          <ModuleStatsGrid
            stats={[
              { title: "Open Tickets", value: openTickets.length, description: "Active service requests" },
              { title: "High Priority Tickets", value: highPriority.length, description: "High or critical priority" },
              { title: "SLA At Risk", value: slaAtRisk.length, description: "Priority tickets needing attention" },
              { title: "Pending Approvals", value: "Review", description: "Approval queue foundation" },
              { title: "Active Incidents", value: incidents.filter((incident) => incident.status !== "resolved").length, description: "Linked operational incidents" },
              { title: "Change Requests", value: changes.length, description: "Operational change pipeline" }
            ]}
          />
          {ticketsQuery.isLoading ? <LoadingState /> : tickets.length === 0 ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="tickets" /> : (
            <div className="grid gap-4 xl:grid-cols-2">
              <ModuleDashboardCard title="Recent Tickets">
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => (
                    <Link key={ticket.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/desk/tickets/${ticket.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{ticket.title}</div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                        </div>
                        <PriorityBadge value={ticket.priority} />
                      </div>
                      <div className="mt-2 flex gap-2"><SLABadge value={ticket.status} /><span className="text-xs text-muted-foreground">{queueNameFor(ticket, queues)}</span></div>
                    </Link>
                  ))}
                </div>
              </ModuleDashboardCard>
              <ModuleDashboardCard title="My Assigned Tickets">
                {myTickets.length === 0 ? <EmptyState title="No tickets assigned to you" /> : (
                  <div className="space-y-3">
                    {myTickets.slice(0, 5).map((ticket) => (
                      <Link key={ticket.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/60" href={`/desk/tickets/${ticket.id}`}>
                        <span className="font-medium">{ticket.title}</span>
                        <PriorityBadge value={ticket.priority} />
                      </Link>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Tickets Needing Attention">
                {attentionTickets.length === 0 ? <EmptyState title="No tickets need immediate attention" /> : (
                  <div className="space-y-3">
                    {attentionTickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="rounded-md border p-3">
                        <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /><Link className="font-medium text-primary hover:underline" href={`/desk/tickets/${ticket.id}`}>{ticket.title}</Link></div>
                        <div className="mt-2 flex gap-2"><PriorityBadge value={ticket.priority} /><SLABadge value={ticket.assignee_id ? "assigned" : "unassigned"} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Queue Summary">
                {queues.length === 0 ? <DeskSetupState hasOrganization hasWorkspace mode="queues" /> : (
                  <div className="space-y-3">
                    {queueCounts.map(({ queue, count }) => (
                      <div key={queue.id} className="flex items-center justify-between rounded-md border p-3">
                        <div><div className="font-medium">{queue.name}</div><p className="text-sm text-muted-foreground">{queue.description ?? "No description"}</p></div>
                        <span className="text-sm font-medium">{count} tickets</span>
                      </div>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="SLA Overview">
                {slas.length === 0 ? <DeskSetupState hasOrganization hasWorkspace mode="slas" /> : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {slas.slice(0, 4).map((sla) => (
                      <div key={sla.id} className="rounded-md border p-3">
                        <div className="font-medium">{sla.name}</div>
                        <div className="mt-2 flex gap-2"><PriorityBadge value={sla.priority} /><span className="text-xs text-muted-foreground">{sla.response_time_minutes}m response</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Service Workflow">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Capture", text: "Create tickets with requester, category, priority, and queue context." },
                    { title: "Route", text: "Assign tickets to queues and owners for follow-up." },
                    { title: "Resolve", text: "Move work through open, assigned, in progress, waiting, resolved, and closed." },
                    { title: "Review", text: "Use reports and SLA indicators to understand support load." }
                  ].map((item) => (
                    <div key={item.title} className="rounded-md border p-3">
                      <div className="text-sm font-medium">{item.title}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </ModuleDashboardCard>
            </div>
          )}
        </>
      )}
      <CreateTicketDialog open={ticketOpen} onOpenChange={setTicketOpen} />
      <CreateQueueDialog open={queueOpen} onOpenChange={setQueueOpen} />
      <CreateSlaDialog open={slaOpen} onOpenChange={setSlaOpen} />
      <CreateChangeRequestDialog open={changeOpen} onOpenChange={setChangeOpen} />
    </div>
  );
}
