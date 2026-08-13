"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { RiskSeverityBadge } from "@/components/modules/risk-severity-badge";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function RisksPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const query = useQuery({ queryKey: ["guard", "risks", workspaceId], queryFn: () => guardApi.listRiskFindings(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Risk Findings" description="Security and compliance risk register." />{!workspaceId ? <EmptyState title="Select a workspace to view risks" /> : <EntityTable columns={["Title", "Severity", "Status", "Source"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.title}</span><RiskSeverityBadge value={item.severity} /><ComplianceStatusBadge value={item.status} /><span>{item.source ?? "-"}</span></EntityTableRow>)}</EntityTable>}</div>; }
