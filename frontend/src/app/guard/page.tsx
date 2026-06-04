"use client";

import { useQuery } from "@tanstack/react-query";
import { AuditEventTable } from "@/components/modules/audit-event-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { RiskSeverityBadge } from "@/components/modules/risk-severity-badge";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function GuardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const policies = useQuery({ queryKey: ["guard", "policies", workspaceId], queryFn: () => guardApi.listPolicies(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const risks = useQuery({ queryKey: ["guard", "risks", workspaceId], queryFn: () => guardApi.listRiskFindings(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const audits = useQuery({ queryKey: ["guard", "audits", workspaceId], queryFn: () => guardApi.listAuditEvents(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Guard" description="Security, governance, compliance, audit, and risk visibility." />{!workspaceId ? <EmptyState title="Select a workspace to load Guard" /> : <><ModuleStatsGrid stats={[{ title: "Policies", value: (policies.data ?? []).length, description: "Security and retention rules" }, { title: "Risk Findings", value: (risks.data ?? []).length, description: "Open governance risks" }, { title: "Audit Events", value: (audits.data ?? []).length, description: "Tracked security events" }]} /><div className="grid gap-4 lg:grid-cols-2"><ModuleDashboardCard title="Risk Findings">{(risks.data ?? []).length === 0 ? <EmptyState title="No risk findings yet" /> : <div className="space-y-3">{(risks.data ?? []).map((risk) => <div key={risk.id} className="rounded-md border p-3"><div className="font-medium">{risk.title}</div><div className="mt-2 flex gap-2"><RiskSeverityBadge value={risk.severity} /><ComplianceStatusBadge value={risk.status} /></div></div>)}</div>}</ModuleDashboardCard><ModuleDashboardCard title="Audit Events"><AuditEventTable events={audits.data ?? []} /></ModuleDashboardCard></div></>}</div>;
}
