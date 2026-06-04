"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConfigJsonViewer } from "@/components/modules/config-json-viewer";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { ExecutionTimeline } from "@/components/modules/execution-timeline";
import { WorkflowStatusBadge } from "@/components/modules/workflow-status-badge";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";

export default function WorkflowDetailPage() {
  const id = useParams<{ id: string }>().id;
  const token = useAuthStore((s) => s.accessToken);
  const workflow = useQuery({ queryKey: ["automation", "workflow", id], queryFn: () => automationApi.getWorkflow(token ?? "", id), enabled: Boolean(token && id) });
  const triggers = useQuery({ queryKey: ["automation", "triggers", id], queryFn: () => automationApi.listTriggers(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const conditions = useQuery({ queryKey: ["automation", "conditions", id], queryFn: () => automationApi.listConditions(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const actions = useQuery({ queryKey: ["automation", "actions", id], queryFn: () => automationApi.listActions(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const executions = useQuery({ queryKey: ["automation", "executions", id], queryFn: () => automationApi.listExecutions(token ?? "", { workflow_id: Number(id), limit: 20 }), enabled: Boolean(token && id), retry: 1 });
  if (workflow.isLoading) return <DetailPanel title="Workflow"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!workflow.data) return <DetailPanel title="Workflow"><div className="text-sm text-destructive">Unable to load workflow.</div></DetailPanel>;
  return <div className="space-y-4"><EntityDetailHeader title={workflow.data.name} description={workflow.data.description} meta={<WorkflowStatusBadge value={workflow.data.status} />} /><div className="grid gap-4 lg:grid-cols-3"><DetailPanel title="Triggers"><ConfigJsonViewer value={triggers.data ?? []} /></DetailPanel><DetailPanel title="Conditions"><ConfigJsonViewer value={conditions.data ?? []} /></DetailPanel><DetailPanel title="Actions"><ConfigJsonViewer value={actions.data ?? []} /></DetailPanel></div><DetailPanel title="Execution History"><ExecutionTimeline executions={executions.data ?? []} /></DetailPanel></div>;
}
