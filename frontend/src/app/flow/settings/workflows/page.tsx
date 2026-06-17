"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workflow, WorkflowCategory } from "@/types/flow";

const CATEGORY_OPTIONS: WorkflowCategory[] = ["backlog", "active", "review", "completed"];

export default function FlowWorkflowSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [workflowName, setWorkflowName] = useState("");
  const [editWorkflowName, setEditWorkflowName] = useState("");
  const [templateName, setTemplateName] = useState("engineering");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [statusName, setStatusName] = useState("");
  const [statusKey, setStatusKey] = useState("");
  const [statusCategory, setStatusCategory] = useState<WorkflowCategory>("active");
  const [fromStatusId, setFromStatusId] = useState("");
  const [toStatusId, setToStatusId] = useState("");

  const workflowsQuery = useQuery({
    queryKey: ["flow", "workflows", selectedProjectId],
    queryFn: () => flowApi.listWorkflows(accessToken ?? "", { project_id: selectedProjectId }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });

  const workflows = workflowsQuery.data ?? [];
  const activeWorkflow = useMemo(() => {
    const selected = workflows.find((workflow) => String(workflow.id) === selectedWorkflowId);
    return selected ?? workflows[0];
  }, [selectedWorkflowId, workflows]);

  useEffect(() => {
    setEditWorkflowName(activeWorkflow?.name ?? "");
  }, [activeWorkflow?.id, activeWorkflow?.name]);

  const createWorkflowMutation = useMutation({
    mutationFn: () => flowApi.createWorkflow(accessToken ?? "", { project_id: selectedProjectId, name: workflowName.trim(), is_default: workflows.length === 0 }),
    onSuccess: (workflow) => {
      setWorkflowName("");
      setSelectedWorkflowId(String(workflow.id));
      addToast({ type: "success", title: "Workflow created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Workflow create failed", message: error instanceof Error ? error.message : "Unable to create workflow." })
  });

  const templateMutation = useMutation({
    mutationFn: () => flowApi.createWorkflowFromTemplate(accessToken ?? "", templateName, { project_id: selectedProjectId }),
    onSuccess: (workflow) => {
      setSelectedWorkflowId(String(workflow.id));
      addToast({ type: "success", title: "Workflow template created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Template create failed", message: error instanceof Error ? error.message : "Unable to create workflow from template." })
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: () => flowApi.updateWorkflow(accessToken ?? "", activeWorkflow?.id ?? 0, { name: editWorkflowName.trim() }),
    onSuccess: (workflow) => {
      setEditWorkflowName(workflow.name);
      addToast({ type: "success", title: "Workflow updated" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Workflow update failed", message: error instanceof Error ? error.message : "Unable to update workflow." })
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (workflow: Workflow) => flowApi.deleteWorkflow(accessToken ?? "", workflow.id),
    onSuccess: () => {
      setSelectedWorkflowId("");
      addToast({ type: "success", title: "Workflow deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Workflow delete failed", message: error instanceof Error ? error.message : "Unable to delete workflow." })
  });

  const statusMutation = useMutation({
    mutationFn: () => flowApi.createWorkflowStatus(accessToken ?? "", activeWorkflow?.id ?? 0, {
      name: statusName.trim(),
      key: statusKey.trim() || statusName.trim(),
      category: statusCategory,
      sort_order: activeWorkflow?.statuses.length ?? 0
    }),
    onSuccess: () => {
      setStatusName("");
      setStatusKey("");
      addToast({ type: "success", title: "Workflow status added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Status create failed", message: error instanceof Error ? error.message : "Unable to add status." })
  });

  const transitionMutation = useMutation({
    mutationFn: () => flowApi.createWorkflowTransition(accessToken ?? "", activeWorkflow?.id ?? 0, { from_status_id: Number(fromStatusId), to_status_id: Number(toStatusId) }),
    onSuccess: () => {
      setFromStatusId("");
      setToStatusId("");
      addToast({ type: "success", title: "Transition added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "workflows"] });
    },
    onError: (error) => addToast({ type: "error", title: "Transition failed", message: error instanceof Error ? error.message : "Unable to add transition." })
  });

  const assignMutation = useMutation({
    mutationFn: (workflow: Workflow) => flowApi.assignWorkflowToProject(accessToken ?? "", workflow.id, selectedProjectId ?? 0),
    onSuccess: () => {
      addToast({ type: "success", title: "Workflow assigned" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Workflow assignment failed", message: error instanceof Error ? error.message : "Unable to assign workflow." })
  });

  const handleCreateWorkflow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (workflowName.trim()) createWorkflowMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Flow Workflows" description="Configure project statuses and allowed transitions." />
      <FlowSubnav />
      {!selectedProjectId ? (
        <DetailPanel title="Select a project"><p className="text-sm text-muted-foreground">Choose a project before configuring Flow workflows.</p></DetailPanel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <DetailPanel title="Project Workflows">
              <div className="space-y-3">
                {workflowsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading workflows...</p> : null}
                {workflows.map((workflow) => (
                  <button key={workflow.id} type="button" className={`block w-full rounded-md border p-3 text-left text-sm hover:bg-muted ${activeWorkflow?.id === workflow.id ? "border-primary" : ""}`} onClick={() => setSelectedWorkflowId(String(workflow.id))}>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-xs text-muted-foreground">{workflow.statuses.length} statuses · {workflow.transitions.length} transitions</div>
                  </button>
                ))}
                {workflows.length === 0 && !workflowsQuery.isLoading ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No workflows yet. Create one or start from a template.</p> : null}
              </div>
            </DetailPanel>

            {activeWorkflow ? (
              <DetailPanel title={`${activeWorkflow.name} Statuses`}>
                <div className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-4">
                    {activeWorkflow.statuses.map((workflowStatus) => (
                      <div key={workflowStatus.id} className="rounded-md border p-3 text-sm">
                        <div className="font-medium">{workflowStatus.name}</div>
                        <div className="text-xs text-muted-foreground">{workflowStatus.key} · {workflowStatus.category}</div>
                      </div>
                    ))}
                  </div>
                  <form className="grid gap-2 md:grid-cols-[1fr_1fr_150px_auto]" onSubmit={(event) => { event.preventDefault(); if (statusName.trim()) statusMutation.mutate(); }}>
                    <Input aria-label="Status name" placeholder="Status name" value={statusName} onChange={(event) => setStatusName(event.target.value)} />
                    <Input aria-label="Status key" placeholder="status_key" value={statusKey} onChange={(event) => setStatusKey(event.target.value)} />
                    <Select aria-label="Status category" value={statusCategory} onChange={(event) => setStatusCategory(event.target.value as WorkflowCategory)}>
                      {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                    </Select>
                    <Button disabled={!statusName.trim() || statusMutation.isPending}>{statusMutation.isPending ? "Adding..." : "Add Status"}</Button>
                  </form>
                </div>
              </DetailPanel>
            ) : null}

            {activeWorkflow ? (
              <DetailPanel title="Transitions">
                <div className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    {activeWorkflow.transitions.map((transition) => (
                      <div key={transition.id} className="rounded-md border p-3 text-sm">
                        <span className="font-medium">{transition.from_status_name ?? `#${transition.from_status_id}`}</span>
                        <span className="text-muted-foreground">{" -> "}</span>
                        <span className="font-medium">{transition.to_status_name ?? `#${transition.to_status_id}`}</span>
                      </div>
                    ))}
                  </div>
                  <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (fromStatusId && toStatusId) transitionMutation.mutate(); }}>
                    <Select aria-label="From status" value={fromStatusId} onChange={(event) => setFromStatusId(event.target.value)}>
                      <option value="">From status</option>
                      {activeWorkflow.statuses.map((workflowStatus) => <option key={workflowStatus.id} value={workflowStatus.id}>{workflowStatus.name}</option>)}
                    </Select>
                    <Select aria-label="To status" value={toStatusId} onChange={(event) => setToStatusId(event.target.value)}>
                      <option value="">To status</option>
                      {activeWorkflow.statuses.map((workflowStatus) => <option key={workflowStatus.id} value={workflowStatus.id}>{workflowStatus.name}</option>)}
                    </Select>
                    <Button disabled={!fromStatusId || !toStatusId || transitionMutation.isPending}>{transitionMutation.isPending ? "Adding..." : "Add Transition"}</Button>
                  </form>
                </div>
              </DetailPanel>
            ) : null}
          </div>

          <div className="space-y-4">
            <DetailPanel title="Create Workflow">
              <form className="space-y-2" onSubmit={handleCreateWorkflow}>
                <Input aria-label="Workflow name" placeholder="Workflow name" value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
                <Button className="w-full" disabled={!workflowName.trim() || createWorkflowMutation.isPending}>{createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}</Button>
              </form>
            </DetailPanel>
            <DetailPanel title="Workflow Templates">
              <div className="space-y-2">
                <Select aria-label="Workflow template" value={templateName} onChange={(event) => setTemplateName(event.target.value)}>
                  <option value="engineering">Engineering Workflow</option>
                  <option value="product">Product Workflow</option>
                  <option value="support">Support Workflow</option>
                </Select>
                <Button className="w-full" variant="outline" disabled={templateMutation.isPending} onClick={() => templateMutation.mutate()}>{templateMutation.isPending ? "Creating..." : "Create From Template"}</Button>
              </div>
            </DetailPanel>
            {activeWorkflow ? (
              <DetailPanel title="Edit Workflow">
                <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (editWorkflowName.trim()) updateWorkflowMutation.mutate(); }}>
                  <Input aria-label="Edit workflow name" placeholder="Workflow name" value={editWorkflowName} onChange={(event) => setEditWorkflowName(event.target.value)} />
                  <Button className="w-full" disabled={!editWorkflowName.trim() || updateWorkflowMutation.isPending}>{updateWorkflowMutation.isPending ? "Saving..." : "Save Workflow"}</Button>
                </form>
                <Button
                  className="mt-2 w-full"
                  variant="outline"
                  disabled={deleteWorkflowMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete workflow "${activeWorkflow.name}"?`)) {
                      deleteWorkflowMutation.mutate(activeWorkflow);
                    }
                  }}
                >
                  {deleteWorkflowMutation.isPending ? "Deleting..." : "Delete Workflow"}
                </Button>
              </DetailPanel>
            ) : null}
            {activeWorkflow ? (
              <DetailPanel title="Project Assignment">
                <p className="mb-3 text-sm text-muted-foreground">Assign this workflow to the selected project. Work items will use its statuses and transitions.</p>
                <Button className="w-full" variant="outline" disabled={assignMutation.isPending} onClick={() => assignMutation.mutate(activeWorkflow)}>{assignMutation.isPending ? "Assigning..." : "Assign To Project"}</Button>
              </DetailPanel>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
