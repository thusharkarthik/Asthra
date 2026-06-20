"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { PulseBreadcrumbs } from "@/components/pulse/pulse-breadcrumbs";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PulseReportsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const incidentsQuery = useQuery({
    queryKey: ["pulse", "incidents", selectedWorkspaceId, "reports"],
    queryFn: () => pulseApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const incidents = incidentsQuery.data ?? [];
  const active = incidents.filter((incident) => !["resolved", "closed"].includes(incident.status));
  const severe = incidents.filter((incident) => ["sev1", "sev2"].includes(incident.severity));
  const resolved = incidents.filter((incident) => ["resolved", "closed"].includes(incident.status));

  return (
    <div className="space-y-4">
      <PageHeader title="Pulse Reports" description="Operational reliability summaries for incident response testing." />
      <PulseBreadcrumbs items={[{ label: "Reports" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view Pulse reports" /> : incidentsQuery.isLoading ? <LoadingState /> : (
        <ModuleStatsGrid
          stats={[
            { title: "Total Incidents", value: incidents.length, description: "Incidents in this workspace" },
            { title: "Active", value: active.length, description: "Open response work" },
            { title: "SEV1/SEV2", value: severe.length, description: "Highest-risk incidents" },
            { title: "Resolved", value: resolved.length, description: "Closed reliability events" }
          ]}
        />
      )}
    </div>
  );
}
