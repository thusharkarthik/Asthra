"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ReportStatusBadge } from "@/components/modules/report-status-badge";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ReportsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["insights", "reports", selectedWorkspaceId], queryFn: () => insightsApi.listReports(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Report definitions and run status overview." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view reports" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No reports yet" /> : (
        <EntityTable columns={["Name", "Type", "Status"]}>
          {(query.data ?? []).map((report) => <EntityTableRow key={report.id} columns={3}><span className="font-medium">{report.name}</span><span>{report.report_type}</span><ReportStatusBadge value={report.status} /></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
