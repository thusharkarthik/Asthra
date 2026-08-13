"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { devNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DevEnvironmentsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const environments = useQuery({ queryKey: ["dev", "environments", workspaceId], queryFn: () => devApi.listEnvironments(token ?? "", workspaceId), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Environments" description="Track dev, test, staging, and production environments." /><ModuleSubnav items={devNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view environments" /> : environments.isLoading ? <LoadingState /> : (environments.data ?? []).length === 0 ? <EmptyState title="No environments registered yet" /> : <EntityTable columns={["Environment", "Type", "Workspace"]}>{(environments.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><EntityBadge value={item.environment_type} /><span>{item.workspace_id}</span></EntityTableRow>)}</EntityTable>}</div>;
}
