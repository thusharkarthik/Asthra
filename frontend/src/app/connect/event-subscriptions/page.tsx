"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { connectNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function EventSubscriptionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const subscriptions = useQuery({ queryKey: ["connect", "event-subscriptions", workspaceId], queryFn: () => connectApi.listEventSubscriptions(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Event Subscriptions" description="Subscribe integrations and services to Asthra platform events." /><ModuleSubnav items={connectNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view event subscriptions" /> : subscriptions.isLoading ? <LoadingState /> : (subscriptions.data ?? []).length === 0 ? <EmptyState title="No event subscriptions yet" /> : <EntityTable columns={["Event", "Subscriber", "Reference", "Status"]}>{(subscriptions.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.event_name}</span><EntityBadge value={item.subscriber_type} /><span>{item.subscriber_reference ?? "None"}</span><EntityBadge value={item.is_active ? "active" : "inactive"} /></EntityTableRow>)}</EntityTable>}</div>;
}
