"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { FlowMemberPicker } from "@/components/flow/member-picker";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/services/api/client";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CustomFieldDefinition, FlowItemLevel } from "@/types/flow";

type WorkItemCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItemLevel?: FlowItemLevel;
  lockItemLevel?: boolean;
  initialParentId?: number | null;
  contextLabel?: string;
};

export function WorkItemCreateDialog({ open, onOpenChange, initialItemLevel = "work_item", lockItemLevel = false, initialParentId = null, contextLabel }: WorkItemCreateDialogProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("blank");
  const [description, setDescription] = useState("");
  const [itemLevel, setItemLevel] = useState<FlowItemLevel>(initialItemLevel);
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
  const [parentId, setParentId] = useState(initialParentId ? String(initialParentId) : "");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSection, setActiveSection] = useState<"basics" | "planning" | "ownership" | "advanced" | "custom">("basics");
  const [customFieldDraft, setCustomFieldDraft] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setItemLevel(initialItemLevel);
    setParentId(initialParentId ? String(initialParentId) : "");
    if (initialItemLevel !== "work_item" || initialParentId) {
      setShowAdvanced(true);
    }
  }, [initialItemLevel, initialParentId, open]);

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
  const customFieldDefinitionsQuery = useQuery({
    queryKey: ["flow", "custom-fields", selectedProjectId],
    queryFn: () => flowApi.listCustomFieldDefinitions(accessToken ?? "", { project_id: selectedProjectId }),
    enabled: open && Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const customFieldDefinitions = customFieldDefinitionsQuery.data ?? [];
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
    onSuccess: async (createdWorkItem) => {
      try {
        for (const definition of customFieldDefinitions) {
          const value = customFieldDraft[definition.id] ?? "";
          if (value === "" && !definition.required) continue;
          await flowApi.saveCustomFieldValue(accessToken ?? "", createdWorkItem.id, {
            custom_field_id: definition.id,
            value: normalizeCustomFieldValue(definition, value)
          });
        }
      } catch (error) {
        addToast({
          type: "error",
          title: "Custom fields were not saved",
          message: error instanceof Error ? error.message : "The work item was created, but custom fields need to be saved from the detail page."
        });
      }
      setTitle("");
      setTemplate("blank");
      setDescription("");
      setItemLevel(initialItemLevel);
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
      setParentId(initialParentId ? String(initialParentId) : "");
      setShowAdvanced(false);
      setActiveSection("basics");
      setCustomFieldDraft({});
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
    const missingCustomField = customFieldDefinitions.find((definition) => definition.required && !(customFieldDraft[definition.id] ?? "").trim());
    if (missingCustomField) {
      const message = `${missingCustomField.name} is required.`;
      setActiveSection("custom");
      setShowAdvanced(true);
      setFormError(message);
      addToast({ type: "error", title: "Missing custom field", message });
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };
  const visibleSections: Array<{ id: typeof activeSection; label: string }> = [
    { id: "basics", label: "Basics" },
    { id: "planning", label: "Planning" },
    { id: "ownership", label: "Ownership" },
    { id: "advanced", label: "Advanced" },
    { id: "custom", label: "Custom Fields" }
  ];

  return (
    <EntityCreateDialog title="Create work item" open={open} onOpenChange={onOpenChange} onSubmit={handleCreate} error={formError}>
      <div className="sticky top-0 z-10 -mx-4 border-b bg-card px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${activeSection === section.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              onClick={() => {
                setActiveSection(section.id);
                if (section.id !== "basics") setShowAdvanced(true);
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
      {activeSection === "basics" ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Basics</h3>
        {contextLabel ? <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{contextLabel}</p> : null}
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
      ) : null}
        <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => {
          setShowAdvanced((value) => !value);
          if (!showAdvanced) setActiveSection("planning");
          if (showAdvanced) setActiveSection("basics");
        }}>
          {showAdvanced ? "Hide advanced fields" : "Show advanced fields"}
        </button>
        {showAdvanced && activeSection === "ownership" ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Ownership</h3>
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
          <FormField label="Assignee" helpText="Search order: project members, workspace members, then organization members. Detailed profiles appear when Core returns them.">
            <FlowMemberPicker label="Assignee" value={assigneeId} onChange={setAssigneeId} />
          </FormField>
          <FormField label="Due Date">
            <Input aria-label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </FormField>
        </div>
        </section>
        ) : null}
        {showAdvanced && activeSection === "planning" ? (
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
        ) : null}
        {showAdvanced && activeSection === "advanced" ? (
          <div className="space-y-5">
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
            <Select aria-label="Work level" value={itemLevel} disabled={lockItemLevel} onChange={(event) => setItemLevel(event.target.value as FlowItemLevel)}>
              {FLOW_ITEM_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {lockItemLevel ? <p className="mt-1 text-xs text-muted-foreground">This action preselects the hierarchy level intentionally.</p> : null}
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
        {showAdvanced && activeSection === "custom" ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Custom Fields</h3>
            {customFieldDefinitionsQuery.isLoading ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Loading custom fields...</p> : null}
            {!customFieldDefinitionsQuery.isLoading && customFieldDefinitions.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No project custom fields yet. Configure them from Flow Settings after setup.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {customFieldDefinitions.map((definition) => (
                  <FormField key={definition.id} label={definition.name} required={definition.required}>
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
