"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { isInProgressWorkItem, sortedByUpdatedAt, workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MyWorkPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const workItemsQuery = useQuery({
    queryKey: ["flow", "my-work", selectedProjectId, currentUser?.id],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, assignee_id: currentUser?.id, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const dueSoon = items.filter((item) => item.due_date).slice(0, 5);
  const highPriority = items.filter((item) => item.priority_id === 3 || item.priority_id === 4).slice(0, 5);
  const inProgress = items.filter(isInProgressWorkItem).slice(0, 5);

  return (
    <>
      <PageHeader title="My Work" description="Items assigned to you, upcoming work, and recently updated tasks." breadcrumbs={<FlowBreadcrumbs items={[{ label: "My Work" }]} />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view your work" /> : workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="grid gap-4 lg:grid-cols-4">
          <ModuleDashboardCard title="Assigned Items" value={items.length}>
            <WorkList items={sortedByUpdatedAt(items).slice(0, 5)} workflow={workflowQuery.data} empty={currentUser?.id ? "No assigned items." : "Current user matching is pending."} />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Due Soon" value={dueSoon.length}>
            <WorkList items={dueSoon} workflow={workflowQuery.data} empty="No due dates are set yet." />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="High Priority" value={highPriority.length}>
            <WorkList items={highPriority} workflow={workflowQuery.data} empty="No high priority items." />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="In Progress" value={inProgress.length}>
            <WorkList items={inProgress} workflow={workflowQuery.data} empty="No in-progress items." />
          </ModuleDashboardCard>
        </div>
      )}
    </>
  );
}

function WorkList({ items, workflow, empty }: { items: Array<{ id: number; title: string; status_id?: number | null; priority_id?: number | null }>; workflow?: Parameters<typeof workflowStatusLabelFor>[0]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="mt-2 flex gap-2"><StatusBadge value={workflowStatusLabelFor(workflow, item.status_id)} /><PriorityBadge value={item.priority_id} /></div>
        </Link>
      ))}
    </div>
  );
}
