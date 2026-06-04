"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { MetricCard } from "@/components/modules/metric-card";
import { WidgetGrid } from "@/components/modules/widget-grid";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MetricsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const definitionsQuery = useQuery({ queryKey: ["insights", "metric-definitions", selectedWorkspaceId], queryFn: () => insightsApi.listMetricDefinitions(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const snapshotsQuery = useQuery({ queryKey: ["insights", "metric-snapshots", selectedWorkspaceId], queryFn: () => insightsApi.listMetricSnapshots(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Metrics" description="Metric definitions and latest snapshots." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view metrics" /> : definitionsQuery.isLoading || snapshotsQuery.isLoading ? <LoadingState /> : (
        <>
          <WidgetGrid>{(snapshotsQuery.data ?? []).slice(0, 3).map((snapshot) => <MetricCard key={snapshot.id} title={snapshot.metric_key} value={snapshot.value} />)}</WidgetGrid>
          {(definitionsQuery.data ?? []).length === 0 ? <EmptyState title="No metric definitions yet" /> : (
            <EntityTable columns={["Metric", "Key", "Source", "Unit"]}>
              {(definitionsQuery.data ?? []).map((metric) => <EntityTableRow key={metric.id} columns={4}><span className="font-medium">{metric.name}</span><span>{metric.metric_key}</span><span>{metric.source_service ?? "manual"}</span><span>{metric.unit ?? "-"}</span></EntityTableRow>)}
            </EntityTable>
          )}
        </>
      )}
    </div>
  );
}
