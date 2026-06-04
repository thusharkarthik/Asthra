"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { collabNavItems } from "@/components/modules/module-navs";
import { ModuleSubnav } from "@/components/modules/product-experience";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function CollabActivityPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const projectId = useWorkspaceStore((s) => s.selectedProjectId);
  const pathname = usePathname();
  const activity = useQuery({ queryKey: ["collab", "activity", workspaceId], queryFn: () => collabApi.listActivity(token ?? "", { workspace_id: workspaceId, project_id: projectId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Activity" description="Workspace collaboration activity across comments, updates, threads, and mentions." /><ModuleSubnav items={collabNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view activity" /> : activity.isLoading ? <LoadingState /> : (activity.data ?? []).length === 0 ? <EmptyState title="No collaboration activity yet" /> : <ActivityFeed items={(activity.data ?? []).map((item) => ({ id: item.id, title: item.action, description: item.description, actor: item.actor_user_id ? `User ${item.actor_user_id}` : "System", timestamp: item.created_at }))} />}</div>;
}
