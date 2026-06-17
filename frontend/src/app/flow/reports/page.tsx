"use client";

import { useQuery } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_EFFORT_SIZE_OPTIONS, FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS, isBlockedWorkItem, isCompletedWorkItem, isHighRiskWorkItem, isInProgressWorkItem, isOpenWorkItem, isOverdueWorkItem } from "@/components/flow/flow-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowReportsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const workItemsQuery = useQuery({
    queryKey: ["flow", "reports", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const completionRate = items.length ? Math.round((items.filter(isCompletedWorkItem).length / items.length) * 100) : 0;
  const countByStatus = (statusId: number) => items.filter((item) => item.status_id === statusId).length;
  const countByPriority = (priorityId: number) => items.filter((item) => item.priority_id === priorityId).length;
  const countByEffort = (effortSize: string) => items.filter((item) => item.effort_size === effortSize).length;

  return (
    <>
      <PageHeader title="Flow Reports" description="Lightweight project health indicators for work planning." />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view Flow reports" /> : workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="grid gap-4 md:grid-cols-4">
          <ModuleDashboardCard title="Total Items" value={items.length} />
          <ModuleDashboardCard title="Open" value={items.filter(isOpenWorkItem).length} />
          <ModuleDashboardCard title="In Progress" value={items.filter(isInProgressWorkItem).length} />
          <ModuleDashboardCard title="Blocked" value={items.filter(isBlockedWorkItem).length} />
          <ModuleDashboardCard title="High Risk" value={items.filter(isHighRiskWorkItem).length} />
          <ModuleDashboardCard title="Overdue" value={items.filter(isOverdueWorkItem).length} />
          <ModuleDashboardCard title="Completion Rate" value={`${completionRate}%`}>
            <p className="text-sm text-muted-foreground">Advanced charts are planned for the Insights integration.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="By Status" value={items.length}>
            <MetricList items={FLOW_STATUS_OPTIONS.map((status) => [status.label, countByStatus(Number(status.value))])} />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="By Priority" value={items.length}>
            <MetricList items={FLOW_PRIORITY_OPTIONS.map((priority) => [priority.label, countByPriority(Number(priority.value))])} />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="By Effort" value={items.filter((item) => item.effort_size).length}>
            <MetricList items={FLOW_EFFORT_SIZE_OPTIONS.map((effort) => [effort, countByEffort(effort)])} />
          </ModuleDashboardCard>
        </div>
      )}
    </>
  );
}

function MetricList({ items }: { items: Array<[string, number]> }) {
  return (
    <div className="space-y-1 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
