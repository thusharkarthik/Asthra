"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/services/api/client";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

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
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        project_id: selectedProjectId ?? 0,
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(assigneeId.trim() ? { assignee_id: Number(assigneeId) } : {})
      };
      return flowApi.createWorkItem(accessToken ?? "", payload);
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setAssigneeId("");
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
        <FormField label="Title" required error={!title.trim() ? "Required" : null}>
          <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <FormField label="Description">
          <Input aria-label="Work item description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Status" helpText="Default applied by Flow service.">
            <Input aria-label="Work item status" value="Todo" readOnly />
          </FormField>
          <FormField label="Priority" helpText="Default applied by Flow service.">
            <Input aria-label="Work item priority" value="Medium" readOnly />
          </FormField>
        </div>
        <FormField label="Assignee ID optional" helpText="Leave empty to create an unassigned work item. Member lookup is pending for Flow.">
          <Input
            aria-label="Assignee id"
            inputMode="numeric"
            placeholder="Assignee ID, optional"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
          />
        </FormField>
        <FormActions submitLabel="Create Work Item" loadingLabel="Creating..." isSubmitting={createMutation.isPending} disabled={!title.trim() || !selectedProjectId} onCancel={() => onOpenChange(false)} />
    </EntityCreateDialog>
  );
}
