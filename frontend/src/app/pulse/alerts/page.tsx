"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function AlertsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const alertsQuery = useQuery({
    queryKey: ["pulse", "alerts", selectedWorkspaceId],
    queryFn: () => pulseApi.listAlerts(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Alerts" description="Incoming reliability signals and monitoring alerts." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view alerts" /> : alertsQuery.isLoading ? <LoadingState /> : (alertsQuery.data ?? []).length === 0 ? <EmptyState title="No alerts yet" /> : (
        <EntityTable columns={["Title", "Severity", "Status", "Source"]}>
          {(alertsQuery.data ?? []).map((alert) => (
            <EntityTableRow key={alert.id} columns={4}>
              <span className="font-medium">{alert.title}</span>
              <SeverityBadge value={alert.severity} />
              <SLABadge value={alert.status} />
              <span>{alert.source ?? "Unknown"}</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
    </div>
  );
}
