"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const incidentsQuery = useQuery({
    queryKey: ["pulse", "incidents", selectedWorkspaceId],
    queryFn: () => pulseApi.listIncidents(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const createMutation = useMutation({
    mutationFn: () =>
      pulseApi.createIncident(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        title,
        description,
        severity: "medium",
        status: "investigating",
        commander_id: currentUser?.id
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pulse", "incidents", selectedWorkspaceId] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Incidents" description="Manage reliability incidents and response lifecycle." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage incidents" /> : (
        <div className="space-y-4">
          <div className="flex justify-end"><QuickCreateButton label="Create incident" onClick={() => setOpen(true)} /></div>
          {incidentsQuery.isLoading ? <LoadingState /> : incidentsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load incidents.</div>
          ) : (incidentsQuery.data ?? []).length === 0 ? <EmptyState title="No incidents yet" /> : (
            <EntityTable columns={["Title", "Severity", "Status", "Commander"]}>
              {(incidentsQuery.data ?? []).map((incident) => (
                <EntityTableRow key={incident.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/pulse/incidents/${incident.id}`}>{incident.title}</Link>
                  <SeverityBadge value={incident.severity} />
                  <SLABadge value={incident.status} />
                  <span>{incident.commander_id ?? "Unassigned"}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create incident" open={open} onOpenChange={setOpen}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <Input aria-label="Incident title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input aria-label="Incident description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
