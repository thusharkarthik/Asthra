"use client";

import { FormEvent, TextareaHTMLAttributes, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateDialog } from "@/components/modules/create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DESK_CHANGE_STATUSES, DESK_PRIORITIES, DESK_RISK_LEVELS, DESK_TICKET_STATUSES } from "@/components/desk/desk-utils";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function DeskTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="min-h-24 w-full rounded-md border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />;
}

export function CreateTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("open");

  const createMutation = useMutation({
    mutationFn: () => deskApi.createTicket(accessToken ?? "", {
      workspace_id: selectedWorkspaceId ?? 0,
      project_id: selectedProjectId,
      title,
      description,
      priority,
      status,
      requester_id: currentUser?.id
    }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("open");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["desk", "tickets", selectedWorkspaceId] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create ticket" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Ticket title" placeholder="Ticket title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <DeskTextarea aria-label="Ticket description" placeholder="Describe the support request" value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select aria-label="Ticket priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
            {DESK_PRIORITIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Select aria-label="Ticket status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {DESK_TICKET_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
          </Select>
        </div>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !title.trim() || !description.trim()}>{createMutation.isPending ? "Creating..." : "Create ticket"}</Button>
      </form>
    </CreateDialog>
  );
}

export function CreateQueueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () => deskApi.createQueue(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, name, description: description || null }),
    onSuccess: () => {
      setName("");
      setDescription("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["desk", "queues", selectedWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["desk", "queues"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !name.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create queue" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Queue name" placeholder="Queue name" value={name} onChange={(event) => setName(event.target.value)} />
        <DeskTextarea aria-label="Queue description" placeholder="What team or work type does this queue handle?" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !name.trim()}>{createMutation.isPending ? "Creating..." : "Create queue"}</Button>
      </form>
    </CreateDialog>
  );
}

export function CreateSlaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [responseTime, setResponseTime] = useState("60");
  const [resolutionTime, setResolutionTime] = useState("1440");

  const createMutation = useMutation({
    mutationFn: () => deskApi.createSla(accessToken ?? "", {
      workspace_id: selectedWorkspaceId ?? 0,
      name,
      description: description || null,
      priority,
      response_time_minutes: Number(responseTime),
      resolution_time_minutes: Number(resolutionTime)
    }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setPriority("medium");
      setResponseTime("60");
      setResolutionTime("1440");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["desk", "slas", selectedWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["desk", "slas"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !name.trim() || Number(responseTime) < 1 || Number(resolutionTime) < 1) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Add SLA" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="SLA name" placeholder="SLA name" value={name} onChange={(event) => setName(event.target.value)} />
        <DeskTextarea aria-label="SLA description" placeholder="Describe this service target" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Select aria-label="SLA priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
          {DESK_PRIORITIES.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input aria-label="Target response minutes" type="number" min={1} placeholder="Response minutes" value={responseTime} onChange={(event) => setResponseTime(event.target.value)} />
          <Input aria-label="Target resolution minutes" type="number" min={1} placeholder="Resolution minutes" value={resolutionTime} onChange={(event) => setResolutionTime(event.target.value)} />
        </div>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !name.trim()}>{createMutation.isPending ? "Adding..." : "Add SLA"}</Button>
      </form>
    </CreateDialog>
  );
}

export function CreateChangeRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [status, setStatus] = useState("draft");

  const createMutation = useMutation({
    mutationFn: () => deskApi.createChangeRequest(accessToken ?? "", {
      workspace_id: selectedWorkspaceId ?? 0,
      title,
      description,
      risk_level: riskLevel,
      status,
      requested_by_id: currentUser?.id
    }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setRiskLevel("medium");
      setStatus("draft");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["desk", "change-requests", selectedWorkspaceId] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !title.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create change request" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Change request title" placeholder="Change request title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <DeskTextarea aria-label="Change request description" placeholder="Describe the operational change" value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select aria-label="Risk level" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
            {DESK_RISK_LEVELS.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Select aria-label="Change request status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {DESK_CHANGE_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
          </Select>
        </div>
        <Button disabled={createMutation.isPending || !selectedWorkspaceId || !title.trim() || !description.trim()}>{createMutation.isPending ? "Creating..." : "Create change request"}</Button>
      </form>
    </CreateDialog>
  );
}
