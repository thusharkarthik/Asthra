"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);

  const workItemsQuery = useQuery({
    queryKey: ["flow", "work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });

  const items = workItemsQuery.data ?? [];
  const byStatus = items.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.status_id ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Flow" description="Work management dashboard for tasks, issues, boards, and comments." />
      {!selectedProjectId ? (
        <EmptyState title="Select a project to load Flow work items" />
      ) : workItemsQuery.isLoading ? (
        <LoadingState />
      ) : workItemsQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load Flow data. <Button size="sm" variant="outline" onClick={() => workItemsQuery.refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ModuleDashboardCard title="Work Items" value={items.length}>
              <Link className="text-sm text-primary hover:underline" href="/flow/work-items">View all work items</Link>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Status Summary">
              <div className="space-y-2 text-sm">
                {Object.entries(byStatus).length === 0 ? "No statuses yet." : Object.entries(byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge value={status} />
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Boards">
              <Link className="text-sm text-primary hover:underline" href="/flow/boards">Open Kanban boards</Link>
            </ModuleDashboardCard>
          </div>
          <ModuleDashboardCard title="Recent Work Items">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No work items yet.</div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-2"><StatusBadge value={item.status_id} /></div>
                  </Link>
                ))}
              </div>
            )}
          </ModuleDashboardCard>
        </div>
      )}
    </>
  );
}
