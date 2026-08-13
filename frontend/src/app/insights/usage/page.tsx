"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function UsagePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["insights", "usage", selectedWorkspaceId], queryFn: () => insightsApi.listUsageMetrics(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Usage Metrics" description="Usage telemetry captured across Asthra services." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view usage" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No usage metrics yet" /> : (
        <EntityTable columns={["Service", "Metric", "Value", "Captured"]}>
          {(query.data ?? []).map((metric) => <EntityTableRow key={metric.id} columns={4}><span className="font-medium">{metric.service_name}</span><span>{metric.metric_name}</span><span>{metric.value}</span><span>{metric.captured_at ?? "-"}</span></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
