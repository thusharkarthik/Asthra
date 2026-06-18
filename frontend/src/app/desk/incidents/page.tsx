"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DeskSetupState } from "@/components/desk/desk-setup-state";
import { DeskSubnav } from "@/components/desk/desk-subnav";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DeskIncidentsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const incidentsQuery = useQuery({ queryKey: ["desk", "incidents", selectedWorkspaceId], queryFn: () => deskApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const incidents = incidentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="Track Desk-linked incidents that require coordinated service response." />
      <DeskSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DeskSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : incidentsQuery.isLoading ? <LoadingState /> : incidents.length === 0 ? <EmptyState title="No Desk incidents yet" /> : (
        <EntityTable columns={["Incident", "Severity", "Status", "Linked Ticket"]}>
          {incidents.map((incident) => (
            <EntityTableRow key={incident.id} columns={4}>
              <span className="font-medium">{incident.title}</span>
              <SeverityBadge value={incident.severity} />
              <SLABadge value={incident.status} />
              <span>{incident.ticket_id ? `Ticket ${incident.ticket_id}` : "Not linked"}</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
    </div>
  );
}
