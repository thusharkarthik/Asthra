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
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IdeasPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUsers, setTargetUsers] = useState("");

  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const createMutation = useMutation({
    mutationFn: () =>
      discoverApi.createIdea(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        project_id: selectedProjectId,
        title,
        description,
        target_users: targetUsers,
        status: "new",
        created_by_id: currentUser?.id ?? 1
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTargetUsers("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["discover", "ideas", selectedWorkspaceId] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Ideas" description="Capture, compare, and validate product ideas." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage ideas" /> : (
        <div className="space-y-4">
          <div className="flex justify-end"><QuickCreateButton label="Create idea" onClick={() => setOpen(true)} /></div>
          {ideasQuery.isLoading ? <LoadingState /> : ideasQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load ideas.</div>
          ) : (ideasQuery.data ?? []).length === 0 ? <EmptyState title="No ideas yet" /> : (
            <EntityTable columns={["Title", "Status", "Target Users", "Project"]}>
              {(ideasQuery.data ?? []).map((idea) => (
                <EntityTableRow key={idea.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>{idea.title}</Link>
                  <StatusBadge value={idea.status} />
                  <span>{idea.target_users ?? "Not set"}</span>
                  <span>{idea.project_id ?? "Workspace"}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create idea" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Idea title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Idea description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Input aria-label="Target users" placeholder="Target users" value={targetUsers} onChange={(event) => setTargetUsers(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim() || !description.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
