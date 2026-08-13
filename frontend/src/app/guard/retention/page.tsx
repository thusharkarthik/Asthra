"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { guardNavItems } from "@/components/modules/module-navs";
import { ModuleSubnav } from "@/components/modules/product-experience";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function RetentionPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const retention = useQuery({ queryKey: ["guard", "retention", workspaceId], queryFn: () => guardApi.listRetentionPolicies(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Retention" description="Data retention policies and governance lifecycle rules." /><ModuleSubnav items={guardNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view retention policies" /> : retention.isLoading ? <LoadingState /> : (retention.data ?? []).length === 0 ? <EmptyState title="No retention policies yet" /> : <EntityTable columns={["Policy", "Data Type", "Retention", "Status"]}>{(retention.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.name}</span><span>{item.data_type}</span><span>{item.retention_days} days</span><ComplianceStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable>}</div>;
}
