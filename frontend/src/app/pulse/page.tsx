"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { pulseNavItems } from "@/components/modules/module-navs";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { queryKeys } from "@/lib/queryKeys";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PulsePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const pathname = usePathname();
  const alertsQuery = useQuery({
    queryKey: ["pulse", "alerts", selectedWorkspaceId],
    queryFn: () => pulseApi.listAlerts(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const incidentsQuery = useQuery({
    queryKey: queryKeys.pulse.incidents(selectedWorkspaceId),
    queryFn: () => pulseApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const summaryQuery = useQuery({
    queryKey: queryKeys.pulse.dashboardSummary(selectedWorkspaceId),
    queryFn: () => pulseApi.getDashboardSummary(accessToken ?? "", selectedWorkspaceId ?? 0),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const statusPagesQuery = useQuery({ queryKey: ["pulse", "status-pages", selectedWorkspaceId], queryFn: () => pulseApi.listStatusPages(accessToken ?? "", { workspace_id: selectedWorkspaceId }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  const incidents = incidentsQuery.data ?? [];
  const activeIncidents = incidents.filter((incident) => !["resolved", "closed"].includes(incident.status));
  const sevOneTwo = incidents.filter((incident) => ["sev1", "sev2"].includes(incident.severity));
  const resolvedIncidents = incidents.filter((incident) => ["resolved", "closed"].includes(incident.status));
  const servicesAtRisk = new Set(activeIncidents.map((incident) => incident.impacted_service).filter(Boolean)).size;
  const summary = summaryQuery.data && !Array.isArray(summaryQuery.data) ? summaryQuery.data : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Pulse" description="Reliability workspace for alerts, incidents, on-call readiness, status pages, and postmortems." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/pulse/incidents">Create Incident</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/pulse/alerts">Create Alert</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/pulse/status-pages">Create Status Page</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={pulseNavItems} activePath={pathname} />
      {!selectedWorkspaceId ? <PlatformSetupGuide moduleName="Pulse" hasWorkspace={false} /> : (
        <>
          <ModuleStatsGrid
            stats={[
              { title: "Active Incidents", value: summary?.active_incidents ?? activeIncidents.length, description: "Incidents still in response" },
              { title: "SEV1/SEV2", value: summary ? summary.sev1_count + summary.sev2_count : sevOneTwo.length, description: "High-severity reliability events" },
              { title: "Resolved", value: summary?.resolved_incidents ?? resolvedIncidents.length, description: "Incidents closed or resolved" },
              { title: "Services At Risk", value: servicesAtRisk, description: "Impacted services on active incidents" }
            ]}
          />
          <ModuleDashboardCard title="Active Incidents">
            {incidentsQuery.isLoading ? <LoadingState /> : incidents.length === 0 ? <EmptyState title="No incidents yet" /> : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <Link key={incident.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/pulse/incidents/${incident.id}`}>
                    <div className="font-medium">{incident.title}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{incident.description ?? "No description"}</div>
                    <div className="mt-2 flex gap-2"><SeverityBadge value={incident.severity} /><SLABadge value={incident.status} /></div>
                  </Link>
                ))}
              </div>
            )}
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Recent Updates">
            {(alertsQuery.data ?? []).length === 0 ? <EmptyState title="No recent monitoring updates" /> : (
              <div className="space-y-3">
                {(alertsQuery.data ?? []).map((alert) => (
                  <div key={alert.id} className="rounded-md border p-3">
                    <div className="font-medium">{alert.title}</div>
                    <div className="mt-2 flex gap-2"><SeverityBadge value={alert.severity} /><SLABadge value={alert.status} /></div>
                  </div>
                ))}
              </div>
            )}
          </ModuleDashboardCard>
        </>
      )}
    </div>
  );
}
