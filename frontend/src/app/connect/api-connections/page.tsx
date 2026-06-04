"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function ApiConnectionsPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const query = useQuery({ queryKey: ["connect", "api-connections", workspaceId], queryFn: () => connectApi.listApiConnections(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="API Connections" description="Configured external API connection metadata." />{!workspaceId ? <EmptyState title="Select a workspace to view API connections" /> : <EntityTable columns={["Provider", "Auth", "Status"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.provider}</span><span>{item.auth_type}</span><IntegrationStatusBadge value={item.connection_status} /></EntityTableRow>)}</EntityTable>}</div>; }
