"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, Lightbulb, Map, MessageSquare, Sparkles, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFeatureRequestDialog, CreateFeedbackDialog, CreateIdeaDialog, CreateRoadmapItemDialog } from "@/components/discover/discover-create-dialogs";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DiscoverHeaderActions } from "@/components/discover/discover-header-actions";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { discoverDate, isHighImpactIdea, needsValidation } from "@/components/discover/discover-utils";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformContext } from "@/context/platformContext";

export default function DiscoverPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { currentScope } = usePlatformContext();
  const selectedOrganizationId = currentScope.organizationId;
  const selectedWorkspaceId = currentScope.workspaceId;
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const roadmapQuery = useQuery({
    queryKey: ["discover", "roadmap", selectedWorkspaceId],
    queryFn: () => discoverApi.listRoadmapItems(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const featureRequestsQuery = useQuery({
    queryKey: ["discover", "feature-requests", selectedWorkspaceId],
    queryFn: () => discoverApi.listFeatureRequests(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const ideas = ideasQuery.data ?? [];
  const roadmap = roadmapQuery.data ?? [];
  const featureRequests = featureRequestsQuery.data ?? [];
  const validationIdeas = ideas.filter(needsValidation);
  const highImpactIdeas = ideas.filter(isHighImpactIdea);
  const reviewingIdeas = ideas.filter((idea) => idea.status === "reviewing");
  const validatingIdeas = ideas.filter((idea) => idea.status === "validating");
  const approvedIdeas = ideas.filter((idea) => idea.status === "approved");
  const rejectedIdeas = ideas.filter((idea) => idea.status === "rejected");
  const convertedIdeas = ideas.filter((idea) => idea.status === "converted_to_work");
  const ideasWaitingDocumentation = approvedIdeas.filter((idea) => !(roadmap.some((item) => item.idea_id === idea.id)));
  const ideasWaitingExecution = roadmap.filter((item) => item.idea_id && !convertedIdeas.some((idea) => idea.id === item.idea_id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover"
        description="Shape product opportunities from raw signals into validated ideas, MVP plans, and roadmap outcomes."
        breadcrumbs={<DiscoverBreadcrumbs items={[]} />}
        actions={
          <DiscoverHeaderActions
            onCreateIdea={() => setIdeaOpen(true)}
            onCreateFeatureRequest={() => setRequestOpen(true)}
            onAddFeedback={() => setFeedbackOpen(true)}
            onCreateRoadmapItem={() => setRoadmapOpen(true)}
          />
        }
      />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? (
        <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" />
      ) : (
        <>
          <ModuleStatsGrid
            stats={[
              { title: "Total Ideas", value: ideas.length, description: "Captured opportunities" },
              { title: "Reviewing", value: reviewingIdeas.length, description: "Being triaged" },
              { title: "Validating", value: validatingIdeas.length, description: "Needs evidence" },
              { title: "Approved", value: approvedIdeas.length, description: "Ready for planning" },
              { title: "Rejected", value: rejectedIdeas.length, description: "Not moving forward" },
              { title: "Converted to Work", value: convertedIdeas.length, description: "Sent toward execution" }
            ]}
          />
          {ideasQuery.isLoading || roadmapQuery.isLoading || featureRequestsQuery.isLoading ? <LoadingState /> : ideas.length === 0 ? (
            <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="ideas" />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <ModuleDashboardCard title="Recent Ideas">
                <div className="space-y-3">
                  {ideas.slice(0, 5).map((idea) => (
                    <Link key={idea.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/discover/ideas/${idea.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{idea.title}</div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>
                        </div>
                        <StatusBadge value={idea.status} />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{discoverDate(idea.updated_at ?? idea.created_at)}</div>
                    </Link>
                  ))}
                </div>
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Ideas Needing Validation">
                {validationIdeas.length === 0 ? <EmptyState title="No ideas waiting on validation" /> : (
                  <div className="space-y-3">
                    {validationIdeas.slice(0, 5).map((idea) => (
                      <Link key={idea.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/60" href={`/discover/ideas/${idea.id}`}>
                        <span className="font-medium">{idea.title}</span>
                        <StatusBadge value={idea.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Top Prioritized Ideas">
                {highImpactIdeas.length === 0 ? <EmptyState title="No high impact ideas identified yet" /> : (
                  <div className="space-y-3">
                    {highImpactIdeas.slice(0, 5).map((idea) => (
                      <div key={idea.id} className="rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <Link className="font-medium text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>{idea.title}</Link>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.problem_statement ?? idea.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Roadmap Preview">
                {roadmap.length === 0 ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="roadmap" /> : (
                  <div className="space-y-3">
                    {roadmap.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description ?? "No description yet"}</p>
                          </div>
                          <RoadmapStatusBadge value={item.status} />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{item.target_quarter ?? "No target quarter"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Product Signals">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{featureRequests.length}</div>
                    <p className="text-sm text-muted-foreground">Feature requests captured</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{roadmap.length}</div>
                    <p className="text-sm text-muted-foreground">Roadmap items planned</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{ideasWaitingDocumentation.length}</div>
                    <p className="text-sm text-muted-foreground">Ideas waiting documentation</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{ideasWaitingExecution.length}</div>
                    <p className="text-sm text-muted-foreground">Ideas waiting execution</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{convertedIdeas.length}</div>
                    <p className="text-sm text-muted-foreground">Ideas in progress</p>
                  </div>
                </div>
              </ModuleDashboardCard>
              <ModuleDashboardCard title="AI Discovery Suggestions">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Brain, title: "Analyze an idea", text: "Check clarity, feasibility, risks, and MVP direction." },
                    { icon: MessageSquare, title: "Cluster requests", text: "Group similar customer asks for prioritization." },
                    { icon: Lightbulb, title: "Find validation gaps", text: "Identify ideas that need stronger evidence." },
                    { icon: Map, title: "Roadmap fit", text: "Compare ideas against current roadmap outcomes." }
                  ].map((item) => (
                    <div key={item.title} className="rounded-md border p-3">
                      <item.icon className="mb-2 h-4 w-4 text-primary" />
                      <div className="text-sm font-medium">{item.title}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
                <Button className="mt-3" variant="outline" onClick={() => setIdeaOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Start with an idea
                </Button>
              </ModuleDashboardCard>
            </div>
          )}
        </>
      )}
      <CreateIdeaDialog open={ideaOpen} onOpenChange={setIdeaOpen} />
      <CreateFeatureRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <CreateFeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <CreateRoadmapItemDialog open={roadmapOpen} onOpenChange={setRoadmapOpen} />
    </div>
  );
}
