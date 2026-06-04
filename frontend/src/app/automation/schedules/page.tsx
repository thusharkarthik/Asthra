"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";

export default function SchedulesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const query = useQuery({ queryKey: ["automation", "schedules"], queryFn: () => automationApi.listSchedules(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-4"><PageHeader title="Schedules" description="Scheduled workflow runs." />{(query.data ?? []).length === 0 ? <EmptyState title="No schedules yet" /> : <EntityTable columns={["Workflow", "Interval", "Cron", "Active"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span>{item.workflow_id}</span><span>{item.interval_seconds ?? "-"}</span><span>{item.cron_expression ?? "-"}</span><span>{item.is_active ? "Yes" : "No"}</span></EntityTableRow>)}</EntityTable>}</div>;
}
