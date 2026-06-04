"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { SeverityBadge } from "@/components/modules/severity-badge";
import { SimpleTimeline } from "@/components/modules/simple-timeline";
import { SLABadge } from "@/components/modules/sla-badge";
import { Button } from "@/components/ui/button";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PulseIncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const incidentQuery = useQuery({ queryKey: ["pulse", "incident", id], queryFn: () => pulseApi.getIncident(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const timelineQuery = useQuery({ queryKey: ["pulse", "timeline", id], queryFn: () => pulseApi.listTimeline(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const postmortemQuery = useQuery({ queryKey: ["pulse", "postmortem", id], queryFn: () => pulseApi.getPostmortem(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: false });
  const summaryMutation = useMutation({ mutationFn: () => pulseApi.summarizeIncident(accessToken ?? "", id) });

  if (incidentQuery.isLoading) return <DetailPanel title="Incident"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!incidentQuery.data) return <DetailPanel title="Incident"><div className="text-sm text-destructive">Unable to load incident.</div></DetailPanel>;

  const incident = incidentQuery.data;

  return (
    <div className="space-y-4">
      <EntityDetailHeader
        title={incident.title}
        description={incident.description}
        meta={<><SeverityBadge value={incident.severity} /><SLABadge value={incident.status} /><span className="text-xs text-muted-foreground">Workspace {incident.workspace_id}</span></>}
        actions={<Button onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending}>{summaryMutation.isPending ? "Summarizing..." : "AI summary"}</Button>}
      />
      {summaryMutation.data ? (
        <DetailPanel title="AI Incident Summary">
          <div className="space-y-2 text-sm">
            <p>{summaryMutation.data.current_situation ?? summaryMutation.data.raw_response ?? "Summary returned."}</p>
            {summaryMutation.data.customer_facing_update_draft ? <p><strong>Customer update:</strong> {summaryMutation.data.customer_facing_update_draft}</p> : null}
          </div>
        </DetailPanel>
      ) : null}
      <DetailPanel title="Timeline">
        <SimpleTimeline items={(timelineQuery.data ?? []).map((event) => ({ id: event.id, title: event.event_type, content: event.content, timestamp: event.created_at }))} />
      </DetailPanel>
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
