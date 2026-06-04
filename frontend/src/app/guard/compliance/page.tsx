"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function CompliancePage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const checks = useQuery({ queryKey: ["guard", "compliance", workspaceId], queryFn: () => guardApi.listComplianceChecks(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); const retention = useQuery({ queryKey: ["guard", "retention", workspaceId], queryFn: () => guardApi.listRetentionPolicies(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Compliance" description="Compliance checks and data retention policies." />{!workspaceId ? <EmptyState title="Select a workspace to view compliance" /> : <><EntityTable columns={["Framework", "Control", "Status"]}>{(checks.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.framework}</span><span>{item.control}</span><ComplianceStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable><EntityTable columns={["Retention Policy", "Data Type", "Days"]}>{(retention.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.data_type}</span><span>{item.retention_days}</span></EntityTableRow>)}</EntityTable></>}</div>; }
