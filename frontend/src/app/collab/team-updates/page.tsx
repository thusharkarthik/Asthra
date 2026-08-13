"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function TeamUpdatesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["collab", "team-updates", selectedWorkspaceId], queryFn: () => collabApi.listTeamUpdates(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Team Updates" description="Async updates from teams across the workspace." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view team updates" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No team updates yet" /> : (
        <div className="space-y-3">{(query.data ?? []).map((update) => <div key={update.id} className="rounded-md border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium">{update.title}</div><StatusBadge value={update.status} /></div><p className="mt-2 text-sm text-muted-foreground">{update.content}</p></div>)}</div>
      )}
    </div>
  );
}
