"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WebhooksPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const webhooks = useQuery({ queryKey: ["connect", "webhooks", workspaceId], queryFn: () => connectApi.listWebhooks(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const deliveries = useQuery({ queryKey: ["connect", "deliveries"], queryFn: () => connectApi.listWebhookDeliveries(token ?? "", { limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-4"><PageHeader title="Webhooks" description="Webhook endpoints and delivery log table." />{!workspaceId ? <EmptyState title="Select a workspace to view webhooks" /> : <><EntityTable columns={["Name", "Target", "Active"]}>{(webhooks.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.target_url}</span><span>{item.is_active ? "Yes" : "No"}</span></EntityTableRow>)}</EntityTable><EntityTable columns={["Event", "Status", "Response"]}>{(deliveries.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span>{item.event_type}</span><IntegrationStatusBadge value={item.delivery_status} /><span>{item.response_status ?? "-"}</span></EntityTableRow>)}</EntityTable></>}</div>;
}
