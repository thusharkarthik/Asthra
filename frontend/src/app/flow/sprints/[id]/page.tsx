"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { isBlockedWorkItem, isHighRiskWorkItem } from "@/components/flow/flow-utils";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

export default function FlowSprintDetailPage() {
  const params = useParams<{ id: string }>();
  const sprintId = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const sprintQuery = useQuery({ queryKey: ["flow", "sprint", sprintId], queryFn: () => flowApi.getSprint(accessToken ?? "", sprintId), enabled: Boolean(accessToken && sprintId), retry: 1 });
  const sprint = sprintQuery.data;
  const workItemsQuery = useQuery({
    queryKey: ["flow", "sprint-work-items", sprintId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { sprint_id: Number(sprintId), limit: 100 }),
    enabled: Boolean(accessToken && sprintId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const completion = sprint?.planned_work_count ? Math.round((sprint.completed_work_count / sprint.planned_work_count) * 100) : 0;

  const startMutation = useMutation({
    mutationFn: () => flowApi.startSprint(accessToken ?? "", sprintId),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint started" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });
  const completeMutation = useMutation({
    mutationFn: () => flowApi.completeSprint(accessToken ?? "", sprintId),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint completed" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });

  if (sprintQuery.isLoading || !sprint) {
    return (
      <>
        <FlowSubnav />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={sprint.name}
        description={sprint.goal || "Sprint execution plan."}
        actions={<div className="flex gap-2">
          {sprint.status !== "active" && sprint.status !== "completed" ? <Button variant="outline" onClick={() => startMutation.mutate()}>Start Sprint</Button> : null}
          {sprint.status === "active" ? <Button variant="outline" onClick={() => completeMutation.mutate()}>Complete Sprint</Button> : null}
          <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/sprints">Back to Sprints</Link>
        </div>}
      />
      <FlowSubnav />
      <div className="grid gap-4 md:grid-cols-4">
        <ModuleDashboardCard title="Progress" value={`${completion}%`} />
        <ModuleDashboardCard title="Completed" value={sprint.completed_work_count} />
        <ModuleDashboardCard title="Remaining" value={Math.max(sprint.planned_work_count - sprint.completed_work_count, 0)} />
        <ModuleDashboardCard title="Total Effort" value={sprint.total_effort} />
        {sprint.status === "active" ? <ModuleDashboardCard title="Blocked Work" value={items.filter(isBlockedWorkItem).length} /> : null}
        {sprint.status === "active" ? <ModuleDashboardCard title="High Risk Work" value={items.filter(isHighRiskWorkItem).length} /> : null}
      </div>
      <DetailPanel title="Sprint Details">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div><div className="text-muted-foreground">Status</div><div className="font-medium">{sprint.status}</div></div>
          <div><div className="text-muted-foreground">Start</div><div className="font-medium">{sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : "Not set"}</div></div>
          <div><div className="text-muted-foreground">End</div><div className="font-medium">{sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : "Not set"}</div></div>
          <div><div className="text-muted-foreground">Work Items</div><div className="font-medium">{sprint.planned_work_count}</div></div>
        </div>
      </DetailPanel>
      <DetailPanel title="Work Items">
        {items.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No work assigned to this sprint yet.</p> : (
          <EntityTable columns={["Title", "Status", "Priority", "Effort"]}>
            {items.map((item) => (
              <EntityTableRow key={item.id} columns={4}>
                <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
                <StatusBadge value={item.status_id} />
                <PriorityBadge value={item.priority_id} />
                <span>{item.effort_score ?? 0}</span>
              </EntityTableRow>
            ))}
          </EntityTable>
        )}
      </DetailPanel>
    </>
  );
}
