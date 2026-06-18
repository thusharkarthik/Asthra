"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FLOW_BUSINESS_VALUE_OPTIONS,
  FLOW_COMPLEXITY_OPTIONS,
  FLOW_EFFORT_SIZE_OPTIONS,
  FLOW_ITEM_LEVEL_OPTIONS,
  FLOW_PRIORITY_OPTIONS,
  FLOW_RELATION_TYPE_OPTIONS,
  FLOW_RISK_OPTIONS,
  FLOW_WORK_ITEM_TEMPLATES
} from "@/components/flow/flow-utils";
import { FlowMemberPicker } from "@/components/flow/member-picker";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/services/api/client";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CustomFieldDefinition, FlowItemLevel, WorkItemRelationType } from "@/types/flow";

type WorkItemCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItemLevel?: FlowItemLevel;
  lockItemLevel?: boolean;
  initialParentId?: number | null;
  contextLabel?: string;
};

type CreateTab = "basics" | "planning" | "ownership" | "advanced" | "custom";

export function WorkItemCreateDialog({ open, onOpenChange, initialItemLevel = "work_item", lockItemLevel = false, initialParentId = null, contextLabel }: WorkItemCreateDialogProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [activeTab, setActiveTab] = useState<CreateTab>("basics");
  const [title, setTitle] = useState("");
  const [itemLevel, setItemLevel] = useState<FlowItemLevel>(initialItemLevel);
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("blank");
  const [priorityName, setPriorityName] = useState("");
  const [effortSize, setEffortSize] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [complexity, setComplexity] = useState("");
  const [effortScore, setEffortScore] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [releaseId, setReleaseId] = useState("");
  const [parentId, setParentId] = useState(initialParentId ? String(initialParentId) : "");
  const [dependencyTargetId, setDependencyTargetId] = useState("");
  const [dependencyType, setDependencyType] = useState<WorkItemRelationType>("blocks");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [customFieldDraft, setCustomFieldDraft] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveTab("basics");
    setItemLevel(initialItemLevel);
    setParentId(initialParentId ? String(initialParentId) : "");
  }, [initialItemLevel, initialParentId, open]);

  const workItemsQuery = useQuery({
    queryKey: ["flow", "create-parent-work", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const sprintsQuery = useQuery({
    queryKey: ["flow", "sprints", selectedProjectId],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const releasesQuery = useQuery({
    queryKey: ["flow", "releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const labelsQuery = useQuery({
    queryKey: ["flow", "labels", selectedProjectId],
    queryFn: () => flowApi.listLabels(accessToken ?? "", { project_id: selectedProjectId }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const customFieldDefinitionsQuery = useQuery({
    queryKey: ["flow", "custom-fields", selectedProjectId],
    queryFn: () => flowApi.listCustomFieldDefinitions(accessToken ?? "", { project_id: selectedProjectId }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const customFieldDefinitions = customFieldDefinitionsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const createdWorkItem = await flowApi.createWorkItem(accessToken ?? "", {
        project_id: selectedProjectId ?? 0,
        title: title.trim(),
        item_level: itemLevel,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(priorityName ? { priority_name: priorityName } : {}),
        ...(assigneeId ? { assignee_id: Number(assigneeId) } : {}),
        ...(reporterId ? { reporter_id: Number(reporterId) } : {}),
        ...(sprintId ? { sprint_id: Number(sprintId) } : {}),
        ...(releaseId ? { release_id: Number(releaseId) } : {}),
        ...(dueDate ? { due_date: `${dueDate}T00:00:00Z` } : {}),
        ...(effortSize ? { effort_size: effortSize } : {}),
        ...(effortScore.trim() ? { effort_score: Number(effortScore) } : {}),
        ...(businessValue ? { business_value: businessValue } : {}),
        ...(riskLevel ? { risk_level: riskLevel } : {}),
        ...(complexity ? { complexity } : {}),
        ...(acceptanceCriteria.trim() ? { acceptance_criteria: acceptanceCriteria.trim() } : {}),
        ...(definitionOfDone.trim() ? { definition_of_done: definitionOfDone.trim() } : {}),
        ...(parentId ? { parent_id: Number(parentId) } : {})
      });
      if (dependencyTargetId) {
        await flowApi.createRelation(accessToken ?? "", createdWorkItem.id, {
          target_work_item_id: Number(dependencyTargetId),
          relation_type: dependencyType
        });
      }
      for (const labelId of labelIds) {
        await flowApi.addLabelToWorkItem(accessToken ?? "", createdWorkItem.id, Number(labelId));
      }
      for (const definition of customFieldDefinitions) {
        const value = customFieldDraft[definition.id] ?? "";
        if (value === "" && !definition.required) continue;
        await flowApi.saveCustomFieldValue(accessToken ?? "", createdWorkItem.id, {
          custom_field_id: definition.id,
          value: normalizeCustomFieldValue(definition, value)
        });
      }
      return createdWorkItem;
    },
    onSuccess: () => {
      resetForm();
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
    const errors: Record<string, string> = {};
    if (!selectedProjectId) errors.project = "Select a project before creating a work item.";
    if (!title.trim()) errors.title = "Title is required.";
    if (effortScore && Number(effortScore) <= 0) errors.effortScore = "Effort score must be positive.";
    for (const definition of customFieldDefinitions) {
      if (definition.required && !(customFieldDraft[definition.id] ?? "").trim()) {
        errors[`custom-${definition.id}`] = `${definition.name} is required.`;
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      if (errors.title || errors.project) setActiveTab("basics");
      else if (errors.effortScore) setActiveTab("planning");
      else setActiveTab("custom");
      setFormError(Object.values(errors)[0]);
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  const tabs: Array<{ id: CreateTab; label: string }> = [
    { id: "basics", label: "Basics" },
    { id: "planning", label: "Planning" },
    { id: "ownership", label: "Ownership" },
    { id: "advanced", label: "Advanced" },
    { id: "custom", label: "Custom Fields" }
  ];

  return (
    <EntityCreateDialog title="Create work item" open={open} onOpenChange={onOpenChange} onSubmit={handleCreate} error={formError} size="wide">
      <div className="sticky top-0 z-10 -mx-4 border-b bg-card px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {contextLabel ? <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{contextLabel}</p> : null}

      {activeTab === "basics" ? (
        <section className="space-y-4">
          <FormField label="Title" required error={fieldErrors.title}>
            <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </FormField>
          <FormField label="Type" helpText={lockItemLevel ? "This action preselects the hierarchy type intentionally." : undefined}>
            <Select aria-label="Work item type" value={itemLevel} disabled={lockItemLevel} onChange={(event) => setItemLevel(event.target.value as FlowItemLevel)}>
              {FLOW_ITEM_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Description">
            <textarea className="min-h-40 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Work item description" placeholder="Describe the work" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormField>
        </section>
      ) : null}

      {activeTab === "planning" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <FormField label="Priority">
            <Select aria-label="Work item priority" value={priorityName} onChange={(event) => setPriorityName(event.target.value)}>
              <option value="">Default Medium</option>
              {FLOW_PRIORITY_OPTIONS.map((priority) => <option key={priority.name} value={priority.name}>{priority.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Effort Size">
            <Select aria-label="Effort size" value={effortSize} onChange={(event) => setEffortSize(event.target.value)}>
              <option value="">Not set</option>
              {FLOW_EFFORT_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
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
          <FormField label="Effort Score" error={fieldErrors.effortScore}>
            <Input aria-label="Effort score" inputMode="numeric" placeholder="Positive number" value={effortScore} onChange={(event) => setEffortScore(event.target.value)} />
          </FormField>
          <FormField label="Due Date">
            <Input aria-label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </FormField>
        </section>
      ) : null}

      {activeTab === "ownership" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <FormField label="Assignee">
            <FlowMemberPicker label="Assignee" value={assigneeId} onChange={setAssigneeId} />
          </FormField>
          <FormField label="Reporter">
            <FlowMemberPicker label="Reporter" value={reporterId} onChange={setReporterId} />
          </FormField>
          <FormField label="Sprint">
            <Select aria-label="Sprint assignment" value={sprintId} onChange={(event) => setSprintId(event.target.value)}>
              <option value="">Backlog</option>
              {(sprintsQuery.data ?? []).filter((sprint) => sprint.status !== "completed" && sprint.status !== "cancelled").map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Release">
            <Select aria-label="Release assignment" value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>
              <option value="">No release</option>
              {(releasesQuery.data ?? []).map((release) => <option key={release.id} value={release.id}>{release.name} · {release.version}</option>)}
            </Select>
          </FormField>
        </section>
      ) : null}

      {activeTab === "advanced" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <FormField label="Parent Work">
            <Select aria-label="Parent work" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">{itemLevel === "initiative" ? "Initiatives do not use parent work" : "No parent work"}</option>
              {(workItemsQuery.data ?? [])
                .filter((item) => isValidParentOption(item.item_level ?? "work_item", itemLevel))
                .map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </Select>
          </FormField>
          <FormField label="Dependencies">
            <div className="grid gap-2">
              <Select aria-label="Dependency target" value={dependencyTargetId} onChange={(event) => setDependencyTargetId(event.target.value)}>
                <option value="">No dependency</option>
                {(workItemsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
              <Select aria-label="Dependency type" value={dependencyType} disabled={!dependencyTargetId} onChange={(event) => setDependencyType(event.target.value as WorkItemRelationType)}>
                {FLOW_RELATION_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
          </FormField>
          <FormField label="Labels">
            <select
              aria-label="Labels"
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
              multiple
              value={labelIds}
              onChange={(event) => setLabelIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
            >
              {(labelsQuery.data ?? []).map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
            </select>
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
          <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
            <FormField label="Acceptance Criteria">
              <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Acceptance criteria" value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} />
            </FormField>
            <FormField label="Completion Checklist">
              <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" aria-label="Completion checklist" value={definitionOfDone} onChange={(event) => setDefinitionOfDone(event.target.value)} />
            </FormField>
          </div>
        </section>
      ) : null}

      {activeTab === "custom" ? (
        <section className="space-y-3">
          {customFieldDefinitionsQuery.isLoading ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Loading custom fields...</p> : null}
          {!customFieldDefinitionsQuery.isLoading && customFieldDefinitions.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No custom fields configured.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {customFieldDefinitions.map((definition) => (
                <FormField key={definition.id} label={definition.name} required={definition.required} error={fieldErrors[`custom-${definition.id}`]}>
                  <CustomFieldInput
                    definition={definition}
                    value={customFieldDraft[definition.id] ?? ""}
                    onChange={(value) => setCustomFieldDraft((current) => ({ ...current, [definition.id]: value }))}
                  />
                </FormField>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <FormActions submitLabel="Create Work Item" loadingLabel="Creating..." isSubmitting={createMutation.isPending} disabled={!title.trim() || !selectedProjectId} onCancel={() => onOpenChange(false)} />
    </EntityCreateDialog>
  );

  function resetForm() {
    setTitle("");
    setItemLevel(initialItemLevel);
    setDescription("");
    setTemplate("blank");
    setPriorityName("");
    setEffortSize("");
    setBusinessValue("");
    setRiskLevel("");
    setComplexity("");
    setEffortScore("");
    setDueDate("");
    setAssigneeId("");
    setReporterId("");
    setSprintId("");
    setReleaseId("");
    setParentId(initialParentId ? String(initialParentId) : "");
    setDependencyTargetId("");
    setDependencyType("blocks");
    setLabelIds([]);
    setAcceptanceCriteria("");
    setDefinitionOfDone("");
    setCustomFieldDraft({});
    setFieldErrors({});
    setFormError(null);
    setActiveTab("basics");
  }
}

function isValidParentOption(parentLevel: string, childLevel: FlowItemLevel) {
  if (childLevel === "initiative") return false;
  if (childLevel === "feature") return parentLevel === "initiative";
  if (childLevel === "work_item") return parentLevel === "initiative" || parentLevel === "feature";
  if (childLevel === "subtask") return parentLevel === "work_item";
  return false;
}

function CustomFieldInput({ definition, value, onChange }: { definition: CustomFieldDefinition; value: string; onChange: (value: string) => void }) {
  if (definition.field_type === "select") {
    return (
      <Select value={value} required={definition.required} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {(definition.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    );
  }
  if (definition.field_type === "checkbox") {
    return (
      <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <input type="checkbox" checked={value === "true"} onChange={(event) => onChange(event.target.checked ? "true" : "false")} />
        <span>{value === "true" ? "Checked" : "Unchecked"}</span>
      </label>
    );
  }
  return (
    <Input
      type={definition.field_type === "number" ? "number" : definition.field_type === "date" ? "date" : "text"}
      value={value}
      required={definition.required}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function normalizeCustomFieldValue(definition: CustomFieldDefinition, value: string) {
  if (definition.field_type === "checkbox") return value === "true";
  if (definition.field_type === "number" && value !== "") return Number(value);
  return value || null;
}
