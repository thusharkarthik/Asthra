"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { discoverDate, isHighImpactIdea, needsValidation } from "@/components/discover/discover-utils";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);

  const ideaQuery = useQuery({ queryKey: ["discover", "idea", id], queryFn: () => discoverApi.getIdea(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const mvpPlanQuery = useQuery({ queryKey: ["discover", "mvp-plan", id], queryFn: () => discoverApi.getMvpPlan(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: false });
  const roadmapQuery = useQuery({
    queryKey: ["discover", "roadmap", selectedWorkspaceId],
    queryFn: () => discoverApi.listRoadmapItems(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const feedbackQuery = useQuery({
    queryKey: ["discover", "feedback", selectedWorkspaceId],
    queryFn: () => discoverApi.listFeedback(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const analysisMutation = useMutation({ mutationFn: () => discoverApi.analyzeIdea(accessToken ?? "", id) });

  if (ideaQuery.isLoading) return <DetailPanel title="Idea"><div className="text-sm text-muted-foreground">Loading idea...</div></DetailPanel>;
  if (!ideaQuery.data) return <DetailPanel title="Idea"><div className="text-sm text-destructive">Unable to load idea.</div></DetailPanel>;

  const idea = ideaQuery.data;
  const relatedRoadmap = (roadmapQuery.data ?? []).filter((item) => item.idea_id === idea.id);
  const relatedFeedback = (feedbackQuery.data ?? []).filter((feedback) => feedback.idea_id === idea.id);

  return (
    <div className="space-y-4">
      <DiscoverSubnav />
      <EntityDetailHeader
        title={idea.title}
        description={idea.description}
        meta={<><StatusBadge value={idea.status} /><span className="text-xs text-muted-foreground">Updated {discoverDate(idea.updated_at ?? idea.created_at)}</span></>}
        actions={<Button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>{analysisMutation.isPending ? "Analyzing..." : "AI analyze idea"}</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Overview">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Workspace</dt><dd className="font-medium">{idea.workspace_id}</dd></div>
            <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{idea.project_id ?? "Workspace-level"}</dd></div>
            <div><dt className="text-muted-foreground">Created by</dt><dd className="font-medium">{idea.created_by_id}</dd></div>
            <div><dt className="text-muted-foreground">Validation state</dt><dd className="font-medium">{needsValidation(idea) ? "Needs validation" : "Validation in progress"}</dd></div>
          </dl>
        </DetailPanel>
        <DetailPanel title="Impact Score">
          <div className="space-y-2 text-sm">
            <div className="text-2xl font-semibold">{isHighImpactIdea(idea) ? "High" : "Unscored"}</div>
            <p className="text-muted-foreground">Impact scoring controls are not wired yet. Use prioritization to compare ideas by reach, effort, confidence, and product impact.</p>
          </div>
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Problem Statement">
          <p className="text-sm text-muted-foreground">{idea.problem_statement ?? "No explicit problem statement has been captured yet."}</p>
        </DetailPanel>
        <DetailPanel title="Target Users">
          <p className="text-sm text-muted-foreground">{idea.target_users ?? "Target users have not been defined yet."}</p>
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Validation Notes">
          {relatedFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked feedback yet. Capture interviews, customer asks, or stakeholder notes to strengthen validation.</p>
          ) : (
            <div className="space-y-2">
              {relatedFeedback.slice(0, 4).map((feedback) => (
                <div key={feedback.id} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{feedback.source} {feedback.sentiment ? `- ${feedback.sentiment}` : ""}</div>
                  <p className="mt-1 text-muted-foreground">{feedback.content}</p>
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
        <DetailPanel title="MVP Plan">
          {mvpPlanQuery.data ? (
            <div className="space-y-2 text-sm">
              <p>{mvpPlanQuery.data.scope}</p>
              {mvpPlanQuery.data.assumptions ? <p><strong>Assumptions:</strong> {mvpPlanQuery.data.assumptions}</p> : null}
              {mvpPlanQuery.data.risks ? <p><strong>Risks:</strong> {mvpPlanQuery.data.risks}</p> : null}
              {mvpPlanQuery.data.success_metrics ? <p><strong>Success:</strong> {mvpPlanQuery.data.success_metrics}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No MVP plan yet. Define scope, assumptions, risks, and success metrics before roadmap commitment.</p>
          )}
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Roadmap Links">
          {relatedRoadmap.length === 0 ? (
            <p className="text-sm text-muted-foreground">This idea is not linked to a roadmap item yet.</p>
          ) : (
            <div className="space-y-2">
              {relatedRoadmap.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-2 flex items-center gap-2"><RoadmapStatusBadge value={item.status} /><span className="text-xs text-muted-foreground">{item.target_quarter ?? "No quarter"}</span></div>
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
        <DetailPanel title="Linked Work Items">
          <p className="text-sm text-muted-foreground">Future cross-module links will connect this idea to Flow work items, Docs pages, Desk tickets, and Pulse incidents.</p>
        </DetailPanel>
      </div>
      <DetailPanel title="AI Analysis">
        {analysisMutation.data ? (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><h3 className="font-medium">Summary</h3><p className="mt-1 text-muted-foreground">{analysisMutation.data.summary ?? analysisMutation.data.raw_response ?? "Analysis returned."}</p></div>
            <div><h3 className="font-medium">Feasibility</h3><p className="mt-1 text-muted-foreground">{analysisMutation.data.feasibility ?? "No feasibility note returned."}</p></div>
            <div><h3 className="font-medium">Risks</h3><p className="mt-1 text-muted-foreground">{analysisMutation.data.risks ?? "No risk note returned."}</p></div>
            <div><h3 className="font-medium">MVP Suggestion</h3><p className="mt-1 text-muted-foreground">{analysisMutation.data.mvp_suggestion ?? "No MVP suggestion returned."}</p></div>
            <div className="md:col-span-2"><h3 className="font-medium">Next Steps</h3><p className="mt-1 text-muted-foreground">{analysisMutation.data.next_steps ?? "No next steps returned."}</p></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Run AI analysis to evaluate problem clarity, feasibility, risks, MVP direction, monetization angle, and next steps.</p>
        )}
      </DetailPanel>
    </div>
  );
}
