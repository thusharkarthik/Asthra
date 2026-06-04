"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { StatusBadge } from "@/components/modules/status-badge";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function CollabPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const threadsQuery = useQuery({ queryKey: ["collab", "threads", selectedWorkspaceId], queryFn: () => collabApi.listThreads(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const announcementsQuery = useQuery({ queryKey: ["collab", "announcements", selectedWorkspaceId], queryFn: () => collabApi.listAnnouncements(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const updatesQuery = useQuery({ queryKey: ["collab", "team-updates", selectedWorkspaceId], queryFn: () => collabApi.listTeamUpdates(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const activityQuery = useQuery({ queryKey: ["collab", "activity", selectedWorkspaceId], queryFn: () => collabApi.listActivity(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Collab" description="Async collaboration layer for threads, announcements, team updates, and activity streams." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to load Collab" /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Threads", value: (threadsQuery.data ?? []).length, description: "Open collaboration threads" },
            { title: "Announcements", value: (announcementsQuery.data ?? []).length, description: "Workspace broadcasts" },
            { title: "Team Updates", value: (updatesQuery.data ?? []).length, description: "Async status updates" }
          ]} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleDashboardCard title="Recent Threads">
              {threadsQuery.isLoading ? <LoadingState /> : (threadsQuery.data ?? []).length === 0 ? <EmptyState title="No threads yet" /> : (
                <div className="space-y-3">{(threadsQuery.data ?? []).map((thread) => (
                  <Link key={thread.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/collab/threads/${thread.id}`}>
                    <div className="font-medium">{thread.title}</div>
                    <div className="mt-2"><StatusBadge value={thread.status} /></div>
                  </Link>
                ))}</div>
              )}
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Activity Stream">
              <ActivityFeed items={(activityQuery.data ?? []).map((item) => ({ id: item.id, title: item.action, description: item.description, actor: item.actor_user_id ? `User ${item.actor_user_id}` : "System", timestamp: item.created_at }))} />
            </ModuleDashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
