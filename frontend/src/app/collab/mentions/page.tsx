"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { collabNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MentionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.currentUser);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const mentions = useQuery({ queryKey: ["collab", "mentions", workspaceId], queryFn: () => collabApi.listMentions(token ?? "", { workspace_id: workspaceId, mentioned_user_id: user?.id, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Mentions" description="Track conversations that need your attention." /><ModuleSubnav items={collabNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view mentions" /> : mentions.isLoading ? <LoadingState /> : (mentions.data ?? []).length === 0 ? <EmptyState title="No mentions yet" /> : <EntityTable columns={["Entity", "Type", "Mentioned User", "Actor"]}>{(mentions.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">Entity {item.entity_id}</span><EntityBadge value={item.entity_type} /><span>User {item.mentioned_user_id}</span><span>{item.actor_user_id ? `User ${item.actor_user_id}` : "System"}</span></EntityTableRow>)}</EntityTable>}</div>;
}
