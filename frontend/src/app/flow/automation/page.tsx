"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Trash2 } from "lucide-react";
import { FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState, ErrorState, PageLoading } from "@/components/layout/ui-states";
import { DetailPanel } from "@/components/modules/detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { FlowAutomationAction, FlowAutomationRule, FlowAutomationTrigger } from "@/types/flow";

const TRIGGERS: FlowAutomationTrigger[] = ["work_item_created", "status_changed", "priority_changed", "assignee_changed", "comment_added"];
const CONDITIONS = ["none", "assignee_exists", "risk_level_equals", "effort_size_equals", "status_equals", "priority_equals"] as const;
const ACTIONS: FlowAutomationAction[] = ["create_notification", "add_comment", "update_priority", "update_status", "assign_user"];

export default function FlowAutomationPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<FlowAutomationTrigger>("status_changed");
  const [conditionType, setConditionType] = useState<(typeof CONDITIONS)[number]>("none");
  const [conditionValue, setConditionValue] = useState("");
  const [actionType, setActionType] = useState<FlowAutomationAction>("create_notification");
  const [actionValue, setActionValue] = useState("");
  const [testingRuleId, setTestingRuleId] = useState<number | null>(null);

  const rulesQuery = useQuery({
    queryKey: ["flow", "automation-rules", selectedProjectId],
    queryFn: () => flowApi.listAutomationRules(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const rules = rulesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => flowApi.createAutomationRule(accessToken ?? "", {
      workspace_id: selectedWorkspaceId,
      project_id: selectedProjectId ?? 0,
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: triggerType,
      condition_config: buildConditionConfig(conditionType, conditionValue),
      action_config: buildActionConfig(actionType, actionValue),
      is_active: true
    }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setConditionValue("");
      setActionValue("");
      addToast({ type: "success", title: "Automation rule created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "automation-rules"] });
    },
    onError: (error) => addToast({ type: "error", title: "Automation rule create failed", message: error instanceof Error ? error.message : "Unable to create rule." })
  });

  const updateMutation = useMutation({
    mutationFn: ({ rule, isActive }: { rule: FlowAutomationRule; isActive: boolean }) => flowApi.updateAutomationRule(accessToken ?? "", rule.id, { is_active: isActive }),
    onSuccess: () => {
      addToast({ type: "success", title: "Automation rule updated" });
      queryClient.invalidateQueries({ queryKey: ["flow", "automation-rules"] });
    },
    onError: (error) => addToast({ type: "error", title: "Automation update failed", message: error instanceof Error ? error.message : "Unable to update rule." })
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: number) => flowApi.deleteAutomationRule(accessToken ?? "", ruleId),
    onSuccess: () => {
      addToast({ type: "success", title: "Automation rule deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "automation-rules"] });
    },
    onError: (error) => addToast({ type: "error", title: "Automation delete failed", message: error instanceof Error ? error.message : "Unable to delete rule." })
  });

  const testMutation = useMutation({
    mutationFn: (ruleId: number) => flowApi.testAutomationRule(accessToken ?? "", ruleId),
    onMutate: (ruleId) => setTestingRuleId(ruleId),
    onSuccess: (result) => addToast({ type: result.executed ? "success" : "info", title: "Automation test complete", message: result.message }),
    onError: (error) => addToast({ type: "error", title: "Automation test failed", message: error instanceof Error ? error.message : "Unable to test rule." }),
    onSettled: () => setTestingRuleId(null)
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() && selectedProjectId) createMutation.mutate();
  };

  if (!selectedProjectId) {
    return (
      <>
        <PageHeader title="Flow Automation" description="Create simple Flow rules for project work." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Automation" }]} />} />
        <FlowSubnav />
        <EmptyModuleState title="Select a project" description="Automation rules are scoped to the selected project." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Flow Automation" description="Run simple project rules when work items, comments, status, priority, or assignee fields change." breadcrumbs={<FlowBreadcrumbs items={[{ label: "Automation" }]} />} />
      <FlowSubnav />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DetailPanel title="Automation Rules">
          {rulesQuery.isLoading ? <PageLoading label="Loading automation rules..." /> : null}
          {rulesQuery.isError ? <ErrorState title="Automation rules failed to load" description="Check flow-service and retry." onRetry={() => rulesQuery.refetch()} /> : null}
          {!rulesQuery.isLoading && !rulesQuery.isError && rules.length === 0 ? (
            <EmptyModuleState title="No automation rules yet" description="Create a rule to notify, comment, assign, or update fields when Flow events happen." />
          ) : null}
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${rule.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{rule.is_active ? "Active" : "Disabled"}</span>
                    </div>
                    {rule.description ? <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Trigger: {rule.trigger_type.replaceAll("_", " ")}</span>
                      <span>Action: {String(rule.action_config?.type ?? "not configured").replaceAll("_", " ")}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ rule, isActive: !rule.is_active })}>{rule.is_active ? "Disable" : "Enable"}</Button>
                    <Button size="sm" variant="outline" disabled={testingRuleId === rule.id} onClick={() => testMutation.mutate(rule.id)}><Play className="mr-2 h-4 w-4" />Test</Button>
                    <Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Delete rule "${rule.name}"?`)) deleteMutation.mutate(rule.id); }}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DetailPanel>
        <DetailPanel title="Create Rule">
          <form className="space-y-3" onSubmit={handleCreate}>
            <Input aria-label="Rule name" placeholder="Rule name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input aria-label="Rule description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
            <Select aria-label="Rule trigger" value={triggerType} onChange={(event) => setTriggerType(event.target.value as FlowAutomationTrigger)}>
              {TRIGGERS.map((trigger) => <option key={trigger} value={trigger}>{trigger.replaceAll("_", " ")}</option>)}
            </Select>
            <Select aria-label="Rule condition" value={conditionType} onChange={(event) => setConditionType(event.target.value as (typeof CONDITIONS)[number])}>
              {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition.replaceAll("_", " ")}</option>)}
            </Select>
            {conditionType !== "none" && conditionType !== "assignee_exists" ? <Input aria-label="Condition value" placeholder="Condition value" value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} /> : null}
            <Select aria-label="Rule action" value={actionType} onChange={(event) => setActionType(event.target.value as FlowAutomationAction)}>
              {ACTIONS.map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}
            </Select>
            <Input aria-label="Action value" placeholder={actionValuePlaceholder(actionType)} value={actionValue} onChange={(event) => setActionValue(event.target.value)} />
            <Button className="w-full" disabled={!name.trim() || createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Rule"}</Button>
          </form>
        </DetailPanel>
      </div>
    </>
  );
}

function buildConditionConfig(type: (typeof CONDITIONS)[number], value: string) {
  if (type === "none") return null;
  if (type === "assignee_exists") return { type };
  if (type === "risk_level_equals") return { type, risk_level: value.trim() };
  if (type === "effort_size_equals") return { type, effort_size: value.trim().toUpperCase() };
  if (type === "status_equals") return { type, status: value.trim() };
  if (type === "priority_equals") return { type, priority: value.trim() };
  return null;
}

function buildActionConfig(type: FlowAutomationAction, value: string) {
  if (type === "create_notification") return { type, title: value.trim() || "Flow automation", message: value.trim() || "A Flow automation rule ran." };
  if (type === "add_comment") return { type, body: value.trim() || "Automation rule ran." };
  if (type === "update_priority") return { type, priority: value.trim() || "medium" };
  if (type === "update_status") return { type, status: value.trim() || "todo" };
  if (type === "assign_user") return { type, assignee_id: Number(value) || null };
  return { type };
}

function actionValuePlaceholder(type: FlowAutomationAction) {
  if (type === "create_notification") return "Notification title/message";
  if (type === "add_comment") return "Comment body";
  if (type === "update_priority") return "Priority name, e.g. high";
  if (type === "update_status") return "Status name, e.g. in_progress";
  return "Assignee user ID";
}
