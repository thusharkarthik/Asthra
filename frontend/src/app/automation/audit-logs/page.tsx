"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { automationNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";

export default function AutomationAuditLogsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const logs = useQuery({ queryKey: ["automation", "audit-logs"], queryFn: () => automationApi.listAuditLogs(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Automation Audit Logs" description="Track workflow changes, execution records, and placeholder action outcomes." /><ModuleSubnav items={automationNavItems} activePath={pathname} />{logs.isLoading ? <LoadingState /> : (logs.data ?? []).length === 0 ? <EmptyState title="No automation audit logs yet" /> : <EntityTable columns={["Action", "Status", "Workflow", "Execution", "Created"]}>{(logs.data ?? []).map((log) => <EntityTableRow key={log.id} columns={5}><span className="font-medium">{log.action}</span><EntityBadge value={log.status} /><span>{log.workflow_id ?? "None"}</span><span>{log.execution_id ?? "None"}</span><span className="text-muted-foreground">{log.created_at ?? "No date"}</span></EntityTableRow>)}</EntityTable>}</div>;
}
