"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function AnnouncementsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["collab", "announcements", selectedWorkspaceId], queryFn: () => collabApi.listAnnouncements(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Announcements" description="Workspace announcements and broad updates." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view announcements" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No announcements yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">{(query.data ?? []).map((announcement) => <div key={announcement.id} className="rounded-md border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium">{announcement.title}</div><StatusBadge value={announcement.status} /></div><p className="mt-2 text-sm text-muted-foreground">{announcement.content}</p></div>)}</div>
      )}
    </div>
  );
}
