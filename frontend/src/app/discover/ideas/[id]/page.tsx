"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);

  const ideaQuery = useQuery({ queryKey: ["discover", "idea", id], queryFn: () => discoverApi.getIdea(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const mvpPlanQuery = useQuery({ queryKey: ["discover", "mvp-plan", id], queryFn: () => discoverApi.getMvpPlan(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: false });
  const analysisMutation = useMutation({ mutationFn: () => discoverApi.analyzeIdea(accessToken ?? "", id) });

  if (ideaQuery.isLoading) return <DetailPanel title="Idea"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!ideaQuery.data) return <DetailPanel title="Idea"><div className="text-sm text-destructive">Unable to load idea.</div></DetailPanel>;

  const idea = ideaQuery.data;

  return (
    <div className="space-y-4">
      <EntityDetailHeader
        title={idea.title}
        description={idea.description}
        meta={<><StatusBadge value={idea.status} /><span className="text-xs text-muted-foreground">Workspace {idea.workspace_id}</span></>}
        actions={<Button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>{analysisMutation.isPending ? "Analyzing..." : "AI idea analysis"}</Button>}
      />
      {analysisMutation.data ? (
        <DetailPanel title="AI Analysis">
          <div className="space-y-2 text-sm">
            <p>{analysisMutation.data.summary ?? analysisMutation.data.raw_response ?? "Analysis returned."}</p>
            {analysisMutation.data.mvp_suggestion ? <p><strong>MVP:</strong> {analysisMutation.data.mvp_suggestion}</p> : null}
            {analysisMutation.data.risks ? <p><strong>Risks:</strong> {analysisMutation.data.risks}</p> : null}
          </div>
        </DetailPanel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Impact Score">
          <div className="text-sm text-muted-foreground">Impact scoring placeholder. Backend score endpoint is ready for future UI controls.</div>
        </DetailPanel>
        <DetailPanel title="MVP Plan">
          {mvpPlanQuery.data ? (
            <div className="space-y-2 text-sm">
              <p>{mvpPlanQuery.data.scope}</p>
              {mvpPlanQuery.data.success_metrics ? <p><strong>Success:</strong> {mvpPlanQuery.data.success_metrics}</p> : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No MVP plan yet.</div>
          )}
        </DetailPanel>
      </div>
      <DetailPanel title="Roadmap Fit">
        <RoadmapStatusBadge value="planned" />
        <p className="mt-2 text-sm text-muted-foreground">Roadmap linkage is shown on the roadmap page.</p>
      </DetailPanel>
    </div>
  );
}
