"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { insightsNavItems } from "@/components/modules/module-navs";
import { EntityLinkCard, ModuleSubnav } from "@/components/modules/product-experience";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function InsightWidgetsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const dashboards = useQuery({ queryKey: ["insights", "dashboards", workspaceId], queryFn: () => insightsApi.listDashboards(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Widgets" description="Dashboard widget configuration and future visualization library." /><ModuleSubnav items={insightsNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view widgets" /> : dashboards.isLoading ? <LoadingState /> : (dashboards.data ?? []).length === 0 ? <EmptyState title="Create a dashboard before adding widgets" /> : <div className="grid gap-3 md:grid-cols-2">{(dashboards.data ?? []).map((dashboard) => <EntityLinkCard key={dashboard.id} href="/insights/dashboards" title={dashboard.name} description="Open dashboard page to manage widgets." />)}</div>}</div>;
}
