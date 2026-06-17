"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, MessageSquare, Paperclip } from "lucide-react";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSetupState } from "@/components/flow/flow-setup-state";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_STATUS_OPTIONS, assigneeLabel, effortLabel, isHighRiskWorkItem, itemLevelLabel } from "@/components/flow/flow-utils";
import { WorkItemCreateDialog } from "@/components/flow/work-item-create-dialog";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function BoardsPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const organizations = useWorkspaceStore((state) => state.organizations);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useWorkspaceStore((state) => state.projects);
  const hasOrganization = Boolean(selectedOrganizationId) || organizations.length > 0;
  const hasWorkspace = Boolean(selectedWorkspaceId) || workspaces.length > 0;
  const hasProject = Boolean(selectedProjectId) || projects.length > 0;

  const workItemsQuery = useQuery({
    queryKey: ["flow", "board-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, statusName }: { id: number; statusName: string }) => flowApi.updateWorkItem(accessToken ?? "", id, { status_name: statusName }),
    onSuccess: () => {
      addToast({ type: "success", title: "Work item moved" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Move failed", message: error instanceof Error ? error.message : "Unable to move work item." })
  });

  return (
    <>
      <PageHeader title="Boards" description="Kanban-style planning for selected project work." actions={<FlowHeaderActions onCreate={() => setCreateOpen(true)} />} />
      <FlowSubnav />
      {!hasOrganization || !hasWorkspace || !hasProject ? <FlowSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasProject={hasProject} /> : (
        <div className="space-y-4">
          {workItemsQuery.isLoading ? <LoadingState /> : workItemsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load board items. <Button size="sm" variant="outline" onClick={() => workItemsQuery.refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4">
              {FLOW_STATUS_OPTIONS.map((column) => {
                const columnItems = (workItemsQuery.data ?? []).filter((item) => String(item.status_id ?? "1") === column.value);
                return (
                  <section key={column.value} className="min-h-96 rounded-lg border bg-card">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <span className="text-sm font-semibold">{column.label}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{columnItems.length}</span>
                    </div>
                    <div className="space-y-2 p-3">
                      {columnItems.map((item) => (
                        <div key={item.id} className="rounded-md border bg-background p-3 text-sm">
                          <Link href={`/flow/work-items/${item.id}`} className="font-medium text-primary hover:underline">{item.title}</Link>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{itemLevelLabel(item.item_level)}</span>
                            <StatusBadge value={item.status_id} />
                            <PriorityBadge value={item.priority_id} />
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Effort: {effortLabel(item.effort_size, item.effort_score)}</span>
                            {isHighRiskWorkItem(item) ? <span className="rounded-md border border-destructive/40 px-2 py-0.5 text-xs text-destructive">High risk</span> : null}
                            {item.parent_id ? <span className="rounded-md border px-2 py-0.5 text-xs">Parent #{item.parent_id}</span> : null}
                          </div>
                          <BoardCardIndicators accessToken={accessToken ?? ""} workItemId={item.id} />
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>{assigneeLabel(item.assignee_id)}</div>
                            {item.due_date ? <div>Due {new Date(item.due_date).toLocaleDateString()}</div> : null}
                          </div>
                          <label className="mt-3 grid gap-1 text-xs text-muted-foreground">
                            Move to
                            <Select
                              aria-label={`Move ${item.title}`}
                              value={FLOW_STATUS_OPTIONS.find((status) => Number(status.value) === item.status_id)?.name ?? column.name}
                              onChange={(event) => moveMutation.mutate({ id: item.id, statusName: event.target.value })}
                            >
                              {FLOW_STATUS_OPTIONS.map((status) => <option key={status.name} value={status.name}>{status.label}</option>)}
                            </Select>
                          </label>
                        </div>
                      ))}
                      {columnItems.length === 0 ? <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No items in {column.label}.</div> : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
      <WorkItemCreateDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function BoardCardIndicators({ accessToken, workItemId }: { accessToken: string; workItemId: number }) {
  const attachmentsQuery = useQuery({
    queryKey: ["flow", "board-attachments", workItemId],
    queryFn: () => flowApi.listAttachments(accessToken, workItemId),
    enabled: Boolean(accessToken),
    retry: 1
  });
  const commentsQuery = useQuery({
    queryKey: ["flow", "board-comments", workItemId],
    queryFn: () => flowApi.listComments(accessToken, workItemId),
    enabled: Boolean(accessToken),
    retry: 1
  });
  const relationsQuery = useQuery({
    queryKey: ["flow", "board-relations", workItemId],
    queryFn: () => flowApi.listRelations(accessToken, workItemId),
    enabled: Boolean(accessToken),
    retry: 1
  });

  const attachments = attachmentsQuery.data?.length ?? 0;
  const comments = commentsQuery.data?.length ?? 0;
  const relations = relationsQuery.data?.length ?? 0;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"><Paperclip className="h-3 w-3" />{attachments}</span>
      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"><MessageSquare className="h-3 w-3" />{comments}</span>
      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"><Link2 className="h-3 w-3" />{relations}</span>
    </div>
  );
}
