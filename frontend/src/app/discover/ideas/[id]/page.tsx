"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DiscoverBackLink, DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { discoverDate, isHighImpactIdea, needsValidation } from "@/components/discover/discover-utils";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [showFlowDraft, setShowFlowDraft] = useState(false);

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
  const updateMutation = useMutation({
    mutationFn: () => discoverApi.updateIdea(accessToken ?? "", id, { title, description, problem_statement: problemStatement || null, target_users: targetUsers || null, business_value: businessValue || null }),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "ideas"] });
    }
  });
  const lifecycleMutation = useMutation({
    mutationFn: (action: "approve" | "reject" | "convert") => {
      if (action === "approve") return discoverApi.approveIdea(accessToken ?? "", id);
      if (action === "reject") return discoverApi.rejectIdea(accessToken ?? "", id);
      return discoverApi.convertIdeaToWork(accessToken ?? "", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "ideas"] });
    }
  });
  const idea = ideaQuery.data;
  useEffect(() => {
    if (!isEditing && idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setProblemStatement(idea.problem_statement ?? "");
      setTargetUsers(idea.target_users ?? "");
      setBusinessValue(idea.business_value ?? "");
    }
  }, [idea, isEditing]);

  if (ideaQuery.isLoading) return <DetailPanel title="Idea"><div className="text-sm text-muted-foreground">Loading idea...</div></DetailPanel>;
  if (!idea) return <DetailPanel title="Idea"><div className="text-sm text-destructive">Unable to load idea.</div></DetailPanel>;

  const relatedRoadmap = (roadmapQuery.data ?? []).filter((item) => item.idea_id === idea.id);
  const relatedFeedback = (feedbackQuery.data ?? []).filter((feedback) => feedback.idea_id === idea.id);

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    updateMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <DiscoverSubnav />
      <DiscoverBackLink href="/discover/ideas" label="Back to Ideas" />
      <EntityDetailHeader
        title={idea.title}
        description={idea.description}
        meta={<><StatusBadge value={idea.status} /><span className="text-xs text-muted-foreground">Updated {discoverDate(idea.updated_at ?? idea.created_at)}</span></>}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing((value) => !value)}>{isEditing ? "Close Edit" : "Edit Idea"}</Button>
            <Button variant="outline" onClick={() => lifecycleMutation.mutate("approve")} disabled={lifecycleMutation.isPending}>Approve</Button>
            <Button variant="outline" onClick={() => lifecycleMutation.mutate("reject")} disabled={lifecycleMutation.isPending}>Reject</Button>
            <Button variant="outline" onClick={() => setShowFlowDraft((value) => !value)}>Create Flow Work Item</Button>
            <Button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>{analysisMutation.isPending ? "Analyzing..." : "AI analyze idea"}</Button>
          </div>
        }
      />
      <DiscoverBreadcrumbs items={[{ label: "Ideas", href: "/discover/ideas" }, { label: idea.title }]} />
      {isEditing ? (
        <DetailPanel title="Edit Idea">
          <form className="space-y-3" onSubmit={submitEdit}>
            <Input aria-label="Edit idea title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <textarea aria-label="Edit idea description" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} />
            <textarea aria-label="Edit problem statement" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={problemStatement} onChange={(event) => setProblemStatement(event.target.value)} placeholder="Problem statement" />
            <Input aria-label="Edit target users" value={targetUsers} onChange={(event) => setTargetUsers(event.target.value)} placeholder="Target users" />
            <textarea aria-label="Edit business value" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={businessValue} onChange={(event) => setBusinessValue(event.target.value)} placeholder="Business value" />
            <div className="flex gap-2">
              <Button disabled={updateMutation.isPending || !title.trim() || !description.trim()}>{updateMutation.isPending ? "Saving..." : "Save Idea"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </DetailPanel>
      ) : null}
      {showFlowDraft ? (
        <DetailPanel title="Flow Work Item Draft">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Flow work item creation from Discover is not wired yet. Review this draft payload, then mark the idea converted when the Flow item is created manually.
            </p>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(
                {
                  project_id: idea.project_id,
                  title: idea.title,
                  description: [idea.description, idea.problem_statement ? `Problem: ${idea.problem_statement}` : null, idea.target_users ? `Target users: ${idea.target_users}` : null, idea.business_value ? `Business value: ${idea.business_value}` : null].filter(Boolean).join("\n\n"),
                  source: "discover_idea",
                  source_id: idea.id
                },
                null,
                2
              )}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => lifecycleMutation.mutate("convert")} disabled={lifecycleMutation.isPending || idea.status === "converted_to_work"}>
                {idea.status === "converted_to_work" ? "Already converted" : "Mark Converted to Work"}
              </Button>
              <Button variant="outline" onClick={() => setShowFlowDraft(false)}>Close Draft</Button>
            </div>
          </div>
        </DetailPanel>
      ) : null}
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
            <div className="text-2xl font-semibold">{idea.impact_score ?? (isHighImpactIdea(idea) ? "High" : "Unscored")}</div>
            <p className="text-muted-foreground">Confidence: {idea.confidence_score ?? "Unscored"} · Effort: {idea.effort_score ?? "Unscored"}</p>
            <p className="text-muted-foreground">{idea.business_value ?? "Business value has not been captured yet."}</p>
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
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>No Flow work item is linked yet.</p>
            <p>Use Create Flow Work Item to review a draft payload. Automatic creation and persisted cross-module references are still pending.</p>
          </div>
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
