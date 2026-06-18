"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState, ErrorState, PageLoading } from "@/components/layout/ui-states";
import { DetailPanel } from "@/components/modules/detail-panel";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { SavedView, WorkItemSearchFilters, WorkItemSearchResponse } from "@/types/flow";

const DEFAULT_FILTERS: WorkItemSearchFilters = { sort_by: "updated_at", sort_direction: "desc", page: 1, page_size: 25 };

export default function FlowSearchPage() {
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<WorkItemSearchFilters>(DEFAULT_FILTERS);
  const [savedViewName, setSavedViewName] = useState("");

  useEffect(() => {
    const quickView = searchParams.get("view");
    if (quickView === "my-active") setFilters({ ...DEFAULT_FILTERS, assignee_id: currentUser?.id ?? null, status: "in_progress" });
    if (quickView === "high-priority") setFilters({ ...DEFAULT_FILTERS, priority: "high" });
    if (quickView === "overdue") setFilters({ ...DEFAULT_FILTERS, due_before: new Date().toISOString() });
    if (quickView === "current-sprint") setFilters({ ...DEFAULT_FILTERS, sprint_id: 1 });
  }, [currentUser?.id, searchParams]);

  const effectiveFilters = useMemo(() => ({ ...filters, project_id: selectedProjectId }), [filters, selectedProjectId]);
  const searchQuery = useQuery({
    queryKey: ["flow", "search", effectiveFilters],
    queryFn: () => flowApi.searchWorkItems(accessToken ?? "", effectiveFilters),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const savedViewsQuery = useQuery({
    queryKey: ["flow", "saved-views", selectedProjectId],
    queryFn: () => flowApi.listSavedViews(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const savedViews = savedViewsQuery.data ?? [];

  const saveViewMutation = useMutation({
    mutationFn: () => flowApi.createSavedView(accessToken ?? "", {
      workspace_id: selectedWorkspaceId,
      project_id: selectedProjectId ?? 0,
      name: savedViewName.trim(),
      filters: stripProjectFilter(filters),
      is_default: false
    }),
    onSuccess: () => {
      setSavedViewName("");
      addToast({ type: "success", title: "Saved view created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "saved-views"] });
    },
    onError: (error) => addToast({ type: "error", title: "Unable to save view", message: error instanceof Error ? error.message : "Save view failed." })
  });
  const deleteViewMutation = useMutation({
    mutationFn: (savedViewId: number) => flowApi.deleteSavedView(accessToken ?? "", savedViewId),
    onSuccess: () => {
      addToast({ type: "success", title: "Saved view deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "saved-views"] });
    },
    onError: (error) => addToast({ type: "error", title: "Unable to delete view", message: error instanceof Error ? error.message : "Delete view failed." })
  });

  const updateFilter = (key: keyof WorkItemSearchFilters, value: string) => {
    const numericKeys = new Set(["assignee_id", "reporter_id", "sprint_id", "release_id", "parent_id"]);
    setFilters((current) => ({
      ...current,
      page: 1,
      [key]: numericKeys.has(key) ? (value ? Number(value) : null) : value || null
    }));
  };

  const handleSaveView = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savedViewName.trim() && selectedProjectId) saveViewMutation.mutate();
  };

  const loadSavedView = (savedView: SavedView) => {
    setFilters({ ...DEFAULT_FILTERS, ...savedView.filters });
    addToast({ type: "info", title: `Loaded ${savedView.name}` });
  };

  if (!selectedProjectId) {
    return (
      <>
        <PageHeader title="Flow Search" description="Find and reuse project work item views." />
        <FlowSubnav />
        <EmptyModuleState title="Select a project" description="Advanced search is scoped to the selected project." />
      </>
    );
  }

  const results = searchQuery.data?.items ?? [];

  return (
    <>
      <PageHeader title="Flow Search" description="Search work items by text, status, owner, planning fields, dates, sprint, and release." />
      <FlowSubnav />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <DetailPanel title="Filters">
            <div className="grid gap-2 md:grid-cols-4">
              <Input aria-label="Search text" placeholder="Search title, description, comments" value={filters.text ?? ""} onChange={(event) => updateFilter("text", event.target.value)} />
              <Input aria-label="Title contains" placeholder="Title contains" value={filters.title ?? ""} onChange={(event) => updateFilter("title", event.target.value)} />
              <Input aria-label="Description contains" placeholder="Description contains" value={filters.description ?? ""} onChange={(event) => updateFilter("description", event.target.value)} />
              <Select aria-label="Sort by" value={filters.sort_by ?? "updated_at"} onChange={(event) => updateFilter("sort_by", event.target.value)}>
                <option value="updated_at">Updated</option>
                <option value="created_at">Created</option>
                <option value="priority">Priority</option>
                <option value="due_date">Due Date</option>
              </Select>
              <Input aria-label="Status filter" placeholder="Status name or ID" value={filters.status ?? ""} onChange={(event) => updateFilter("status", event.target.value)} />
              <Input aria-label="Priority filter" placeholder="Priority name or ID" value={filters.priority ?? ""} onChange={(event) => updateFilter("priority", event.target.value)} />
              <Input aria-label="Assignee filter" inputMode="numeric" placeholder="Assignee ID" value={filters.assignee_id ?? ""} onChange={(event) => updateFilter("assignee_id", event.target.value)} />
              <Input aria-label="Reporter filter" inputMode="numeric" placeholder="Reporter ID" value={filters.reporter_id ?? ""} onChange={(event) => updateFilter("reporter_id", event.target.value)} />
              <Input aria-label="Effort filter" placeholder="Effort size" value={filters.effort_size ?? ""} onChange={(event) => updateFilter("effort_size", event.target.value.toUpperCase())} />
              <Input aria-label="Risk filter" placeholder="Risk level" value={filters.risk_level ?? ""} onChange={(event) => updateFilter("risk_level", event.target.value)} />
              <Input aria-label="Business value filter" placeholder="Business value" value={filters.business_value ?? ""} onChange={(event) => updateFilter("business_value", event.target.value)} />
              <Input aria-label="Complexity filter" placeholder="Complexity" value={filters.complexity ?? ""} onChange={(event) => updateFilter("complexity", event.target.value)} />
              <Input aria-label="Sprint filter" inputMode="numeric" placeholder="Sprint ID" value={filters.sprint_id ?? ""} onChange={(event) => updateFilter("sprint_id", event.target.value)} />
              <Input aria-label="Release filter" inputMode="numeric" placeholder="Release ID" value={filters.release_id ?? ""} onChange={(event) => updateFilter("release_id", event.target.value)} />
              <Select aria-label="Hierarchy level filter" value={filters.item_level ?? ""} onChange={(event) => updateFilter("item_level", event.target.value)}>
                <option value="">All levels</option>
                <option value="initiative">Initiative</option>
                <option value="feature">Feature</option>
                <option value="work_item">Work Item</option>
                <option value="subtask">Subtask</option>
              </Select>
              <Input aria-label="Parent filter" inputMode="numeric" placeholder="Parent ID" value={filters.parent_id ?? ""} onChange={(event) => updateFilter("parent_id", event.target.value)} />
              <Input aria-label="Created after" type="date" value={dateInput(filters.created_after)} onChange={(event) => updateFilter("created_after", toIsoDate(event.target.value))} />
              <Input aria-label="Created before" type="date" value={dateInput(filters.created_before)} onChange={(event) => updateFilter("created_before", toIsoDate(event.target.value))} />
              <Input aria-label="Updated after" type="date" value={dateInput(filters.updated_after)} onChange={(event) => updateFilter("updated_after", toIsoDate(event.target.value))} />
              <Input aria-label="Updated before" type="date" value={dateInput(filters.updated_before)} onChange={(event) => updateFilter("updated_before", toIsoDate(event.target.value))} />
              <Input aria-label="Due after" type="date" value={dateInput(filters.due_after)} onChange={(event) => updateFilter("due_after", toIsoDate(event.target.value))} />
              <Input aria-label="Due before" type="date" value={dateInput(filters.due_before)} onChange={(event) => updateFilter("due_before", toIsoDate(event.target.value))} />
              <Select aria-label="Sort direction" value={filters.sort_direction ?? "desc"} onChange={(event) => updateFilter("sort_direction", event.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
              <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset Filters</Button>
            </div>
          </DetailPanel>
          <DetailPanel title={`Results${searchQuery.data ? ` · ${searchQuery.data.total}` : ""}`}>
            {searchQuery.isLoading ? <PageLoading label="Searching work items..." /> : null}
            {searchQuery.isError ? <ErrorState title="Search failed" description="Check flow-service and retry." onRetry={() => searchQuery.refetch()} /> : null}
            {!searchQuery.isLoading && !searchQuery.isError && results.length === 0 ? (
              <EmptyModuleState title="No work items found" description="Adjust filters or clear the search to broaden results." />
            ) : null}
            {results.length ? <SearchResultsTable items={results} workflow={workflowQuery.data} /> : null}
          </DetailPanel>
        </div>
        <DetailPanel title="Saved Views">
          <form className="mb-4 space-y-2" onSubmit={handleSaveView}>
            <Input aria-label="Saved view name" placeholder="View name, e.g. My Active Work" value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} />
            <Button className="w-full" disabled={!savedViewName.trim() || saveViewMutation.isPending}>Save Current Filter</Button>
          </form>
          <div className="space-y-2">
            {savedViewsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading saved views...</p> : null}
            {savedViews.length === 0 && !savedViewsQuery.isLoading ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No saved views yet. Try My Active Work, High Risk Items, Sprint 5, or Release 1.0.</p>
            ) : null}
            {savedViews.map((view) => (
              <div key={view.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left" onClick={() => loadSavedView(view)}>
                    <div className="font-medium">{view.name}</div>
                    {view.description ? <div className="text-xs text-muted-foreground">{view.description}</div> : null}
                  </button>
                  <Button size="sm" variant="outline" aria-label={`Delete saved view ${view.name}`} onClick={() => deleteViewMutation.mutate(view.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </>
  );
}

function SearchResultsTable({ items, workflow }: { items: WorkItemSearchResponse["items"]; workflow?: Parameters<typeof workflowStatusLabelFor>[0] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            <th className="py-2">Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Effort</th>
            <th>Risk</th>
            <th>Sprint</th>
            <th>Release</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-3"><Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link></td>
              <td><StatusBadge value={workflowStatusLabelFor(workflow, item.status_id)} /></td>
              <td><PriorityBadge value={item.priority_id} /></td>
              <td>{item.assignee_id ?? "Unassigned"}</td>
              <td>{item.effort_size ?? "-"}</td>
              <td>{item.risk_level ?? "-"}</td>
              <td>{item.sprint_id ?? "-"}</td>
              <td>{item.release_id ?? "-"}</td>
              <td>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function stripProjectFilter(filters: WorkItemSearchFilters) {
  const { project_id, ...rest } = filters;
  return rest;
}

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T00:00:00Z`).toISOString() : "";
}
