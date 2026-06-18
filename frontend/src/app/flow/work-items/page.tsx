"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSetupState } from "@/components/flow/flow-setup-state";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_BUSINESS_VALUE_OPTIONS, FLOW_EFFORT_SIZE_OPTIONS, FLOW_PRIORITY_OPTIONS, FLOW_RISK_OPTIONS, effortLabel, planningLabel, workflowStatusKeyFor, workflowStatusOptions } from "@/components/flow/flow-utils";
import { FlowMemberDisplay, FlowMemberPicker } from "@/components/flow/member-picker";
import { WorkItemCreateDialog } from "@/components/flow/work-item-create-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkItemsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const organizations = useWorkspaceStore((state) => state.organizations);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useWorkspaceStore((state) => state.projects);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [effortFilter, setEffortFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [businessValueFilter, setBusinessValueFilter] = useState("");

  const hasOrganization = Boolean(selectedOrganizationId) || organizations.length > 0;
  const hasWorkspace = Boolean(selectedWorkspaceId) || workspaces.length > 0;
  const hasProject = Boolean(selectedProjectId) || projects.length > 0;

  const workItemsQuery = useQuery({
    queryKey: ["flow", "work-items", selectedProjectId],
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
  const statusOptions = workflowStatusOptions(workflowQuery.data);

  const statusMutation = useMutation({
    mutationFn: ({ id, statusName }: { id: number; statusName: string }) => flowApi.updateWorkItem(accessToken ?? "", id, { status_name: statusName }),
    onSuccess: () => {
      addToast({ type: "success", title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Status update failed", message: error instanceof Error ? error.message : "Unable to update status." })
  });

  const filteredItems = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (workItemsQuery.data ?? []).filter((item) => {
      const matchesText = !text || item.title.toLowerCase().includes(text) || item.description?.toLowerCase().includes(text);
      const matchesStatus = !statusFilter || item.status_id === Number(statusFilter);
      const matchesPriority = !priorityFilter || item.priority_id === Number(priorityFilter);
      const matchesAssignee = !assigneeFilter || String(item.assignee_id ?? "") === assigneeFilter;
      const matchesEffort = !effortFilter || item.effort_size === effortFilter;
      const matchesRisk = !riskFilter || item.risk_level === riskFilter;
      const matchesBusinessValue = !businessValueFilter || item.business_value === businessValueFilter;
      return matchesText && matchesStatus && matchesPriority && matchesAssignee && matchesEffort && matchesRisk && matchesBusinessValue;
    });
  }, [assigneeFilter, businessValueFilter, effortFilter, priorityFilter, riskFilter, search, statusFilter, workItemsQuery.data]);

  return (
    <>
      <PageHeader
        title="Work Items"
        description="Search, filter, and create project work items."
        actions={<FlowHeaderActions onCreate={() => setCreateOpen(true)} />}
      />
      <FlowSubnav />
      {!hasOrganization || !hasWorkspace || !hasProject ? (
        <FlowSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasProject={hasProject} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" aria-label="Search work items" placeholder="Search work items" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <Select aria-label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
              </Select>
              <Select aria-label="Priority filter" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">All priorities</option>
                {FLOW_PRIORITY_OPTIONS.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
              </Select>
              <FlowMemberPicker label="Assignee filter" value={assigneeFilter} onChange={setAssigneeFilter} />
              <Select aria-label="Effort size filter" value={effortFilter} onChange={(event) => setEffortFilter(event.target.value)}>
                <option value="">All effort</option>
                {FLOW_EFFORT_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <Select aria-label="Risk filter" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
                <option value="">All risk</option>
                {FLOW_RISK_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <Select aria-label="Business value filter" value={businessValueFilter} onChange={(event) => setBusinessValueFilter(event.target.value)}>
                <option value="">All value</option>
                {FLOW_BUSINESS_VALUE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
              <Button onClick={() => setCreateOpen(true)}>Create</Button>
            </div>
          </div>

          {workItemsQuery.isLoading ? <LoadingState /> : workItemsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load work items. <Button size="sm" variant="outline" onClick={() => workItemsQuery.refetch()}>Retry</Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState title={(workItemsQuery.data ?? []).length === 0 ? "No work items yet. Create the first item for this project." : "No work items match these filters."} />
          ) : (
            <EntityTable columns={["Title", "Status", "Priority", "Effort", "Risk", "Assignee", "Due", "Updated"]}>
              {filteredItems.map((item) => (
                <EntityTableRow key={item.id} columns={8}>
                  <Link className="min-w-0 font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
                  <Select
                    aria-label={`Status for ${item.title}`}
                    value={workflowStatusKeyFor(workflowQuery.data, item.status_id)}
                    onChange={(event) => statusMutation.mutate({ id: item.id, statusName: event.target.value })}
                  >
                    {statusOptions.map((status) => <option key={status.key} value={status.key}>{status.name}</option>)}
                  </Select>
                  <PriorityBadge value={item.priority_id} />
                  <span>{effortLabel(item.effort_size, item.effort_score)}</span>
                  <span>{planningLabel(item.risk_level)}</span>
                  <span><FlowMemberDisplay userId={item.assignee_id} /></span>
                  <span className="text-muted-foreground">{item.due_date ? new Date(item.due_date).toLocaleDateString() : "-"}</span>
                  <span className="text-muted-foreground">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "-"}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <WorkItemCreateDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
