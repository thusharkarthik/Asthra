"use client";

import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/modules/metric-card";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { WidgetGrid } from "@/components/modules/widget-grid";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function InsightsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const dashboardsQuery = useQuery({ queryKey: ["insights", "dashboards", selectedWorkspaceId], queryFn: () => insightsApi.listDashboards(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 10 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const metricsQuery = useQuery({ queryKey: ["insights", "snapshots", selectedWorkspaceId], queryFn: () => insightsApi.listMetricSnapshots(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 6 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const reportsQuery = useQuery({ queryKey: ["insights", "reports", selectedWorkspaceId], queryFn: () => insightsApi.listReports(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 10 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const eventsQuery = useQuery({ queryKey: ["insights", "events", selectedWorkspaceId], queryFn: () => insightsApi.listInsightEvents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="Analytics workspace for dashboards, metrics, reports, usage, and insight events." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to load Insights" /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Dashboards", value: (dashboardsQuery.data ?? []).length, description: "Configured dashboard surfaces" },
            { title: "Metrics", value: (metricsQuery.data ?? []).length, description: "Recent metric snapshots" },
            { title: "Reports", value: (reportsQuery.data ?? []).length, description: "Operational report definitions" }
          ]} />
          <WidgetGrid>
            {(metricsQuery.data ?? []).slice(0, 3).map((metric) => <MetricCard key={metric.id} title={metric.metric_key} value={metric.value} />)}
            {(metricsQuery.isLoading && (metricsQuery.data ?? []).length === 0) ? <LoadingState /> : null}
          </WidgetGrid>
          <ModuleDashboardCard title="Insight Events">
            <ActivityFeed items={(eventsQuery.data ?? []).map((event) => ({ id: event.id, title: event.title, description: event.description, actor: event.severity, timestamp: event.created_at }))} />
          </ModuleDashboardCard>
        </>
      )}
    </div>
  );
}
