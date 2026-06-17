"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowCapacityPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [sprintFilter, setSprintFilter] = useState("");
  const [userId, setUserId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [capacityHours, setCapacityHours] = useState("");
  const [notes, setNotes] = useState("");

  const sprintsQuery = useQuery({
    queryKey: ["flow", "sprints", selectedProjectId],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const capacityQuery = useQuery({
    queryKey: ["flow", "capacity", selectedProjectId, sprintFilter],
    queryFn: () => flowApi.listCapacity(accessToken ?? "", { project_id: selectedProjectId, sprint_id: sprintFilter ? Number(sprintFilter) : null, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const workItemsQuery = useQuery({
    queryKey: ["flow", "capacity-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });

  const capacities = capacityQuery.data ?? [];
  const items = workItemsQuery.data ?? [];
  const scopedItems = sprintFilter ? items.filter((item) => item.sprint_id === Number(sprintFilter)) : items;
  const capacityMinutes = capacities.reduce((sum, entry) => sum + entry.capacity_minutes, 0);
  const plannedMinutes = scopedItems.reduce((sum, item) => sum + (item.original_estimate_minutes ?? minutesFromEffortScore(item.effort_score)), 0);
  const remainingMinutes = scopedItems.reduce((sum, item) => sum + (item.remaining_estimate_minutes ?? 0), 0);
  const overCapacityMinutes = Math.max(plannedMinutes - capacityMinutes, 0);

  const createMutation = useMutation({
    mutationFn: () => flowApi.createCapacity(accessToken ?? "", {
      project_id: selectedProjectId ?? 0,
      user_id: userId ? Number(userId) : null,
      team_id: teamId ? Number(teamId) : null,
      sprint_id: sprintFilter ? Number(sprintFilter) : null,
      capacity_minutes: Math.round(Number(capacityHours) * 60),
      notes: notes.trim() || null
    }),
    onSuccess: () => {
      setUserId("");
      setTeamId("");
      setCapacityHours("");
      setNotes("");
      addToast({ type: "success", title: "Capacity entry created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "capacity"] });
    },
    onError: (error) => addToast({ type: "error", title: "Capacity create failed", message: error instanceof Error ? error.message : "Unable to create capacity entry." })
  });
  const deleteMutation = useMutation({
    mutationFn: (capacityId: number) => flowApi.deleteCapacity(accessToken ?? "", capacityId),
    onSuccess: () => {
      addToast({ type: "success", title: "Capacity entry deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "capacity"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Number(capacityHours) > 0) createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Capacity" description="Compare project capacity against planned and remaining work." />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to plan capacity" /> : capacityQuery.isLoading || workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <ModuleDashboardCard title="Capacity" value={formatMinutes(capacityMinutes)} />
            <ModuleDashboardCard title="Assigned Effort" value={formatMinutes(plannedMinutes)} />
            <ModuleDashboardCard title="Remaining Estimate" value={formatMinutes(remainingMinutes)} />
            <ModuleDashboardCard title="Over Capacity" value={formatMinutes(overCapacityMinutes)}>
              <p className={overCapacityMinutes ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{overCapacityMinutes ? "Planned work exceeds available capacity." : "Planned work is within capacity."}</p>
            </ModuleDashboardCard>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <DetailPanel title="Sprint Scope">
                <Select aria-label="Sprint selector" value={sprintFilter} onChange={(event) => setSprintFilter(event.target.value)}>
                  <option value="">All project work</option>
                  {(sprintsQuery.data ?? []).map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                </Select>
              </DetailPanel>
              <DetailPanel title="Capacity Entries">
                {capacities.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No capacity entries yet. Add a member or team capacity to compare planned work.</p> : (
                  <EntityTable columns={["Owner", "Sprint", "Capacity", "Notes", "Actions"]}>
                    {capacities.map((entry) => (
                      <EntityTableRow key={entry.id} columns={5}>
                        <span>{entry.user_id ? `User ${entry.user_id}` : entry.team_id ? `Team ${entry.team_id}` : "Unscoped capacity"}</span>
                        <span>{entry.sprint_id ? `Sprint ${entry.sprint_id}` : "Project"}</span>
                        <span>{formatMinutes(entry.capacity_minutes)}</span>
                        <span>{entry.notes || "No notes"}</span>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(entry.id)}>Delete</Button>
                      </EntityTableRow>
                    ))}
                  </EntityTable>
                )}
              </DetailPanel>
              <DetailPanel title="Workload">
                <EntityTable columns={["Work Item", "Estimate", "Remaining", "Assignee"]}>
                  {scopedItems.slice(0, 8).map((item) => (
                    <EntityTableRow key={item.id} columns={4}>
                      <span className="font-medium">{item.title}</span>
                      <span>{formatMinutes(item.original_estimate_minutes ?? minutesFromEffortScore(item.effort_score))}</span>
                      <span>{formatMinutes(item.remaining_estimate_minutes ?? 0)}</span>
                      <span>{item.assignee_id ? `User ${item.assignee_id}` : "Unassigned"}</span>
                    </EntityTableRow>
                  ))}
                </EntityTable>
              </DetailPanel>
            </div>
            <DetailPanel title="Add Capacity">
              <form className="space-y-2" onSubmit={handleSubmit}>
                <Input aria-label="Capacity user id" inputMode="numeric" placeholder="User ID optional" value={userId} onChange={(event) => setUserId(event.target.value)} />
                <Input aria-label="Capacity team id" inputMode="numeric" placeholder="Team ID optional" value={teamId} onChange={(event) => setTeamId(event.target.value)} />
                <Input aria-label="Capacity hours" inputMode="decimal" placeholder="Capacity hours" value={capacityHours} onChange={(event) => setCapacityHours(event.target.value)} />
                <Input aria-label="Capacity notes" placeholder="Notes optional" value={notes} onChange={(event) => setNotes(event.target.value)} />
                <Button className="w-full" disabled={Number(capacityHours) <= 0 || createMutation.isPending}>{createMutation.isPending ? "Saving..." : "Create Capacity Entry"}</Button>
                <p className="text-xs text-muted-foreground">Detailed member and team lookup is pending; IDs are manual for this MVP.</p>
              </form>
            </DetailPanel>
          </div>
        </div>
      )}
    </>
  );
}

function minutesFromEffortScore(value?: number | null) {
  return value ? value * 60 : 0;
}

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
