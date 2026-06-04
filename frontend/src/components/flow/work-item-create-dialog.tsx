"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityCreateDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS } from "@/components/flow/flow-utils";
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
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("1");
  const [priorityId, setPriorityId] = useState("2");
  const [assigneeId, setAssigneeId] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      flowApi.createWorkItem(accessToken ?? "", {
        project_id: selectedProjectId ?? 0,
        title,
        description,
        type_id: 1,
        status_id: Number(statusId),
        priority_id: Number(priorityId),
        assignee_id: assigneeId ? Number(assigneeId) : null,
        reporter_id: currentUser?.id ?? 1
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setStatusId("1");
      setPriorityId("2");
      setAssigneeId("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["flow"] });
      addToast({ type: "success", title: "Work item created", message: "Flow was updated with the new work item." });
    },
    onError: () => {
      addToast({ type: "error", title: "Work item was not created", message: "Check the required fields and try again." });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedProjectId) {
      addToast({ type: "error", title: "Missing required fields", message: "Select a project and enter a work item title." });
      return;
    }
    createMutation.mutate();
  };

  return (
    <EntityCreateDialog title="Create work item" open={open} onOpenChange={onOpenChange} onSubmit={handleCreate} error={createMutation.error ? "Unable to create work item. Check required fields and try again." : null}>
        <FormField label="Title" required error={!title.trim() ? "Required" : null}>
          <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <FormField label="Description">
          <Input aria-label="Work item description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Status">
            <Select aria-label="Work item status" value={statusId} onChange={(event) => setStatusId(event.target.value)}>
              {FLOW_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority">
            <Select aria-label="Work item priority" value={priorityId} onChange={(event) => setPriorityId(event.target.value)}>
              {FLOW_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Assignee ID" helpText="Optional numeric user ID for manual testing.">
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
