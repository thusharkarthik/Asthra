"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SimpleTimeline } from "@/components/modules/simple-timeline";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PulseBackLink, PulseBreadcrumbs } from "@/components/pulse/pulse-breadcrumbs";
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
import { pulseApi } from "@/services/api/pulse-api";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth-store";

export default function PulseIncidentDetailPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [updateContent, setUpdateContent] = useState("");
  const incidentQuery = useQuery({ queryKey: ["pulse", "incident", id], queryFn: () => pulseApi.getIncident(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const timelineQuery = useQuery({ queryKey: ["pulse", "timeline", id], queryFn: () => pulseApi.listTimeline(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const postmortemQuery = useQuery({ queryKey: ["pulse", "postmortem", id], queryFn: () => pulseApi.getPostmortem(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: false });
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof pulseApi.updateIncident>[2]) => pulseApi.updateIncident(accessToken ?? "", id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pulse", "incident", id] });
      await queryClient.invalidateQueries({ queryKey: ["pulse", "incidents"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pulse.dashboardSummary(incidentQuery.data?.workspace_id) });
    }
  });
  const timelineMutation = useMutation({
    mutationFn: () => pulseApi.createTimelineEvent(accessToken ?? "", id, { event_type: "update", content: updateContent, created_by_id: currentUser?.id }),
    onSuccess: () => {
      setUpdateContent("");
      queryClient.invalidateQueries({ queryKey: ["pulse", "timeline", id] });
    }
  });
  const handleTimelineSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updateContent.trim()) return;
    timelineMutation.mutate();
  };

  if (incidentQuery.isLoading) return <DetailPanel title="Incident"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!incidentQuery.data) return <DetailPanel title="Incident"><div className="text-sm text-destructive">Unable to load incident.</div></DetailPanel>;

  const incident = incidentQuery.data;

  return (
    <div className="space-y-4">
      <PulseBackLink href="/pulse/incidents" label="Back to Incidents" />
      <PulseBreadcrumbs items={[{ label: "Incidents", href: "/pulse/incidents" }, { label: incident.title }]} />
      <EntityDetailHeader
        title={incident.title}
        description={incident.description}
        meta={<><SeverityBadge value={incident.severity} /><SLABadge value={incident.status} /><span className="text-xs text-muted-foreground">Workspace {incident.workspace_id}</span></>}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => updateMutation.mutate({ status: "resolved", resolved_at: new Date().toISOString() })} disabled={updateMutation.isPending || incident.status === "resolved" || incident.status === "closed"}>Resolve Incident</Button>
            <Button variant="outline" onClick={() => updateMutation.mutate({ status: "closed" })} disabled={updateMutation.isPending || incident.status === "closed"}>Close Incident</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Overview">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Impacted service</dt><dd className="font-medium">{incident.impacted_service ?? "Service not set"}</dd></div>
            <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{incident.project_id ?? "Workspace-level"}</dd></div>
            <div><dt className="text-muted-foreground">Commander</dt><dd className="font-medium">{incident.incident_commander_id ?? incident.commander_id ? `User ${incident.incident_commander_id ?? incident.commander_id}` : "Unassigned"}</dd></div>
            <div><dt className="text-muted-foreground">Started</dt><dd className="font-medium">{incident.started_at ? new Date(incident.started_at).toLocaleString() : "Not tracked"}</dd></div>
          </dl>
        </DetailPanel>
        <DetailPanel title="Incident Controls">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <Select aria-label="Change incident status" value={incident.status} onChange={(event) => updateMutation.mutate({ status: event.target.value })}>
                {["open", "investigating", "mitigating", "monitoring", "resolved", "closed"].map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Severity</span>
              <Select aria-label="Change incident severity" value={incident.severity} onChange={(event) => updateMutation.mutate({ severity: event.target.value })}>
                {["sev1", "sev2", "sev3", "sev4"].map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Commander ID</span>
              <Input aria-label="Incident commander ID" defaultValue={incident.incident_commander_id ?? incident.commander_id ?? ""} onBlur={(event) => updateMutation.mutate({ incident_commander_id: event.target.value ? Number(event.target.value) : null, commander_id: event.target.value ? Number(event.target.value) : null })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Impacted service</span>
              <Input aria-label="Impacted service" defaultValue={incident.impacted_service ?? ""} onBlur={(event) => updateMutation.mutate({ impacted_service: event.target.value || null })} />
            </label>
          </div>
        </DetailPanel>
      </div>
      <DetailPanel title="Timeline">
        <SimpleTimeline items={(timelineQuery.data ?? []).map((event) => ({ id: event.id, title: event.event_type, content: event.content, timestamp: event.created_at }))} />
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleTimelineSubmit}>
          <Input aria-label="Incident update" placeholder="Add incident update" value={updateContent} onChange={(event) => setUpdateContent(event.target.value)} />
          <Button disabled={timelineMutation.isPending || !updateContent.trim()}>{timelineMutation.isPending ? "Adding..." : "Add Update"}</Button>
        </form>
      </DetailPanel>
      <LinkedResourcesPanel entityType="pulse_incident" entityId={incident.id} entityTitle={incident.title} />
      <DetailPanel title="Postmortem">
        {postmortemQuery.data ? (
          <div className="space-y-2 text-sm">
            <p>{postmortemQuery.data.summary}</p>
            {postmortemQuery.data.root_cause ? <p><strong>Root cause:</strong> {postmortemQuery.data.root_cause}</p> : null}
            {postmortemQuery.data.action_items ? <p><strong>Actions:</strong> {postmortemQuery.data.action_items}</p> : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No postmortem yet.</div>
        )}
      </DetailPanel>
    </div>
  );
}
