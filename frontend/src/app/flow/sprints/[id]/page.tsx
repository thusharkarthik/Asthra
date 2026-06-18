"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowBackLink, FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { isBlockedWorkItem, isHighRiskWorkItem, workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

export default function FlowSprintDetailPage() {
  const params = useParams<{ id: string }>();
  const sprintId = params.id;
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", goal: "", startDate: "", endDate: "" });
  const sprintQuery = useQuery({ queryKey: ["flow", "sprint", sprintId], queryFn: () => flowApi.getSprint(accessToken ?? "", sprintId), enabled: Boolean(accessToken && sprintId), retry: 1 });
  const sprint = sprintQuery.data;
  useEffect(() => {
    if (!sprint) return;
    setDraft({
      name: sprint.name,
      goal: sprint.goal ?? "",
      startDate: sprint.start_date ? sprint.start_date.slice(0, 10) : "",
      endDate: sprint.end_date ? sprint.end_date.slice(0, 10) : ""
    });
  }, [sprint]);
  const workItemsQuery = useQuery({
    queryKey: ["flow", "sprint-work-items", sprintId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { sprint_id: Number(sprintId), limit: 100 }),
    enabled: Boolean(accessToken && sprintId),
    retry: 1
  });
  const backlogQuery = useQuery({
    queryKey: ["flow", "sprint-backlog-items", sprint?.project_id],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: sprint?.project_id, limit: 100 }),
    enabled: Boolean(accessToken && sprint?.project_id),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", sprint?.project_id],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", sprint?.project_id ?? 0),
    enabled: Boolean(accessToken && sprint?.project_id),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const capacityQuery = useQuery({
    queryKey: ["flow", "capacity", "sprint", sprintId],
    queryFn: () => flowApi.listCapacity(accessToken ?? "", { sprint_id: Number(sprintId), limit: 100 }),
    enabled: Boolean(accessToken && sprintId),
    retry: 1
  });
  const workLogsQuery = useQuery({
    queryKey: ["flow", "sprint-work-logs", sprintId, items.map((item) => item.id).join(",")],
    queryFn: async () => (await Promise.all(items.map((item) => flowApi.listWorkLogs(accessToken ?? "", item.id)))).flat(),
    enabled: Boolean(accessToken) && items.length > 0,
    retry: 1
  });
  const completion = sprint?.planned_work_count ? Math.round((sprint.completed_work_count / sprint.planned_work_count) * 100) : 0;
  const estimateMinutes = items.reduce((sum, item) => sum + (item.original_estimate_minutes ?? 0), 0);
  const loggedMinutes = (workLogsQuery.data ?? []).reduce((sum, log) => sum + log.time_spent_minutes, 0);
  const capacityMinutes = (capacityQuery.data ?? []).reduce((sum, entry) => sum + entry.capacity_minutes, 0);

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
  const updateMutation = useMutation({
    mutationFn: () => flowApi.updateSprint(accessToken ?? "", sprintId, {
      name: draft.name.trim(),
      goal: draft.goal.trim() || null,
      start_date: draft.startDate ? new Date(draft.startDate).toISOString() : null,
      end_date: draft.endDate ? new Date(draft.endDate).toISOString() : null
    }),
    onSuccess: () => {
      setEditing(false);
      addToast({ type: "success", title: "Sprint updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Sprint update failed", message: error instanceof Error ? error.message : "Unable to update sprint." })
  });
  const deleteMutation = useMutation({
    mutationFn: () => flowApi.deleteSprint(accessToken ?? "", sprintId),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
      router.push("/flow/sprints");
    },
    onError: (error) => addToast({ type: "error", title: "Sprint delete failed", message: error instanceof Error ? error.message : "Unable to delete sprint." })
  });
  const assignMutation = useMutation({
    mutationFn: (workItemId: number) => flowApi.assignWorkItemToSprint(accessToken ?? "", sprintId, workItemId),
    onSuccess: () => {
      addToast({ type: "success", title: "Work item moved into sprint" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Sprint assignment failed", message: error instanceof Error ? error.message : "Unable to move work into sprint." })
  });
  const removeFromSprintMutation = useMutation({
    mutationFn: (workItemId: number) => flowApi.updateWorkItem(accessToken ?? "", workItemId, { sprint_id: null }),
    onSuccess: () => {
      addToast({ type: "success", title: "Work item returned to backlog" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Sprint update failed", message: error instanceof Error ? error.message : "Unable to return item to backlog." })
  });

  const handleEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.name.trim()) updateMutation.mutate();
  };

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
        breadcrumbs={<FlowBreadcrumbs items={[{ label: "Sprints", href: "/flow/sprints" }, { label: sprint.name }]} />}
        actions={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing((value) => !value)}>{isEditing ? "Cancel Edit" : "Edit Sprint"}</Button>
          {sprint.status !== "active" && sprint.status !== "completed" ? <Button variant="outline" onClick={() => startMutation.mutate()}>Start Sprint</Button> : null}
          {sprint.status === "active" ? <Button variant="outline" onClick={() => completeMutation.mutate()}>Complete Sprint</Button> : null}
          <Button variant="outline" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("Delete this sprint? Work items will remain in Flow.")) deleteMutation.mutate(); }}>{deleteMutation.isPending ? "Deleting..." : "Delete Sprint"}</Button>
          <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/sprints">Back to Sprints</Link>
        </div>}
      />
      <FlowBackLink href="/flow/sprints" label="Back to Sprints" />
      <FlowSubnav />
      <DetailPanel title="Sprint Workflow">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md border px-2 py-1">Backlog</span>
          <span>→</span>
          <span className="rounded-md border px-2 py-1">Assign Work Item to Sprint</span>
          <span>→</span>
          <span className="rounded-md border px-2 py-1">Start Sprint</span>
          <span>→</span>
          <span className="rounded-md border px-2 py-1">Execute Work</span>
          <span>→</span>
          <span className="rounded-md border px-2 py-1">Complete Sprint</span>
        </div>
      </DetailPanel>
      {isEditing ? (
        <DetailPanel title="Edit Sprint">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleEdit}>
            <Input aria-label="Edit sprint name" value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} required />
            <Input aria-label="Edit sprint goal" value={draft.goal} onChange={(event) => setDraft((value) => ({ ...value, goal: event.target.value }))} />
            <Input aria-label="Edit sprint start date" type="date" value={draft.startDate} onChange={(event) => setDraft((value) => ({ ...value, startDate: event.target.value }))} />
            <Input aria-label="Edit sprint end date" type="date" value={draft.endDate} onChange={(event) => setDraft((value) => ({ ...value, endDate: event.target.value }))} />
            <div className="flex gap-2 md:col-span-2">
              <Button disabled={!draft.name.trim() || updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Sprint"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </DetailPanel>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <ModuleDashboardCard title="Progress" value={`${completion}%`} />
        <ModuleDashboardCard title="Completed" value={sprint.completed_work_count} />
        <ModuleDashboardCard title="Remaining" value={Math.max(sprint.planned_work_count - sprint.completed_work_count, 0)} />
        <ModuleDashboardCard title="Total Effort" value={sprint.total_effort} />
        <ModuleDashboardCard title="Capacity" value={formatMinutes(capacityMinutes)} />
        <ModuleDashboardCard title="Estimate" value={formatMinutes(estimateMinutes)} />
        <ModuleDashboardCard title="Logged Time" value={formatMinutes(loggedMinutes)} />
        {sprint.status === "active" ? <ModuleDashboardCard title="Blocked Work" value={items.filter(isBlockedWorkItem).length} /> : null}
        {sprint.status === "active" ? <ModuleDashboardCard title="High Risk Work" value={items.filter(isHighRiskWorkItem).length} /> : null}
      </div>
      <DetailPanel title="Overview">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div><div className="text-muted-foreground">Status</div><div className="font-medium">{sprint.status}</div></div>
          <div><div className="text-muted-foreground">Start</div><div className="font-medium">{sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : "Not set"}</div></div>
          <div><div className="text-muted-foreground">End</div><div className="font-medium">{sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : "Not set"}</div></div>
          <div><div className="text-muted-foreground">Work Items</div><div className="font-medium">{sprint.planned_work_count}</div></div>
        </div>
      </DetailPanel>
      <DetailPanel title="Work Items">
        <div className="mb-3 grid gap-2 rounded-md border bg-muted/30 p-3 md:grid-cols-[1fr_auto]">
          <Select aria-label="Move work item into sprint" value="" onChange={(event) => { if (event.target.value) assignMutation.mutate(Number(event.target.value)); }}>
            <option value="">Move backlog item into sprint</option>
            {(backlogQuery.data ?? []).filter((candidate) => !candidate.sprint_id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
          </Select>
          <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/backlog">Open Backlog</Link>
        </div>
        {items.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No work assigned to this sprint yet.</p> : (
          <EntityTable columns={["Title", "Status", "Priority", "Effort", "Estimate", "Actions"]}>
            {items.map((item) => (
              <EntityTableRow key={item.id} columns={6}>
                <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
                <StatusBadge value={workflowStatusLabelFor(workflowQuery.data, item.status_id)} />
                <PriorityBadge value={item.priority_id} />
                <span>{item.effort_score ?? 0}</span>
                <span>{formatMinutes(item.original_estimate_minutes ?? 0)}</span>
                <Button size="sm" variant="outline" disabled={removeFromSprintMutation.isPending} onClick={() => removeFromSprintMutation.mutate(item.id)}>Move to Backlog</Button>
              </EntityTableRow>
            ))}
          </EntityTable>
        )}
      </DetailPanel>
      <DetailPanel title="Activity">
        <p className="text-sm text-muted-foreground">Sprint status changes and work assignment events appear in Flow Activity as audit coverage expands.</p>
      </DetailPanel>
    </>
  );
}

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
