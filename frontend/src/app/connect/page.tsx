"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ConnectPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const integrations = useQuery({ queryKey: ["connect", "integrations", workspaceId], queryFn: () => connectApi.listIntegrations(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const webhooks = useQuery({ queryKey: ["connect", "webhooks", workspaceId], queryFn: () => connectApi.listWebhooks(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const syncJobs = useQuery({ queryKey: ["connect", "sync-jobs"], queryFn: () => connectApi.listSyncJobs(token ?? "", { limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Connect" description="Integration platform for connectors, webhooks, subscriptions, sync jobs, and API connections." />{!workspaceId ? <EmptyState title="Select a workspace to load Connect" /> : <><ModuleStatsGrid stats={[{ title: "Integrations", value: (integrations.data ?? []).length, description: "Connected systems" }, { title: "Webhooks", value: (webhooks.data ?? []).length, description: "Outbound endpoints" }, { title: "Sync Jobs", value: (syncJobs.data ?? []).length, description: "Synchronization runs" }]} /><ModuleDashboardCard title="Integrations">{(integrations.data ?? []).length === 0 ? <EmptyState title="No integrations yet" /> : <div className="space-y-3">{(integrations.data ?? []).map((item) => <div key={item.id} className="rounded-md border p-3"><div className="font-medium">{item.name}</div><div className="mt-2 flex gap-2"><IntegrationStatusBadge value={item.status} /><span className="text-xs text-muted-foreground">{item.provider}</span></div></div>)}</div>}</ModuleDashboardCard></>}</div>;
}
