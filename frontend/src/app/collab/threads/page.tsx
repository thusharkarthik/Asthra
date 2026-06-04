"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ThreadsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const threadsQuery = useQuery({ queryKey: ["collab", "threads", selectedWorkspaceId], queryFn: () => collabApi.listThreads(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const createMutation = useMutation({
    mutationFn: () => collabApi.createThread(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, project_id: selectedProjectId, title, status: "open", created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => { setTitle(""); setOpen(false); queryClient.invalidateQueries({ queryKey: ["collab", "threads", selectedWorkspaceId] }); }
  });
  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Threads" description="Discussion threads tied to workspace and project context." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage threads" /> : (
        <div className="space-y-4">
          <div className="flex justify-end"><QuickCreateButton label="Create thread" onClick={() => setOpen(true)} /></div>
          {threadsQuery.isLoading ? <LoadingState /> : (threadsQuery.data ?? []).length === 0 ? <EmptyState title="No threads yet" /> : (
            <EntityTable columns={["Title", "Status", "Entity", "Created By"]}>
              {(threadsQuery.data ?? []).map((thread) => <EntityTableRow key={thread.id} columns={4}><Link className="font-medium text-primary hover:underline" href={`/collab/threads/${thread.id}`}>{thread.title}</Link><StatusBadge value={thread.status} /><span>{thread.entity_type ?? "General"}</span><span>{thread.created_by_id}</span></EntityTableRow>)}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create thread" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Thread title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
