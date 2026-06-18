"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FLOW_BUSINESS_VALUE_OPTIONS,
  FLOW_COMPLEXITY_OPTIONS,
  FLOW_EFFORT_SIZE_OPTIONS,
  FLOW_ITEM_LEVEL_OPTIONS,
  FLOW_PRIORITY_OPTIONS,
  FLOW_RISK_OPTIONS,
  FLOW_STATUS_OPTIONS,
  FLOW_WORK_ITEM_TEMPLATES
} from "@/components/flow/flow-utils";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/services/api/client";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { FlowItemLevel } from "@/types/flow";

type WorkItemCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkItemCreateDialog({ open, onOpenChange }: WorkItemCreateDialogProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("blank");
  const [description, setDescription] = useState("");
  const [itemLevel, setItemLevel] = useState<FlowItemLevel>("work_item");
  const [statusName, setStatusName] = useState("");
  const [priorityName, setPriorityName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [effortSize, setEffortSize] = useState("");
  const [effortScore, setEffortScore] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [complexity, setComplexity] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [parentId, setParentId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parentOptions = useQuery({
    queryKey: ["flow", "create-parent-work", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const statusOptions = workflowQuery.data?.statuses?.length
    ? workflowQuery.data.statuses.map((status) => ({ value: status.key, label: status.name }))
    : FLOW_STATUS_OPTIONS.map((status) => ({ value: status.name, label: status.label }));

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        project_id: selectedProjectId ?? 0,
        title: title.trim(),
        item_level: itemLevel,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(statusName ? { status_name: statusName } : {}),
        ...(priorityName ? { priority_name: priorityName } : {}),
        ...(assigneeId.trim() ? { assignee_id: Number(assigneeId) } : {}),
        ...(dueDate ? { due_date: `${dueDate}T00:00:00Z` } : {}),
        ...(effortSize ? { effort_size: effortSize } : {}),
        ...(effortScore.trim() ? { effort_score: Number(effortScore) } : {}),
        ...(businessValue ? { business_value: businessValue } : {}),
        ...(riskLevel ? { risk_level: riskLevel } : {}),
        ...(complexity ? { complexity } : {}),
        ...(acceptanceCriteria.trim() ? { acceptance_criteria: acceptanceCriteria.trim() } : {}),
        ...(definitionOfDone.trim() ? { definition_of_done: definitionOfDone.trim() } : {}),
        ...(parentId ? { parent_id: Number(parentId) } : {})
      };
      return flowApi.createWorkItem(accessToken ?? "", payload);
    },
    onSuccess: () => {
      setTitle("");
      setTemplate("blank");
      setDescription("");
      setItemLevel("work_item");
      setStatusName("");
      setPriorityName("");
      setAssigneeId("");
      setDueDate("");
      setEffortSize("");
      setEffortScore("");
      setBusinessValue("");
      setRiskLevel("");
      setComplexity("");
      setAcceptanceCriteria("");
      setDefinitionOfDone("");
      setParentId("");
      setShowAdvanced(false);
      setFormError(null);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["flow"] });
      addToast({ type: "success", title: "Work item created", message: "Flow was updated with the new work item." });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Check the required fields and try again.";
      setFormError(message);
      addToast({ type: "error", title: "Work item was not created", message });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedProjectId) {
      const message = !selectedProjectId ? "Select a project before creating a work item." : "Enter a work item title.";
      setFormError(message);
      addToast({ type: "error", title: "Missing required fields", message });
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <EntityCreateDialog title="Create work item" open={open} onOpenChange={onOpenChange} onSubmit={handleCreate} error={formError}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Basics</h3>
        <FormField label="Title" required error={!title.trim() ? "Required" : null}>
          <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <FormField label="Template">
          <Select
            aria-label="Work item template"
            value={template}
            onChange={(event) => {
              const selectedTemplate = FLOW_WORK_ITEM_TEMPLATES.find((option) => option.value === event.target.value) ?? FLOW_WORK_ITEM_TEMPLATES[0];
              setTemplate(selectedTemplate.value);
              setDescription(selectedTemplate.description);
              setAcceptanceCriteria(selectedTemplate.acceptanceCriteria);
              setDefinitionOfDone(selectedTemplate.definitionOfDone);
            }}
          >
            {FLOW_WORK_ITEM_TEMPLATES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </FormField>
        <FormField label="Description">
          <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Work item description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        </section>
        <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setShowAdvanced((value) => !value)}>
          {showAdvanced ? "Hide advanced fields" : "Show advanced fields"}
        </button>
        {showAdvanced ? (
          <div className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Execution</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Status">
            <Select aria-label="Work item status" value={statusName} onChange={(event) => setStatusName(event.target.value)}>
              <option value="">Default Todo</option>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Priority">
            <Select aria-label="Work item priority" value={priorityName} onChange={(event) => setPriorityName(event.target.value)}>
              <option value="">Default Medium</option>
              {FLOW_PRIORITY_OPTIONS.map((priority) => <option key={priority.name} value={priority.name}>{priority.label}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Assignee ID optional" helpText="Member lookup is pending for Flow.">
            <Input aria-label="Assignee id" inputMode="numeric" placeholder="Assignee ID, optional" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} />
          </FormField>
          <FormField label="Due Date">
            <Input aria-label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </FormField>
        </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Planning</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Effort Size">
              <Select aria-label="Effort size" value={effortSize} onChange={(event) => setEffortSize(event.target.value)}>
                <option value="">Not set</option>
                {FLOW_EFFORT_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </FormField>
            <FormField label="Effort Score">
              <Input aria-label="Effort score" inputMode="numeric" placeholder="Positive number" value={effortScore} onChange={(event) => setEffortScore(event.target.value)} />
            </FormField>
            <FormField label="Business Value">
              <Select aria-label="Business value" value={businessValue} onChange={(event) => setBusinessValue(event.target.value)}>
                <option value="">Not set</option>
                {FLOW_BUSINESS_VALUE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </FormField>
            <FormField label="Risk Level">
              <Select aria-label="Risk level" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
                <option value="">Not set</option>
                {FLOW_RISK_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </FormField>
            <FormField label="Complexity">
              <Select aria-label="Complexity" value={complexity} onChange={(event) => setComplexity(event.target.value)}>
                <option value="">Not set</option>
                {FLOW_COMPLEXITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </FormField>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Acceptance</h3>
          <FormField label="Acceptance Criteria">
            <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Acceptance criteria" placeholder="What must be true for this work to be accepted?" value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} />
          </FormField>
          <FormField label="Completion Checklist">
            <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Completion checklist" placeholder="Definition of done or checklist notes" value={definitionOfDone} onChange={(event) => setDefinitionOfDone(event.target.value)} />
          </FormField>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Relationships</h3>
          <FormField label="Work Level">
            <Select aria-label="Work level" value={itemLevel} onChange={(event) => setItemLevel(event.target.value as FlowItemLevel)}>
              {FLOW_ITEM_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Parent Work">
            <Select aria-label="Parent work" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">{itemLevel === "initiative" ? "Initiatives do not use parent work" : "No parent work"}</option>
              {(parentOptions.data ?? [])
                .filter((item) => isValidParentOption(item.item_level ?? "work_item", itemLevel))
                .map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">Features can sit under initiatives. Work items can sit under features or initiatives. Subtasks must sit under work items.</p>
          </FormField>
        </section>
          </div>
        ) : null}
        <FormActions submitLabel="Create Work Item" loadingLabel="Creating..." isSubmitting={createMutation.isPending} disabled={!title.trim() || !selectedProjectId} onCancel={() => onOpenChange(false)} />
    </EntityCreateDialog>
  );
}

function isValidParentOption(parentLevel: string, childLevel: FlowItemLevel) {
  if (childLevel === "initiative") return false;
  if (childLevel === "feature") return parentLevel === "initiative";
  if (childLevel === "work_item") return parentLevel === "initiative" || parentLevel === "feature";
  if (childLevel === "subtask") return parentLevel === "work_item";
  return false;
}
