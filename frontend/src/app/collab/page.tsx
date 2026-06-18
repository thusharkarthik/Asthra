"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { collabNavItems } from "@/components/modules/module-navs";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { StatusBadge } from "@/components/modules/status-badge";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function CollabPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const pathname = usePathname();
  const threadsQuery = useQuery({ queryKey: ["collab", "threads", selectedWorkspaceId], queryFn: () => collabApi.listThreads(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const announcementsQuery = useQuery({ queryKey: ["collab", "announcements", selectedWorkspaceId], queryFn: () => collabApi.listAnnouncements(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const updatesQuery = useQuery({ queryKey: ["collab", "team-updates", selectedWorkspaceId], queryFn: () => collabApi.listTeamUpdates(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const activityQuery = useQuery({ queryKey: ["collab", "activity", selectedWorkspaceId], queryFn: () => collabApi.listActivity(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Collab" description="Async collaboration layer for threads, announcements, team updates, and activity streams." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/collab/threads">Create Thread</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/collab/announcements">Create Announcement</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/collab/team-updates">Post Team Update</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={collabNavItems} activePath={pathname} />
      {!selectedWorkspaceId ? <PlatformSetupGuide moduleName="Collab" hasWorkspace={false} /> : (
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
          <AiPlaceholderPanel title="AI Conversation Summary">Future AI can summarize long threads, extract follow-ups, and convert discussions into linked work items.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
