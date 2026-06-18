"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuditEventTable } from "@/components/modules/audit-event-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { guardNavItems } from "@/components/modules/module-navs";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { RiskSeverityBadge } from "@/components/modules/risk-severity-badge";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function GuardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const policies = useQuery({ queryKey: ["guard", "policies", workspaceId], queryFn: () => guardApi.listPolicies(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const risks = useQuery({ queryKey: ["guard", "risks", workspaceId], queryFn: () => guardApi.listRiskFindings(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const audits = useQuery({ queryKey: ["guard", "audits", workspaceId], queryFn: () => guardApi.listAuditEvents(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const accessReviews = useQuery({ queryKey: ["guard", "access-reviews", workspaceId], queryFn: () => guardApi.listAccessReviews(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const compliance = useQuery({ queryKey: ["guard", "compliance", workspaceId], queryFn: () => guardApi.listComplianceChecks(token ?? "", { workspace_id: workspaceId, limit: 10 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return (
    <div className="space-y-6">
      <PageHeader title="Guard" description="Security, governance, compliance, audit, and risk visibility." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/guard/policies">Create Policy</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/guard/access-reviews">Start Access Review</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/guard/risks">Add Risk Finding</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={guardNavItems} activePath={pathname} />
      {!workspaceId ? <PlatformSetupGuide moduleName="Guard" hasWorkspace={false} /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Active Policies", value: (policies.data ?? []).filter((item) => item.status === "active").length, description: "Security and governance rules" },
            { title: "Open Risks", value: (risks.data ?? []).filter((risk) => risk.status !== "closed").length, description: "Risk findings to resolve" },
            { title: "Pending Access Reviews", value: (accessReviews.data ?? []).filter((review) => review.status !== "completed").length, description: "Reviews needing action" },
            { title: "Compliance Checks", value: (compliance.data ?? []).length, description: "Framework controls tracked" },
            { title: "Critical Audit Events", value: (audits.data ?? []).filter((event) => event.severity === "critical").length, description: "High-risk activity" }
          ]} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleDashboardCard title="Risk Findings">{(risks.data ?? []).length === 0 ? <EmptyState title="No risk findings yet" /> : <div className="space-y-3">{(risks.data ?? []).map((risk) => <div key={risk.id} className="rounded-md border p-3"><div className="font-medium">{risk.title}</div><div className="mt-2 flex gap-2"><RiskSeverityBadge value={risk.severity} /><ComplianceStatusBadge value={risk.status} /></div></div>)}</div>}</ModuleDashboardCard>
            <ModuleDashboardCard title="Audit Trail"><AuditEventTable events={audits.data ?? []} /></ModuleDashboardCard>
          </div>
          <AiPlaceholderPanel title="AI Governance Suggestions">Future AI can explain findings, summarize access reviews, recommend policy changes, and highlight compliance risk.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
