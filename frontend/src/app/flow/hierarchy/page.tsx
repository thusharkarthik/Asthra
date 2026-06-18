"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { itemLevelLabel, workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { WorkItemCreateDialog } from "@/components/flow/work-item-create-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { FlowItemLevel, Workflow, WorkItemHierarchyNode } from "@/types/flow";

export default function FlowHierarchyPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<{ level: FlowItemLevel; label: string } | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<WorkItemHierarchyNode | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const hierarchyQuery = useQuery({
    queryKey: ["flow", "hierarchy", selectedProjectId],
    queryFn: () => flowApi.getProjectHierarchy(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });

  const subtaskMutation = useMutation({
    mutationFn: () => flowApi.createSubtask(accessToken ?? "", subtaskParent!.id, {
      project_id: subtaskParent!.project_id,
      title: subtaskTitle.trim(),
      item_level: "subtask"
    }),
    onSuccess: () => {
      addToast({ type: "success", title: "Subtask created" });
      setSubtaskParent(null);
      setSubtaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Subtask failed", message: error instanceof Error ? error.message : "Unable to create subtask." })
  });

  return (
    <>
      <PageHeader title="Hierarchy" description="Plan initiatives, features, work items, and subtasks." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Hierarchy" }]} />} actions={<FlowHeaderActions onCreate={() => setCreateOpen(true)} />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view hierarchy" /> : hierarchyQuery.isLoading ? <LoadingState /> : (hierarchyQuery.data?.items ?? []).length === 0 ? (
        <EmptyState title="No hierarchy yet. Create an initiative or work item to begin." />
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button onClick={() => { setCreatePreset({ level: "initiative", label: "Create Initiative: top-level outcome, no parent." }); setCreateOpen(true); }}>Create Initiative</Button>
            <Button variant="outline" onClick={() => { setCreatePreset({ level: "feature", label: "Create Feature: select an initiative parent in Relationships." }); setCreateOpen(true); }}>Create Feature</Button>
            <Button variant="outline" onClick={() => { setCreatePreset({ level: "work_item", label: "Create Story: execution work under a feature or initiative." }); setCreateOpen(true); }}>Create Story</Button>
            <Button variant="outline" onClick={() => { setCreatePreset({ level: "work_item", label: "Create Task: execution task under a feature or initiative." }); setCreateOpen(true); }}>Create Task</Button>
          </div>
          <div className="space-y-2">
            {(hierarchyQuery.data?.items ?? []).map((node) => (
              <HierarchyNode key={node.id} node={node} workflow={workflowQuery.data} depth={0} onAddSubtask={setSubtaskParent} />
            ))}
          </div>
        </div>
      )}
      {subtaskParent ? (
        <div role="dialog" aria-label="Add subtask" className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4">
          <form className="w-full max-w-md rounded-lg border bg-card p-4 shadow-lg" onSubmit={(event) => { event.preventDefault(); if (subtaskTitle.trim()) subtaskMutation.mutate(); }}>
            <h2 className="text-lg font-semibold">Add Subtask</h2>
            <p className="mt-1 text-sm text-muted-foreground">Parent Work: {subtaskParent.title}</p>
            <Input className="mt-4" aria-label="Subtask title" placeholder="Subtask title" value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSubtaskParent(null)}>Cancel</Button>
              <Button disabled={!subtaskTitle.trim() || subtaskMutation.isPending}>{subtaskMutation.isPending ? "Adding..." : "Add Subtask"}</Button>
            </div>
          </form>
        </div>
      ) : null}
      <WorkItemCreateDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreatePreset(null);
        }}
        initialItemLevel={createPreset?.level ?? "work_item"}
        lockItemLevel={Boolean(createPreset)}
        contextLabel={createPreset?.label}
      />
    </>
  );
}

function HierarchyNode({ node, workflow, depth, onAddSubtask }: { node: WorkItemHierarchyNode; workflow?: Workflow; depth: number; onAddSubtask: (node: WorkItemHierarchyNode) => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-background p-3" style={{ marginLeft: `${depth * 20}px` }}>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{itemLevelLabel(node.item_level)}</span>
        <Link href={`/flow/work-items/${node.id}`} className="font-medium text-primary hover:underline">{node.title}</Link>
        <StatusBadge value={workflowStatusLabelFor(workflow, node.status_id)} />
        <PriorityBadge value={node.priority_id} />
        {node.item_level === "work_item" ? <Button size="sm" variant="outline" onClick={() => onAddSubtask(node)}>Add Subtask</Button> : null}
      </div>
      {node.children.length > 0 ? (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => <HierarchyNode key={child.id} node={child} workflow={workflow} depth={depth + 1} onAddSubtask={onAddSubtask} />)}
        </div>
      ) : null}
    </div>
  );
}
