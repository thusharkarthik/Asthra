"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { connectNavItems } from "@/components/modules/module-navs";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ConnectPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const integrations = useQuery({ queryKey: ["connect", "integrations", workspaceId], queryFn: () => connectApi.listIntegrations(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const webhooks = useQuery({ queryKey: ["connect", "webhooks", workspaceId], queryFn: () => connectApi.listWebhooks(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const syncJobs = useQuery({ queryKey: ["connect", "sync-jobs"], queryFn: () => connectApi.listSyncJobs(token ?? "", { limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const apiConnections = useQuery({ queryKey: ["connect", "api-connections", workspaceId], queryFn: () => connectApi.listApiConnections(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const subscriptions = useQuery({ queryKey: ["connect", "event-subscriptions", workspaceId], queryFn: () => connectApi.listEventSubscriptions(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Connect" description="Integration platform for connectors, webhooks, subscriptions, sync jobs, and API connections." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/connect/integrations">Add Integration</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/connect/webhooks">Create Webhook</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/connect/api-connections">Create API Connection</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={connectNavItems} activePath={pathname} />
      {!workspaceId ? <PlatformSetupGuide moduleName="Connect" hasWorkspace={false} /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Active Integrations", value: (integrations.data ?? []).filter((item) => item.status === "active").length, description: "Connected systems" },
            { title: "Failed Sync Jobs", value: (syncJobs.data ?? []).filter((job) => job.status === "failed").length, description: "Sync jobs needing attention" },
            { title: "Webhooks", value: (webhooks.data ?? []).length, description: "Outbound endpoints" },
            { title: "API Connections", value: (apiConnections.data ?? []).length, description: "Provider API connections" },
            { title: "Event Subscriptions", value: (subscriptions.data ?? []).length, description: "Event routing rules" }
          ]} />
          <ModuleDashboardCard title="Integration Catalog">{(integrations.data ?? []).length === 0 ? <EmptyState title="No integrations yet" /> : <div className="space-y-3">{(integrations.data ?? []).map((item) => <div key={item.id} className="rounded-md border p-3"><div className="font-medium">{item.name}</div><div className="mt-2 flex gap-2"><IntegrationStatusBadge value={item.status} /><span className="text-xs text-muted-foreground">{item.provider}</span></div></div>)}</div>}</ModuleDashboardCard>
          <AiPlaceholderPanel title="AI Integration Suggestions">Future AI can recommend integrations, detect sync anomalies, and suggest connector mappings.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
