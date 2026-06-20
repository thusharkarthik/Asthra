"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DeskBreadcrumbs } from "@/components/desk/desk-breadcrumbs";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { isOpenTicket, isSlaAtRisk } from "@/components/desk/desk-utils";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DeskReportsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const ticketsQuery = useQuery({
    queryKey: ["desk", "tickets", selectedWorkspaceId, "reports"],
    queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const tickets = ticketsQuery.data ?? [];
  const assigned = tickets.filter((ticket) => Boolean(ticket.assignee_id));
  const inProgress = tickets.filter((ticket) => ticket.status === "in_progress");
  const resolved = tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status));

  return (
    <div className="space-y-4">
      <PageHeader title="Desk Reports" description="Support workload and ticket lifecycle summaries." />
      <DeskSubnav />
      <DeskBreadcrumbs items={[{ label: "Reports" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view Desk reports" /> : ticketsQuery.isLoading ? <LoadingState /> : (
        <ModuleStatsGrid
          stats={[
            { title: "Open Tickets", value: tickets.filter(isOpenTicket).length, description: "Tickets still requiring action" },
            { title: "Assigned Tickets", value: assigned.length, description: "Tickets routed to an owner" },
            { title: "In Progress", value: inProgress.length, description: "Tickets currently being worked" },
            { title: "Resolved", value: resolved.length, description: "Resolved or closed tickets" },
            { title: "SLA Risk", value: tickets.filter(isSlaAtRisk).length, description: "Priority tickets needing attention" }
          ]}
        />
      )}
    </div>
  );
}
