"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function PoliciesPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const query = useQuery({ queryKey: ["guard", "policies", workspaceId], queryFn: () => guardApi.listPolicies(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Security Policies" description="Security and governance policy definitions." />{!workspaceId ? <EmptyState title="Select a workspace to view policies" /> : <EntityTable columns={["Name", "Type", "Status"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.policy_type}</span><ComplianceStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable>}</div>; }
