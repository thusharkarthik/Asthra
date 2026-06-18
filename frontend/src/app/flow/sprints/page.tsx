"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowSprintsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sprintsQuery = useQuery({
    queryKey: ["flow", "sprints", selectedProjectId],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const sprints = sprintsQuery.data ?? [];
  const activeSprint = sprints.find((sprint) => sprint.status === "active");

  const createMutation = useMutation({
    mutationFn: () => flowApi.createSprint(accessToken ?? "", {
      project_id: selectedProjectId ?? 0,
      name: name.trim(),
      goal: goal.trim() || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null
    }),
    onSuccess: () => {
      setName("");
      setGoal("");
      setStartDate("");
      setEndDate("");
      addToast({ type: "success", title: "Sprint created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "sprints"] });
    },
    onError: (error) => addToast({ type: "error", title: "Sprint create failed", message: error instanceof Error ? error.message : "Unable to create sprint." })
  });
  const startMutation = useMutation({
    mutationFn: (sprintId: number) => flowApi.startSprint(accessToken ?? "", sprintId),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint started" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });
  const completeMutation = useMutation({
    mutationFn: (sprintId: number) => flowApi.completeSprint(accessToken ?? "", sprintId),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint completed" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim()) createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Sprints" description="Plan, start, and complete project execution cycles." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Sprints" }]} />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to manage sprints" /> : sprintsQuery.isLoading ? <LoadingState /> : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {activeSprint ? (
              <div className="grid gap-4 md:grid-cols-4">
                <ModuleDashboardCard title="Active Sprint" value={activeSprint.name} />
                <ModuleDashboardCard title="Completed" value={activeSprint.completed_work_count} />
                <ModuleDashboardCard title="Remaining" value={Math.max(activeSprint.planned_work_count - activeSprint.completed_work_count, 0)} />
                <ModuleDashboardCard title="Effort" value={activeSprint.total_effort} />
              </div>
            ) : null}
            <DetailPanel title="Sprint List">
              <div className="space-y-3">
                {sprints.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No sprints yet. Create one to start planning work.</p> : null}
                {sprints.map((sprint) => (
                  <div key={sprint.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link className="font-medium text-primary hover:underline" href={`/flow/sprints/${sprint.id}`}>{sprint.name}</Link>
                        <p className="mt-1 text-sm text-muted-foreground">{sprint.goal || "No sprint goal."}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border px-2 py-0.5">{sprint.status}</span>
                          <span>{sprint.completed_work_count}/{sprint.planned_work_count} complete</span>
                          <span>{sprint.total_effort} effort</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {sprint.status !== "active" && sprint.status !== "completed" ? <Button size="sm" variant="outline" onClick={() => startMutation.mutate(sprint.id)}>Start</Button> : null}
                        {sprint.status === "active" ? <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(sprint.id)}>Complete</Button> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailPanel>
          </div>
          <DetailPanel title="Create Sprint">
            <form className="space-y-2" onSubmit={handleCreate}>
              <Input aria-label="Sprint name" placeholder="Sprint name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input aria-label="Sprint goal" placeholder="Sprint goal" value={goal} onChange={(event) => setGoal(event.target.value)} />
              <Input aria-label="Sprint start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <Input aria-label="Sprint end date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <Button className="w-full" disabled={!name.trim() || createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Sprint"}</Button>
            </form>
          </DetailPanel>
        </div>
      )}
    </>
  );
}
