"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ExecutionTimeline } from "@/components/modules/execution-timeline";
import { automationNavItems } from "@/components/modules/module-navs";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { AiPlaceholderPanel, ModulePrimaryActions, ModuleSubnav } from "@/components/modules/product-experience";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { WorkflowStatusBadge } from "@/components/modules/workflow-status-badge";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function AutomationPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const workflows = useQuery({ queryKey: ["automation", "workflows", workspaceId], queryFn: () => automationApi.listWorkflows(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const executions = useQuery({ queryKey: ["automation", "executions"], queryFn: () => automationApi.listExecutions(token ?? "", { limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const schedules = useQuery({ queryKey: ["automation", "schedules"], queryFn: () => automationApi.listSchedules(token ?? "", { limit: 50 }), enabled: Boolean(token && workspaceId), retry: 1 });

  return (
    <div className="space-y-6">
      <PageHeader title="Automation" description="Workflow orchestration foundation for triggers, conditions, actions, executions, and schedules." actions={<ModulePrimaryActions><Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" href="/automation/workflows">Create Workflow</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/automation/schedules">Schedule Workflow</Link><Link className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium" href="/automation/templates">Use Template</Link></ModulePrimaryActions>} />
      <ModuleSubnav items={automationNavItems} activePath={pathname} />
      {!workspaceId ? <PlatformSetupGuide moduleName="Automation" hasWorkspace={false} /> : (
        <>
          <ModuleStatsGrid stats={[
            { title: "Workflows", value: (workflows.data ?? []).length, description: "Configured workflow definitions" },
            { title: "Executions", value: (executions.data ?? []).length, description: "Recent placeholder runs" },
            { title: "Schedules", value: (schedules.data ?? []).length, description: "Workflow run schedules" }
          ]} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleDashboardCard title="Workflows">
              {workflows.isLoading ? <LoadingState /> : (workflows.data ?? []).length === 0 ? <EmptyState title="No workflows yet" /> : <div className="space-y-3">{(workflows.data ?? []).map((item) => <Link key={item.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/automation/workflows/${item.id}`}><div className="font-medium">{item.name}</div><div className="mt-2"><WorkflowStatusBadge value={item.status} /></div></Link>)}</div>}
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Execution History">
              <ExecutionTimeline executions={executions.data ?? []} />
            </ModuleDashboardCard>
          </div>
          <AiPlaceholderPanel title="AI Workflow Suggestions">Future AI can generate workflow drafts, suggest trigger and condition logic, and prepare safe human-approved automation plans.</AiPlaceholderPanel>
        </>
      )}
    </div>
  );
}
