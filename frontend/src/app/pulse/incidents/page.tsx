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
import { Select } from "@/components/ui/select";
import { PulseBreadcrumbs } from "@/components/pulse/pulse-breadcrumbs";
import { pulseApi } from "@/services/api/pulse-api";
import { queryKeys } from "@/lib/queryKeys";
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
  const [severity, setSeverity] = useState("sev3");
  const [status, setStatus] = useState("open");
  const [impactedService, setImpactedService] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

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
        severity,
        status,
        impacted_service: impactedService || null,
        commander_id: currentUser?.id,
        incident_commander_id: currentUser?.id,
        created_by: currentUser?.id,
        started_at: new Date().toISOString()
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setSeverity("sev3");
      setStatus("open");
      setImpactedService("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pulse", "incidents", selectedWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.pulse.dashboardSummary(selectedWorkspaceId) });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  const incidents = (incidentsQuery.data ?? []).filter((incident) => {
    const text = `${incident.title} ${incident.description ?? ""} ${incident.impacted_service ?? ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || incident.status === statusFilter;
    const matchesSeverity = !severityFilter || incident.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <>
      <PageHeader title="Incidents" description="Manage reliability incidents and response lifecycle." />
      <PulseBreadcrumbs items={[{ label: "Incidents" }]} />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to manage incidents" /> : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[680px]">
              <Input aria-label="Search incidents" placeholder="Search incidents or services" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {["open", "investigating", "mitigating", "monitoring", "resolved", "closed"].map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
              </Select>
              <Select aria-label="Filter by severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                <option value="">All severities</option>
                {["sev1", "sev2", "sev3", "sev4"].map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
              </Select>
            </div>
            <QuickCreateButton label="Create incident" onClick={() => setOpen(true)} />
          </div>
          {incidentsQuery.isLoading ? <LoadingState /> : incidentsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load incidents.</div>
          ) : incidents.length === 0 ? <EmptyState title="No incidents match the current filters" /> : (
            <EntityTable columns={["Title", "Service", "Severity", "Status", "Commander"]}>
              {incidents.map((incident) => (
                <EntityTableRow key={incident.id} columns={5}>
                  <Link className="font-medium text-primary hover:underline" href={`/pulse/incidents/${incident.id}`}>{incident.title}</Link>
                  <span>{incident.impacted_service ?? "Service not set"}</span>
                  <SeverityBadge value={incident.severity} />
                  <SLABadge value={incident.status} />
                  <span>{incident.incident_commander_id ?? incident.commander_id ? `User ${incident.incident_commander_id ?? incident.commander_id}` : "Unassigned"}</span>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Select aria-label="Incident severity" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              {["sev1", "sev2", "sev3", "sev4"].map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </Select>
            <Select aria-label="Incident status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {["open", "investigating", "mitigating", "monitoring"].map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
            </Select>
          </div>
          <Input aria-label="Impacted service" placeholder="Impacted service" value={impactedService} onChange={(event) => setImpactedService(event.target.value)} />
          <Button disabled={createMutation.isPending || !title.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
