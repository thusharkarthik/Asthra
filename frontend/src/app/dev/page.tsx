"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { devNavItems } from "@/components/modules/module-navs";
import { DeploymentStatusBadge } from "@/components/modules/deployment-status-badge";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { ReleaseStatusBadge } from "@/components/modules/release-status-badge";
import { ServiceLifecycleBadge } from "@/components/modules/service-lifecycle-badge";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DevPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const pathname = usePathname();
  const reposQuery = useQuery({ queryKey: ["dev", "repos", selectedWorkspaceId], queryFn: () => devApi.listRepositories(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const deploymentsQuery = useQuery({ queryKey: ["dev", "deployments", selectedWorkspaceId], queryFn: () => devApi.listDeployments(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const releasesQuery = useQuery({ queryKey: ["dev", "releases", selectedWorkspaceId], queryFn: () => devApi.listReleases(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const servicesQuery = useQuery({ queryKey: ["dev", "services", selectedWorkspaceId], queryFn: () => devApi.listServices(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Dev" description="Engineering and DevOps visibility across repositories, deployments, releases, and service ownership." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/dev/repositories">Add Repository</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/dev/services">Register Service</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/dev/releases">Create Release</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={devNavItems} activePath={pathname} />
      {!selectedWorkspaceId ? <PlatformSetupGuide moduleName="Dev" hasWorkspace={false} /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Repositories", value: (reposQuery.data ?? []).length, description: "Connected codebases" },
            { title: "Deployments", value: (deploymentsQuery.data ?? []).length, description: "Recent delivery activity" },
            { title: "Services", value: (servicesQuery.data ?? []).length, description: "Catalogued software services" }
          ]} />
          <div className="grid gap-4 lg:grid-cols-3">
            <ModuleDashboardCard title="Recent Deployments">
              {deploymentsQuery.isLoading ? <LoadingState /> : (deploymentsQuery.data ?? []).length === 0 ? <EmptyState title="No deployments yet" /> : (
                <div className="space-y-3">{(deploymentsQuery.data ?? []).map((deployment) => (
                  <div key={deployment.id} className="rounded-md border p-3">
                    <div className="font-medium">{deployment.version ?? `Deployment ${deployment.id}`}</div>
                    <div className="mt-2"><DeploymentStatusBadge value={deployment.status} /></div>
                  </div>
                ))}</div>
              )}
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Releases">
              {(releasesQuery.data ?? []).length === 0 ? <EmptyState title="No releases yet" /> : (
                <div className="space-y-3">{(releasesQuery.data ?? []).map((release) => (
                  <div key={release.id} className="rounded-md border p-3">
                    <div className="font-medium">{release.version}</div>
                    <div className="mt-2"><ReleaseStatusBadge value={release.status} /></div>
                  </div>
                ))}</div>
              )}
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Service Catalog">
              {(servicesQuery.data ?? []).length === 0 ? <EmptyState title="No services yet" /> : (
                <div className="space-y-3">{(servicesQuery.data ?? []).map((service) => (
                  <Link key={service.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/dev/services/${service.id}`}>
                    <div className="font-medium">{service.name}</div>
                    <div className="mt-2"><ServiceLifecycleBadge value={service.lifecycle_status} /></div>
                  </Link>
                ))}</div>
              )}
            </ModuleDashboardCard>
          </div>
          <AiPlaceholderPanel title="AI Engineering Insights">Future AI can summarize release impact, deployment risk, dependency coupling, and architecture signals.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
