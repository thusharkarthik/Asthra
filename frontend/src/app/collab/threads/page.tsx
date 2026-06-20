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
import { CollabBreadcrumbs } from "@/components/collab/collab-breadcrumbs";
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
  const [topic, setTopic] = useState("general");
  const [search, setSearch] = useState("");
  const threadsQuery = useQuery({ queryKey: ["collab", "threads", selectedWorkspaceId], queryFn: () => collabApi.listThreads(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const createMutation = useMutation({
    mutationFn: () => collabApi.createThread(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, project_id: selectedProjectId, entity_type: topic || "general", title, status: "open", created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => { setTitle(""); setTopic("general"); setOpen(false); queryClient.invalidateQueries({ queryKey: ["collab", "threads", selectedWorkspaceId] }); }
  });
  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  const filteredThreads = (threadsQuery.data ?? []).filter((thread) => {
    const text = `${thread.title} ${thread.entity_type ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader title="Threads" description="Discussion threads tied to workspace and project context." />
      <CollabBreadcrumbs items={[{ label: "Threads" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage threads" /> : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input aria-label="Search threads" className="sm:max-w-sm" placeholder="Search threads or topics" value={search} onChange={(event) => setSearch(event.target.value)} />
            <QuickCreateButton label="Create thread" onClick={() => setOpen(true)} />
          </div>
          {threadsQuery.isLoading ? <LoadingState /> : filteredThreads.length === 0 ? <EmptyState title="Create a thread to start a workspace or project discussion" /> : (
            <EntityTable columns={["Title", "Status", "Entity", "Created By"]}>
              {filteredThreads.map((thread) => <EntityTableRow key={thread.id} columns={4}><Link className="font-medium text-primary hover:underline" href={`/collab/threads/${thread.id}`}>{thread.title}</Link><StatusBadge value={thread.status} /><span>{thread.entity_type ?? "General"}</span><span>User {thread.created_by_id}</span></EntityTableRow>)}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create thread" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Thread title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Thread topic" placeholder="Topic, for example project-discussion" value={topic} onChange={(event) => setTopic(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
