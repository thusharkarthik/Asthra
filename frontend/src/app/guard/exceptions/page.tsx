"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { guardNavItems } from "@/components/modules/module-navs";
import { ModuleSubnav, RelationshipPlaceholder } from "@/components/modules/product-experience";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function SecurityExceptionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const exceptions = useQuery({ queryKey: ["guard", "exceptions", workspaceId], queryFn: () => guardApi.listSecurityExceptions(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Security Exceptions" description="Track accepted exceptions, waivers, and governance follow-ups." /><ModuleSubnav items={guardNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view security exceptions" /> : exceptions.isLoading ? <LoadingState /> : (exceptions.data ?? []).length === 0 ? <EmptyState title="No security exceptions yet" /> : <EntityTable columns={["Exception", "Status", "Requested By", "Description"]}>{(exceptions.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.title}</span><ComplianceStatusBadge value={item.status} /><span>{item.requested_by_id ? `User ${item.requested_by_id}` : "Unknown"}</span><span className="text-muted-foreground">{item.description ?? "No description"}</span></EntityTableRow>)}</EntityTable>}<RelationshipPlaceholder title="Mitigation notes placeholder" description="Future exception detail pages will connect mitigations, expiration review, risk findings, and audit events." /></div>;
}
