"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkItemsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const workItemsQuery = useQuery({
    queryKey: ["flow", "work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });

  const createMutation = useMutation({
    mutationFn: () =>
      flowApi.createWorkItem(accessToken ?? "", {
        project_id: selectedProjectId ?? 0,
        title,
        description,
        type_id: 1,
        status_id: 1,
        priority_id: 2,
        reporter_id: currentUser?.id ?? 1
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["flow", "work-items", selectedProjectId] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedProjectId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Work Items" description="List, filter, and create Flow work items." />
      {!selectedProjectId ? (
        <EmptyState title="Select a project to manage work items" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Filters placeholder: status, assignee, priority.</div>
            <Button onClick={() => setCreateOpen(true)}>Create work item</Button>
          </div>
          {workItemsQuery.isLoading ? <LoadingState /> : workItemsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load work items.</div>
          ) : (workItemsQuery.data ?? []).length === 0 ? <EmptyState title="No work items yet" /> : (
            <EntityTable columns={["Title", "Status", "Priority", "Assignee"]}>
              {(workItemsQuery.data ?? []).map((item) => (
                <EntityTableRow key={item.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
                  <StatusBadge value={item.status_id} />
                  <PriorityBadge value={item.priority_id} />
                  <span>{item.assignee_id ?? "Unassigned"}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create work item" open={isCreateOpen} onOpenChange={setCreateOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Work item description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
