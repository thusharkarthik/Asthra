"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { PulseBreadcrumbs } from "@/components/pulse/pulse-breadcrumbs";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PulseServicesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const statusPagesQuery = useQuery({
    queryKey: ["pulse", "status-pages", selectedWorkspaceId],
    queryFn: () => pulseApi.listStatusPages(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Services" description="Service health foundation backed by Pulse status pages." />
      <PulseBreadcrumbs items={[{ label: "Services" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view services" /> : statusPagesQuery.isLoading ? <LoadingState /> : (statusPagesQuery.data ?? []).length === 0 ? <EmptyState title="No service status pages yet" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(statusPagesQuery.data ?? []).map((statusPage) => (
            <ModuleDashboardCard key={statusPage.id} title={statusPage.name}>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{statusPage.description ?? "No description"}</p>
                <StatusBadge value={statusPage.is_public ? "public" : "private"} />
              </div>
            </ModuleDashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
