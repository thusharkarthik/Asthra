"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ExecutionTimeline } from "@/components/modules/execution-timeline";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";

export default function ExecutionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const query = useQuery({ queryKey: ["automation", "executions"], queryFn: () => automationApi.listExecutions(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-4"><PageHeader title="Executions" description="Workflow execution history." /><ExecutionTimeline executions={query.data ?? []} /></div>;
}
