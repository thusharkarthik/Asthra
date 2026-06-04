"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateDialog } from "@/components/modules/create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS } from "@/components/flow/flow-utils";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

type WorkItemCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkItemCreateDialog({ open, onOpenChange }: WorkItemCreateDialogProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
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
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedProjectId) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create work item" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleCreate}>
        <Input aria-label="Work item title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input aria-label="Work item description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select aria-label="Work item status" value={statusId} onChange={(event) => setStatusId(event.target.value)}>
            {FLOW_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </Select>
          <Select aria-label="Work item priority" value={priorityId} onChange={(event) => setPriorityId(event.target.value)}>
            {FLOW_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </Select>
        </div>
        <Input
          aria-label="Assignee id"
          inputMode="numeric"
          placeholder="Assignee ID, optional"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
        />
        {createMutation.error ? <p className="text-sm text-destructive">Unable to create work item. Check required fields and try again.</p> : null}
        <Button disabled={createMutation.isPending || !title.trim() || !selectedProjectId}>
          {createMutation.isPending ? "Creating..." : "Create Work Item"}
        </Button>
      </form>
    </CreateDialog>
  );
}
