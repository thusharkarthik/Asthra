"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["desk", "tickets", selectedWorkspaceId],
    queryFn: () => deskApi.listTickets(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const createMutation = useMutation({
    mutationFn: () =>
      deskApi.createTicket(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        project_id: selectedProjectId,
        title,
        description,
        status: "open",
        priority: "medium",
        requester_id: currentUser?.id
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["desk", "tickets", selectedWorkspaceId] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Tickets" description="Track service requests and support work." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage tickets" /> : (
        <div className="space-y-4">
          <div className="flex justify-end"><QuickCreateButton label="Create ticket" onClick={() => setOpen(true)} /></div>
          {ticketsQuery.isLoading ? <LoadingState /> : ticketsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load tickets.</div>
          ) : (ticketsQuery.data ?? []).length === 0 ? <EmptyState title="No tickets yet" /> : (
            <EntityTable columns={["Title", "Status", "Priority", "Assignee"]}>
              {(ticketsQuery.data ?? []).map((ticket) => (
                <EntityTableRow key={ticket.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/desk/tickets/${ticket.id}`}>{ticket.title}</Link>
                  <SLABadge value={ticket.status} />
                  <PriorityBadge value={ticket.priority} />
                  <span>{ticket.assignee_id ?? "Unassigned"}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create ticket" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Ticket title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Ticket description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim() || !description.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
