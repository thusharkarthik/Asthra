"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { deskDate } from "@/components/desk/desk-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const ticketsQuery = useQuery({ queryKey: ["desk", "tickets", selectedWorkspaceId], queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const approvalsQuery = useQuery({
    queryKey: ["desk", "approvals", "workspace", selectedWorkspaceId],
    queryFn: async () => {
      const tickets = ticketsQuery.data ?? [];
      const nested = await Promise.all(tickets.map((ticket) => deskApi.listApprovals(accessToken ?? "", ticket.id).then((approvals) => approvals.map((approval) => ({ approval, ticket })))));
      return nested.flat();
    },
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId) && Boolean(ticketsQuery.data),
    retry: 1
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => deskApi.updateApproval(accessToken ?? "", id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["desk", "approvals", "workspace", selectedWorkspaceId] })
  });
  const approvals = approvalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Review ticket approvals and service operation decisions." />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : ticketsQuery.isLoading || approvalsQuery.isLoading ? <LoadingState /> : approvals.length === 0 ? <EmptyState title="No approvals are waiting for review" /> : (
        <EntityTable columns={["Ticket", "Requested By", "Approver", "Status", "Created", "Decision"]}>
          {approvals.map(({ approval, ticket }) => (
            <EntityTableRow key={approval.id} columns={6}>
              <Link className="font-medium text-primary hover:underline" href={`/desk/tickets/${ticket.id}`}>{ticket.title}</Link>
              <span>{ticket.requester_id ? `User ${ticket.requester_id}` : "Unknown"}</span>
              <span>{approval.approver_id ? `User ${approval.approver_id}` : "Unassigned"}</span>
              <SLABadge value={approval.status} />
              <span className="text-muted-foreground">{deskDate(approval.created_at)}</span>
              <span className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: approval.id, status: "approved" })}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: approval.id, status: "rejected" })}>Reject</Button>
              </span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
    </div>
  );
}
