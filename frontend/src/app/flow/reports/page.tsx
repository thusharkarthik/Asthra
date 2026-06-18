"use client";

import { useQuery } from "@tanstack/react-query";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_EFFORT_SIZE_OPTIONS, FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS, isBlockedWorkItem, isHighRiskWorkItem, isOverdueWorkItem } from "@/components/flow/flow-utils";
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
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const sprintsQuery = useQuery({
    queryKey: ["flow", "sprints", selectedProjectId],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const releasesQuery = useQuery({
    queryKey: ["flow", "releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const capacityQuery = useQuery({
    queryKey: ["flow", "capacity", selectedProjectId],
    queryFn: () => flowApi.listCapacity(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const workLogsQuery = useQuery({
    queryKey: ["flow", "report-work-logs", items.map((item) => item.id).join(",")],
    queryFn: async () => (await Promise.all(items.map((item) => flowApi.listWorkLogs(accessToken ?? "", item.id)))).flat(),
    enabled: Boolean(accessToken) && items.length > 0,
    retry: 1
  });
  const sprints = sprintsQuery.data ?? [];
  const releases = releasesQuery.data ?? [];
  const capacities = capacityQuery.data ?? [];
  const workLogs = workLogsQuery.data ?? [];
  const completedSprints = sprints.filter((sprint) => sprint.status === "completed");
  const activeSprint = sprints.find((sprint) => sprint.status === "active");
  const sprintVelocity = completedSprints.length ? Math.round(completedSprints.reduce((sum, sprint) => sum + sprint.completed_work_count, 0) / completedSprints.length) : 0;
  const activeSprintCompletion = activeSprint?.planned_work_count ? Math.round((activeSprint.completed_work_count / activeSprint.planned_work_count) * 100) : 0;
  const effortCompleted = sprints.reduce((sum, sprint) => sprint.status === "completed" ? sum + sprint.total_effort : sum, 0);
  const activeRelease = releases.find((release) => release.status === "active");
  const releaseCompletion = releases.length ? Math.round(releases.reduce((sum, release) => sum + release.completion_percentage, 0) / releases.length) : 0;
  const releaseRisk = activeRelease ? items.filter((item) => item.release_id === activeRelease.id && (isBlockedWorkItem(item) || isHighRiskWorkItem(item))).length : 0;
  const workflowStatuses = workflowQuery.data?.statuses.length
    ? workflowQuery.data.statuses
    : FLOW_STATUS_OPTIONS.map((status) => ({ id: Number(status.value), name: status.label, category: status.name === "done" ? "completed" : status.name === "review" ? "review" : status.name === "in_progress" ? "active" : "backlog" }));
  const completedStatusIds = new Set(workflowStatuses.filter((status) => status.category === "completed").map((status) => status.id));
  const activeStatusIds = new Set(workflowStatuses.filter((status) => status.category === "active" || status.category === "review").map((status) => status.id));
  const completionRate = items.length ? Math.round((items.filter((item) => completedStatusIds.has(item.status_id ?? 0)).length / items.length) * 100) : 0;
  const countByStatus = (statusId: number) => items.filter((item) => item.status_id === statusId).length;
  const countByPriority = (priorityId: number) => items.filter((item) => item.priority_id === priorityId).length;
  const countByEffort = (effortSize: string) => items.filter((item) => item.effort_size === effortSize).length;
  const capacityMinutes = capacities.reduce((sum, entry) => sum + entry.capacity_minutes, 0);
  const originalEstimateMinutes = items.reduce((sum, item) => sum + (item.original_estimate_minutes ?? 0), 0);
  const remainingEstimateMinutes = items.reduce((sum, item) => sum + (item.remaining_estimate_minutes ?? 0), 0);
  const loggedMinutes = workLogs.reduce((sum, log) => sum + log.time_spent_minutes, 0);
  const overCapacityItems = items.filter((item) => (item.remaining_estimate_minutes ?? 0) > (item.original_estimate_minutes ?? Number.MAX_SAFE_INTEGER)).length;

  return (
    <>
      <PageHeader title="Flow Reports" description="Lightweight project health indicators for work planning." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Reports" }]} />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view Flow reports" /> : workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="grid gap-4 md:grid-cols-4">
          <ModuleDashboardCard title="Total Items" value={items.length} />
          <ModuleDashboardCard title="Open" value={items.filter((item) => !completedStatusIds.has(item.status_id ?? 0)).length} />
          <ModuleDashboardCard title="Active / Review" value={items.filter((item) => activeStatusIds.has(item.status_id ?? 0)).length} />
          <ModuleDashboardCard title="Blocked" value={items.filter(isBlockedWorkItem).length} />
          <ModuleDashboardCard title="High Risk" value={items.filter(isHighRiskWorkItem).length} />
          <ModuleDashboardCard title="Overdue" value={items.filter(isOverdueWorkItem).length} />
          <ModuleDashboardCard title="Completion Rate" value={`${completionRate}%`}>
            <p className="text-sm text-muted-foreground">Advanced charts are planned for the Insights integration.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Sprint Summary" value={sprints.length}>
            <p className="text-sm text-muted-foreground">{activeSprint ? `Active: ${activeSprint.name}` : "No active sprint."}</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Velocity" value={sprintVelocity}>
            <p className="text-sm text-muted-foreground">Average completed work items per completed sprint.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Sprint Completion" value={`${activeSprintCompletion}%`} />
          <ModuleDashboardCard title="Effort Completed" value={effortCompleted} />
          <ModuleDashboardCard title="Capacity Summary" value={formatMinutes(capacityMinutes)}>
            <p className="text-sm text-muted-foreground">Manual project and sprint capacity entries.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Estimate vs Actual" value={`${formatMinutes(originalEstimateMinutes)} / ${formatMinutes(loggedMinutes)}`}>
            <p className="text-sm text-muted-foreground">Original estimate compared with logged time.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Remaining Estimate" value={formatMinutes(remainingEstimateMinutes)} />
          <ModuleDashboardCard title="Over Capacity Items" value={overCapacityItems} />
          <ModuleDashboardCard title="Release Summary" value={releases.length}>
            <p className="text-sm text-muted-foreground">{activeRelease ? `Active: ${activeRelease.name}` : "No active release."}</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Release Completion" value={`${releaseCompletion}%`} />
          <ModuleDashboardCard title="Release Risk" value={releaseRisk}>
            <p className="text-sm text-muted-foreground">Blocked or high-risk items in the active release.</p>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Work Distribution" value={items.filter((item) => item.release_id).length}>
            <MetricList items={releases.slice(0, 5).map((release) => [release.name, items.filter((item) => item.release_id === release.id).length])} />
          </ModuleDashboardCard>
          <ModuleDashboardCard title="By Status" value={items.length}>
            <MetricList items={workflowStatuses.map((status) => [status.name, countByStatus(status.id)])} />
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

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
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
