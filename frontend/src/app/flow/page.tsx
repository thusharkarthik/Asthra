"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Clock3, PlayCircle } from "lucide-react";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSetupState } from "@/components/flow/flow-setup-state";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import {
  formatWorkItemDate,
  isBlockedWorkItem,
  isCompletedWorkItem,
  isInProgressWorkItem,
  isOpenWorkItem,
  sortedByUpdatedAt
} from "@/components/flow/flow-utils";
import { WorkItemCreateDialog } from "@/components/flow/work-item-create-dialog";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const organizations = useWorkspaceStore((state) => state.organizations);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useWorkspaceStore((state) => state.projects);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  const hasOrganization = Boolean(selectedOrganizationId) || organizations.length > 0;
  const hasWorkspace = Boolean(selectedWorkspaceId) || workspaces.length > 0;
  const hasProject = Boolean(selectedProjectId) || projects.length > 0;

  const workItemsQuery = useQuery({
    queryKey: ["flow", "work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
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
  const releases = releasesQuery.data ?? [];
  const workLogsQuery = useQuery({
    queryKey: ["flow", "dashboard-work-logs", items.map((item) => item.id).join(",")],
    queryFn: async () => (await Promise.all(items.map((item) => flowApi.listWorkLogs(accessToken ?? "", item.id)))).flat(),
    enabled: Boolean(accessToken) && items.length > 0,
    retry: 1
  });
  const workLogs = workLogsQuery.data ?? [];
  const recentItems = sortedByUpdatedAt(items).slice(0, 6);
  const assignedToMe = items.filter((item) => item.assignee_id === currentUser?.id).slice(0, 5);
  const openCount = items.filter(isOpenWorkItem).length;
  const inProgressCount = items.filter(isInProgressWorkItem).length;
  const blockedCount = items.filter(isBlockedWorkItem).length;
  const completedCount = items.filter(isCompletedWorkItem).length;
  const upcomingReleases = releases.filter((release) => release.status === "planned").slice(0, 3);
  const activeReleases = releases.filter((release) => release.status === "active");
  const releaseProgress = releases.length ? Math.round(releases.reduce((sum, release) => sum + release.completion_percentage, 0) / releases.length) : 0;
  const plannedMinutes = items.reduce((sum, item) => sum + (item.original_estimate_minutes ?? 0), 0);
  const remainingMinutes = items.reduce((sum, item) => sum + (item.remaining_estimate_minutes ?? 0), 0);
  const loggedMinutes = workLogs.reduce((sum, log) => sum + log.time_spent_minutes, 0);

  const stats = [
    { title: "Open Work Items", value: openCount, icon: Clock3, tone: "text-blue-600" },
    { title: "In Progress", value: inProgressCount, icon: PlayCircle, tone: "text-amber-600" },
    { title: "Blocked", value: blockedCount, icon: AlertTriangle, tone: "text-red-600" },
    { title: "Completed", value: completedCount, icon: CheckCircle2, tone: "text-emerald-600" }
  ];

  return (
    <>
      <PageHeader
        title="Flow"
        description={selectedProject ? `Plan, track, and unblock work for ${selectedProject.name}.` : "Plan, track, and unblock work across projects."}
        actions={<FlowHeaderActions onCreate={() => setCreateOpen(true)} />}
      />
      <FlowSubnav />
      {!hasOrganization || !hasWorkspace || !hasProject ? (
        <FlowSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasProject={hasProject} />
      ) : workItemsQuery.isLoading ? (
        <LoadingState />
      ) : workItemsQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load Flow data. <Button size="sm" variant="outline" onClick={() => workItemsQuery.refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <ModuleDashboardCard key={stat.title} title={stat.title} value={stat.value}>
                  <div className={`flex items-center gap-2 text-xs ${stat.tone}`}>
                    <Icon className="h-4 w-4" />
                    Project scoped
                  </div>
                </ModuleDashboardCard>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ModuleDashboardCard title="Planned Effort" value={formatMinutes(plannedMinutes)}>
              <p className="text-sm text-muted-foreground">Original estimates across project work.</p>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Logged Time" value={formatMinutes(loggedMinutes)}>
              <p className="text-sm text-muted-foreground">Time logged from work item history.</p>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Remaining Estimate" value={formatMinutes(remainingMinutes)}>
              <p className="text-sm text-muted-foreground">Remaining project estimate.</p>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Upcoming Releases" value={upcomingReleases.length}>
              <div className="space-y-1 text-sm text-muted-foreground">
                {upcomingReleases.map((release) => (
                  <Link key={release.id} className="block truncate hover:text-foreground" href={`/flow/releases/${release.id}`}>{release.name} · {release.version}</Link>
                ))}
                {upcomingReleases.length === 0 ? <span>No upcoming releases planned.</span> : null}
              </div>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Active Releases" value={activeReleases.length}>
              <div className="space-y-1 text-sm text-muted-foreground">
                {activeReleases.slice(0, 3).map((release) => (
                  <Link key={release.id} className="block truncate hover:text-foreground" href={`/flow/releases/${release.id}`}>{release.name} · {release.completion_percentage}%</Link>
                ))}
                {activeReleases.length === 0 ? <span>No release is active.</span> : null}
              </div>
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Release Progress" value={`${releaseProgress}%`}>
              <p className="text-sm text-muted-foreground">Average completion across project releases.</p>
            </ModuleDashboardCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <ModuleDashboardCard title="Recent Work Items">
              {recentItems.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No work items yet. Create the first item to start planning this project.</p>
                  <Button size="sm" onClick={() => setCreateOpen(true)}>Create Work Item</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Updated {formatWorkItemDate(item.updated_at ?? item.created_at)}</div>
                        </div>
                        <StatusBadge value={item.status_id} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ModuleDashboardCard>

            <div className="space-y-4">
              <ModuleDashboardCard title="Assigned To Me">
                {assignedToMe.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items are assigned to you yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assignedToMe.map((item) => (
                      <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border p-3 hover:bg-muted">
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="mt-2 flex gap-2">
                          <StatusBadge value={item.status_id} />
                          <PriorityBadge value={item.priority_id} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Recent Activity">
                <div className="space-y-3 text-sm text-muted-foreground">
                  {recentItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex gap-2">
                      <Activity className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item.title} was updated {formatWorkItemDate(item.updated_at ?? item.created_at)}.</span>
                    </div>
                  ))}
                  {recentItems.length === 0 ? <span>Activity will appear after work items are created or updated.</span> : null}
                </div>
              </ModuleDashboardCard>
            </div>
          </div>
        </div>
      )}
      <WorkItemCreateDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
