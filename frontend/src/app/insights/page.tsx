"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { insightsNavItems } from "@/components/modules/module-navs";
import { MetricCard } from "@/components/modules/metric-card";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { WidgetGrid } from "@/components/modules/widget-grid";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function InsightsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const pathname = usePathname();
  const dashboardsQuery = useQuery({ queryKey: ["insights", "dashboards", selectedWorkspaceId], queryFn: () => insightsApi.listDashboards(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 10 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const metricsQuery = useQuery({ queryKey: ["insights", "snapshots", selectedWorkspaceId], queryFn: () => insightsApi.listMetricSnapshots(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 6 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const reportsQuery = useQuery({ queryKey: ["insights", "reports", selectedWorkspaceId], queryFn: () => insightsApi.listReports(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 10 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const eventsQuery = useQuery({ queryKey: ["insights", "events", selectedWorkspaceId], queryFn: () => insightsApi.listInsightEvents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="Analytics workspace for dashboards, metrics, reports, usage, and insight events." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/insights/dashboards">Create Dashboard</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/insights/widgets">Add Widget</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/insights/reports">Create Report</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={insightsNavItems} activePath={pathname} />
      {!selectedWorkspaceId ? <PlatformSetupGuide moduleName="Insights" hasWorkspace={false} /> : (
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
          <AiPlaceholderPanel title="AI Insight Suggestions">Future AI can detect anomalies, forecast trends, and draft executive summaries from operational metrics.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
