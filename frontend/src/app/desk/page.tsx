"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DeskPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const ticketsQuery = useQuery({
    queryKey: ["desk", "tickets", selectedWorkspaceId],
    queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const queuesQuery = useQuery({ queryKey: ["desk", "queues"], queryFn: () => deskApi.listQueues(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const slasQuery = useQuery({ queryKey: ["desk", "slas"], queryFn: () => deskApi.listSlas(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });

  const tickets = ticketsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Desk" description="Service management workspace for tickets, queues, SLAs, approvals, incidents, and changes." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to load Desk" /> : (
        <>
          <ModuleStatsGrid
            stats={[
              { title: "Tickets", value: tickets.length, description: "Recent requests in this workspace" },
              { title: "Queues", value: (queuesQuery.data ?? []).length, description: "Support routing queues" },
              { title: "SLAs", value: (slasQuery.data ?? []).length, description: "Response and resolution targets" }
            ]}
          />
          <ModuleDashboardCard title="Recent Tickets">
            {ticketsQuery.isLoading ? <LoadingState /> : tickets.length === 0 ? <EmptyState title="No tickets yet" /> : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Link key={ticket.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/desk/tickets/${ticket.id}`}>
                    <div className="font-medium">{ticket.title}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</div>
                    <div className="mt-2 flex gap-2"><SLABadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div>
                  </Link>
                ))}
              </div>
            )}
          </ModuleDashboardCard>
        </>
      )}
    </div>
  );
}
