"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollabBreadcrumbs } from "@/components/collab/collab-breadcrumbs";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const query = useQuery({ queryKey: ["collab", "announcements", selectedWorkspaceId], queryFn: () => collabApi.listAnnouncements(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const createMutation = useMutation({
    mutationFn: () => collabApi.createAnnouncement(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, title, content, status: "published", created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["collab", "announcements", selectedWorkspaceId] });
    }
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim() || !content.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Announcements" description="Workspace announcements and broad updates." actions={selectedWorkspaceId ? <QuickCreateButton label="Create announcement" onClick={() => setOpen(true)} /> : null} />
      <CollabBreadcrumbs items={[{ label: "Announcements" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view announcements" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No announcements yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">{(query.data ?? []).map((announcement) => <div key={announcement.id} className="rounded-md border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium">{announcement.title}</div><StatusBadge value={announcement.status} /></div><p className="mt-2 text-sm text-muted-foreground">{announcement.content}</p></div>)}</div>
      )}
      <CreateDialog title="Create announcement" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input aria-label="Announcement title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea aria-label="Announcement content" className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" placeholder="Announcement content" value={content} onChange={(event) => setContent(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim() || !content.trim()}>{createMutation.isPending ? "Publishing..." : "Publish"}</Button>
        </form>
      </CreateDialog>
    </div>
  );
}
