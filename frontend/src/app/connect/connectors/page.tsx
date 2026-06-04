"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { connectNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";

export default function ConnectorsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const connectors = useQuery({ queryKey: ["connect", "connectors"], queryFn: () => connectApi.listConnectors(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Connectors" description="Connector instances attached to integrations and external systems." /><ModuleSubnav items={connectNavItems} activePath={pathname} />{connectors.isLoading ? <LoadingState /> : (connectors.data ?? []).length === 0 ? <EmptyState title="No connectors configured yet" /> : <EntityTable columns={["Connector", "Type", "Integration", "Status"]}>{(connectors.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.connector_name}</span><EntityBadge value={item.connector_type} /><span>{item.integration_id}</span><IntegrationStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable>}</div>;
}
