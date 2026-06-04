"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DeploymentStatusBadge } from "@/components/modules/deployment-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DeploymentsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["dev", "deployments", selectedWorkspaceId], queryFn: () => devApi.listDeployments(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Deployments" description="Deployment history and status by environment and service." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view deployments" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No deployments yet" /> : (
        <EntityTable columns={["Version", "Status", "Environment", "Service"]}>
          {(query.data ?? []).map((deployment) => <EntityTableRow key={deployment.id} columns={4}><span className="font-medium">{deployment.version ?? `Deployment ${deployment.id}`}</span><DeploymentStatusBadge value={deployment.status} /><span>{deployment.environment_id}</span><span>{deployment.service_id ?? "Unlinked"}</span></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
