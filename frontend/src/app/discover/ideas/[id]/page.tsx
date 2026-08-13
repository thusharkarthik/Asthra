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
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
import { discoverDate, isHighImpactIdea, needsValidation } from "@/components/discover/discover-utils";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { docsApi } from "@/services/api/docs-api";
import { discoverApi } from "@/services/api/discover-api";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [businessValue, setBusinessValue] = useState("");
  const [showFlowDraft, setShowFlowDraft] = useState(false);
  const [showConversionWizard, setShowConversionWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [linkMode, setLinkMode] = useState<"doc_page" | "work_item" | null>(null);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkTargetTitle, setLinkTargetTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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
  const docsPagesQuery = useQuery({
    queryKey: ["discover", "idea-docs", selectedWorkspaceId],
    queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const docsSpacesQuery = useQuery({
    queryKey: ["discover", "idea-docs-spaces"],
    queryFn: () => docsApi.listSpaces(accessToken ?? ""),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const workItemsQuery = useQuery({
    queryKey: ["discover", "idea-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const lifecycleGraphQuery = useQuery({
    queryKey: ["discover", "idea-lifecycle", id],
    queryFn: () => discoverApi.getIdeaLifecycleGraph(accessToken ?? "", id),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const executionLinksQuery = useQuery({
    queryKey: ["discover", "idea-execution-links", id],
    queryFn: () => discoverApi.getIdeaExecutionLinks(accessToken ?? "", id),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const analysisMutation = useMutation({ mutationFn: () => discoverApi.analyzeIdea(accessToken ?? "", id) });
  const generateSpecMutation = useMutation({
    mutationFn: () => {
      const space = docsSpacesQuery.data?.find((item) => item.workspace_id === idea?.workspace_id) ?? docsSpacesQuery.data?.[0];
      if (!idea) throw new Error("Idea is not loaded.");
      if (!space) throw new Error("Create a Docs space before generating a specification.");
      return discoverApi.generateIdeaSpecification(accessToken ?? "", id, {
        space_id: space.id,
        created_by_id: currentUser?.id ?? idea.created_by_id,
        title: `${idea.title} Specification`,
        status: "draft"
      });
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Unable to generate specification."),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-execution-links", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-lifecycle", id] });
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "delivery"] });
    }
  });
  const createEpicMutation = useMutation({
    mutationFn: () => {
      if (!idea) throw new Error("Idea is not loaded.");
      const projectId = selectedProjectId ?? idea.project_id;
      if (!projectId) throw new Error("Select a project before creating an epic.");
      return discoverApi.createIdeaEpic(accessToken ?? "", id, {
        project_id: projectId,
        reporter_id: currentUser?.id ?? idea.created_by_id,
        title: idea.title
      });
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Unable to create epic."),
    onSuccess: async () => {
      setActionError(null);
      setShowFlowDraft(false);
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-execution-links", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-lifecycle", id] });
      await queryClient.invalidateQueries({ queryKey: ["flow"] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "delivery"] });
    }
  });
  const linkMutation = useMutation({
    mutationFn: () => {
      if (!linkMode) throw new Error("Select a link type.");
      return discoverApi.createRelationship(accessToken ?? "", {
        source_type: "idea",
        source_id: String(id),
        target_type: linkMode,
        target_id: linkTargetId,
        relationship_type: linkMode === "doc_page" ? "documents" : "executes",
        title: linkTargetTitle || `${linkMode === "doc_page" ? "Document" : "Work item"} ${linkTargetId}`,
        label: linkMode === "doc_page" ? "Related document" : "Related work item"
      });
    },
    onSuccess: async () => {
      setLinkMode(null);
      setLinkTargetId("");
      setLinkTargetTitle("");
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-lifecycle", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "delivery"] });
    }
  });
  const unlinkMutation = useMutation({
    mutationFn: (relationshipId: number) => discoverApi.deleteRelationship(accessToken ?? "", relationshipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["discover", "idea-lifecycle", id] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "delivery"] });
    }
  });
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
  const ideaToken = idea.title.toLowerCase().split(" ")[0] ?? "";
  const persistedDocs = lifecycleGraphQuery.data?.documents ?? [];
  const persistedWorkItems = lifecycleGraphQuery.data?.work_items ?? [];
  const executionDocs = executionLinksQuery.data?.documents ?? [];
  const executionWork = executionLinksQuery.data?.flow_work ?? [];
  const relatedDocs = executionDocs.length > 0
    ? executionDocs.map((link) => ({ id: link.id, target_id: String(link.docs_page_id), title: link.title, status: link.status, source: "execution" }))
    : persistedDocs.length > 0 ? persistedDocs : (docsPagesQuery.data ?? []).filter((page) => `${page.title} ${page.content}`.toLowerCase().includes(ideaToken)).map((page) => ({ id: page.id, target_id: String(page.id), title: page.title }));
  const relatedWorkItems = executionWork.length > 0
    ? executionWork.map((link) => ({ id: link.id, target_id: String(link.flow_work_item_id), title: link.title, status: link.status, flow_item_type: link.flow_item_type, source: "execution" }))
    : persistedWorkItems.length > 0 ? persistedWorkItems : (workItemsQuery.data ?? []).filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(ideaToken)).map((item) => ({ id: item.id, target_id: String(item.id), title: item.title }));
  const relatedRoadmapRelationships = lifecycleGraphQuery.data?.roadmap_items ?? [];

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    updateMutation.mutate();
  }

  function submitManualLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linkTargetId.trim()) return;
    linkMutation.mutate();
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
            <Button variant="outline" onClick={() => { setShowConversionWizard(true); setWizardStep(1); }}>Convert Idea</Button>
            <Button variant="outline" onClick={() => createEpicMutation.mutate()} disabled={createEpicMutation.isPending || Boolean(executionWork.find((link) => link.flow_item_type === "epic"))}>
              {createEpicMutation.isPending ? "Creating Epic..." : "Create Epic"}
            </Button>
            <Button onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}>{analysisMutation.isPending ? "Analyzing..." : "AI analyze idea"}</Button>
          </div>
        }
      />
      <DiscoverBreadcrumbs items={[{ label: "Ideas", href: "/discover/ideas" }, { label: idea.title }]} />
      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{actionError}</div> : null}
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
        <DetailPanel title="Create Epic">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This creates a real Flow epic and links it back to this Discover idea.
            </p>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(
                {
                  project_id: selectedProjectId ?? idea.project_id,
                  title: idea.title,
                  description: [idea.description, idea.problem_statement ? `Problem: ${idea.problem_statement}` : null, idea.target_users ? `Target users: ${idea.target_users}` : null, idea.business_value ? `Business value: ${idea.business_value}` : null].filter(Boolean).join("\n\n"),
                  item_level: "initiative",
                  linked_source: "discover_idea",
                  source_id: idea.id
                },
                null,
                2
              )}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => createEpicMutation.mutate()} disabled={createEpicMutation.isPending || !((selectedProjectId ?? idea.project_id))}>
                {createEpicMutation.isPending ? "Creating..." : "Create Epic"}
              </Button>
              <Button variant="outline" onClick={() => setShowFlowDraft(false)}>Close Draft</Button>
            </div>
          </div>
        </DetailPanel>
      ) : null}
      {showConversionWizard ? (
        <DetailPanel title={`Convert Idea - Step ${wizardStep} of 4`}>
          <div className="space-y-4 text-sm">
            {wizardStep === 1 ? (
              <div>
                <h3 className="font-medium">Create Documentation</h3>
                <p className="mt-1 text-muted-foreground">Prepare Requirements, Architecture, Meeting Notes, and Research docs before execution.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {["Requirements", "Architecture", "Meeting Notes", "Research"].map((label) => <div key={label} className="rounded-md border p-3">{label} document draft</div>)}
                </div>
              </div>
            ) : null}
            {wizardStep === 2 ? (
              <div>
                <h3 className="font-medium">Create Flow Structure</h3>
                <p className="mt-1 text-muted-foreground">Confirm the execution shape manually: Epic, Feature, Stories, and Tasks.</p>
                <pre className="mt-3 overflow-auto rounded-md border bg-muted p-3 text-xs">{JSON.stringify({ epic: idea.title, feature: `${idea.title} MVP`, stories: ["Validate user workflow", "Build first usable path"], tasks: ["Create requirements", "Create implementation checklist"] }, null, 2)}</pre>
              </div>
            ) : null}
            {wizardStep === 3 ? (
              <div>
                <h3 className="font-medium">Review</h3>
                <p className="mt-1 text-muted-foreground">Review documents and Flow structure. No AI or automation is used; the user confirms the handoff.</p>
              </div>
            ) : null}
            {wizardStep === 4 ? (
              <div>
                <h3 className="font-medium">Execute</h3>
                <p className="mt-1 text-muted-foreground">When the docs and Flow work are created, mark this idea converted to work.</p>
                <Button className="mt-3" variant="outline" onClick={() => lifecycleMutation.mutate("convert")} disabled={lifecycleMutation.isPending || idea.status === "converted_to_work"}>Mark Converted to Work</Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => Math.max(1, step - 1))}>Back</Button>
              <Button variant="outline" disabled={wizardStep === 4} onClick={() => setWizardStep((step) => Math.min(4, step + 1))}>Next</Button>
              <Button variant="outline" onClick={() => setShowConversionWizard(false)}>Close Wizard</Button>
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
        <DetailPanel title="Related Documents">
          {relatedDocs.length === 0 ? <p className="text-sm text-muted-foreground">No related documents found. Create Requirements, Architecture, Meeting Notes, or Research docs for this idea.</p> : (
            <div className="space-y-2">{relatedDocs.slice(0, 4).map((page) => (
              <div key={`${page.id}-${page.target_id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <a className="text-primary hover:underline" href={`/docs/pages/${page.target_id}`}>{page.title ?? `Document ${page.target_id}`}</a>
                {"relationship_type" in page ? <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(page.id)} disabled={unlinkMutation.isPending}>Unlink</Button> : null}
              </div>
            ))}</div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => generateSpecMutation.mutate()} disabled={generateSpecMutation.isPending || relatedDocs.some((doc) => "source" in doc && doc.source === "execution")}>
              {generateSpecMutation.isPending ? "Generating..." : "Generate Specification"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLinkMode("doc_page")}>Link Existing Document</Button>
          </div>
          {linkMode === "doc_page" ? <ManualLinkForm typeLabel="Document" targetId={linkTargetId} targetTitle={linkTargetTitle} isPending={linkMutation.isPending} onTargetIdChange={setLinkTargetId} onTargetTitleChange={setLinkTargetTitle} onCancel={() => setLinkMode(null)} onSubmit={submitManualLink} /> : null}
        </DetailPanel>
        <DetailPanel title="Related Work Items">
          {relatedWorkItems.length === 0 ? <p className="text-sm text-muted-foreground">No related Flow work items found yet.</p> : (
            <div className="space-y-2">{relatedWorkItems.slice(0, 4).map((item) => (
              <div key={`${item.id}-${item.target_id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <a className="text-primary hover:underline" href={`/flow/work-items/${item.target_id}`}>{item.title ?? `Work item ${item.target_id}`}</a>
                {"relationship_type" in item ? <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(item.id)} disabled={unlinkMutation.isPending}>Unlink</Button> : null}
              </div>
            ))}</div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFlowDraft(true)}>Create Epic</Button>
            <Button size="sm" variant="outline" onClick={() => setLinkMode("work_item")}>Link Existing Work Item</Button>
          </div>
          {linkMode === "work_item" ? <ManualLinkForm typeLabel="Work Item" targetId={linkTargetId} targetTitle={linkTargetTitle} isPending={linkMutation.isPending} onTargetIdChange={setLinkTargetId} onTargetTitleChange={setLinkTargetTitle} onCancel={() => setLinkMode(null)} onSubmit={submitManualLink} /> : null}
        </DetailPanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Roadmap Links">
          {relatedRoadmap.length === 0 && relatedRoadmapRelationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">This idea is not linked to a roadmap item yet.</p>
          ) : (
            <div className="space-y-2">
              {relatedRoadmapRelationships.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{item.title ?? `Roadmap item ${item.target_id}`}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Persisted lifecycle relationship</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(item.id)} disabled={unlinkMutation.isPending}>Unlink</Button>
                </div>
              ))}
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
            <p>{relatedWorkItems.length > 0 ? `${relatedWorkItems.length} Flow work item relationship stored.` : "No persisted Flow work item is linked yet."}</p>
            <p>Use Create Epic to create Flow execution work, or Link Existing Work Item to persist a manual relationship.</p>
          </div>
        </DetailPanel>
      </div>
      <LinkedResourcesPanel entityType="discover_idea" entityId={idea.id} entityTitle={idea.title} />
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

function ManualLinkForm({
  typeLabel,
  targetId,
  targetTitle,
  isPending,
  onTargetIdChange,
  onTargetTitleChange,
  onCancel,
  onSubmit
}: {
  typeLabel: string;
  targetId: string;
  targetTitle: string;
  isPending: boolean;
  onTargetIdChange: (value: string) => void;
  onTargetTitleChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-3 space-y-3 rounded-md border border-dashed p-3" onSubmit={onSubmit}>
      <p className="text-xs text-muted-foreground">Search lookup is not available yet. Enter a known {typeLabel.toLowerCase()} ID and title to persist the relationship.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label={`${typeLabel} ID`} placeholder={`${typeLabel} ID`} value={targetId} onChange={(event) => onTargetIdChange(event.target.value)} />
        <Input aria-label={`${typeLabel} title`} placeholder={`${typeLabel} title`} value={targetTitle} onChange={(event) => onTargetTitleChange(event.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending || !targetId.trim()}>{isPending ? "Linking..." : `Link ${typeLabel}`}</Button>
        <Button size="sm" type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
