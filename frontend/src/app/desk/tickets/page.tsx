"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateTicketDialog } from "@/components/desk/desk-create-dialogs";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { DESK_PRIORITIES, DESK_TICKET_STATUSES, deskDate, isSlaAtRisk, queueNameFor } from "@/components/desk/desk-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function TicketsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [queue, setQueue] = useState("all");
  const [assignee, setAssignee] = useState("all");

  const ticketsQuery = useQuery({
    queryKey: ["desk", "tickets", selectedWorkspaceId],
    queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const queuesQuery = useQuery({ queryKey: ["desk", "queues", selectedWorkspaceId], queryFn: () => deskApi.listQueues(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  const tickets = ticketsQuery.data ?? [];
  const queues = queuesQuery.data ?? [];
  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch = !term || `${ticket.title} ${ticket.description}`.toLowerCase().includes(term);
      const matchesStatus = status === "all" || ticket.status === status;
      const matchesPriority = priority === "all" || ticket.priority === priority;
      const matchesQueue = queue === "all" || String(ticket.queue_id ?? "none") === queue;
      const matchesAssignee = assignee === "all" || (assignee === "assigned" ? Boolean(ticket.assignee_id) : !ticket.assignee_id);
      return matchesSearch && matchesStatus && matchesPriority && matchesQueue && matchesAssignee;
    });
  }, [assignee, priority, queue, search, status, tickets]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" description="Track, route, and resolve support tickets and service requests." actions={<Button onClick={() => setOpen(true)}>Create ticket</Button>} />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_150px_150px_160px_160px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Search tickets" className="pl-9" placeholder="Search tickets or descriptions" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <Select aria-label="Filter ticket status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {DESK_TICKET_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
            </Select>
            <Select aria-label="Filter ticket priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="all">All priorities</option>
              {DESK_PRIORITIES.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
            <Select aria-label="Filter ticket queue" value={queue} onChange={(event) => setQueue(event.target.value)}>
              <option value="all">All queues</option>
              <option value="none">Unqueued</option>
              {queues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <Select aria-label="Filter ticket assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="all">All assignees</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </Select>
          </div>
          {ticketsQuery.isLoading ? <LoadingState /> : ticketsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load tickets.</div>
          ) : tickets.length === 0 ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="tickets" /> : filteredTickets.length === 0 ? <EmptyState title="No tickets match the current filters" /> : (
            <EntityTable columns={["Title", "Status", "Priority", "Queue", "Requester", "Assignee", "SLA", "Updated"]}>
              {filteredTickets.map((ticket) => (
                <EntityTableRow key={ticket.id} columns={8}>
                  <Link className="font-medium text-primary hover:underline" href={`/desk/tickets/${ticket.id}`}>{ticket.title}</Link>
                  <SLABadge value={ticket.status} />
                  <PriorityBadge value={ticket.priority} />
                  <span>{queueNameFor(ticket, queues)}</span>
                  <span>{ticket.requester_id ? `User ${ticket.requester_id}` : "Unknown"}</span>
                  <span>{ticket.assignee_id ? `User ${ticket.assignee_id}` : "Unassigned"}</span>
                  <SLABadge value={isSlaAtRisk(ticket) ? "at risk" : "on track"} />
                  <span className="text-muted-foreground">{deskDate(ticket.updated_at ?? ticket.created_at)}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateTicketDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
