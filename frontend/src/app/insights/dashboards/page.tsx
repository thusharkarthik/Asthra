"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { WidgetGrid } from "@/components/modules/widget-grid";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DashboardsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["insights", "dashboards", selectedWorkspaceId], queryFn: () => insightsApi.listDashboards(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboards" description="Dashboard cards and widget placeholders." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view dashboards" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No dashboards yet" /> : (
        <WidgetGrid>{(query.data ?? []).map((dashboard) => <ModuleDashboardCard key={dashboard.id} title={dashboard.name}><p className="text-sm text-muted-foreground">{dashboard.description ?? "Widget grid placeholder"}</p></ModuleDashboardCard>)}</WidgetGrid>
      )}
    </div>
  );
}
