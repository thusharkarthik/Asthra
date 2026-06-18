"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateQueueDialog } from "@/components/desk/desk-create-dialogs";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { Button } from "@/components/ui/button";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function QueuesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const queuesQuery = useQuery({ queryKey: ["desk", "queues", selectedWorkspaceId], queryFn: () => deskApi.listQueues(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const ticketsQuery = useQuery({ queryKey: ["desk", "tickets", selectedWorkspaceId], queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const queues = queuesQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Queues" description="Route support work to the right team or operational group." actions={<Button onClick={() => setOpen(true)}>Create queue</Button>} />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : queuesQuery.isLoading ? <LoadingState /> : queues.length === 0 ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="queues" /> : (
        <EntityTable columns={["Queue Name", "Description", "Ticket Count", "Owner / Team"]}>
          {queues.map((queue) => (
            <EntityTableRow key={queue.id} columns={4}>
              <span className="font-medium">{queue.name}</span>
              <span className="text-muted-foreground">{queue.description ?? "No description"}</span>
              <span>{tickets.filter((ticket) => ticket.queue_id === queue.id).length} tickets</span>
              <span className="text-muted-foreground">Team placeholder</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
      <CreateQueueDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
