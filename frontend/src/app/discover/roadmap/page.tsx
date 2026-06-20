"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { CreateRoadmapItemDialog } from "@/components/discover/discover-create-dialogs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { roadmapBucket } from "@/components/discover/discover-utils";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { Button } from "@/components/ui/button";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function RoadmapPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [candidateBuckets, setCandidateBuckets] = useState<Record<number, string>>({});
  const roadmapQuery = useQuery({
    queryKey: ["discover", "roadmap", selectedWorkspaceId],
    queryFn: () => discoverApi.listRoadmapItems(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const roadmap = roadmapQuery.data ?? [];
  const roadmapIdeaIds = new Set(roadmap.map((item) => item.idea_id).filter(Boolean));
  const approvedCandidates = (ideasQuery.data ?? []).filter((idea) => idea.status === "approved" && !roadmapIdeaIds.has(idea.id));
  const candidateBucket = (idea: (typeof approvedCandidates)[number]) => candidateBuckets[idea.id] ?? ((idea.impact_score ?? 0) >= 8 ? "Now" : (idea.confidence_score ?? 0) >= 5 ? "Next" : "Later");
  const moveCandidate = (ideaId: number, bucket: string) => setCandidateBuckets((current) => ({ ...current, [ideaId]: bucket }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadmap"
        description="Turn validated opportunities into visible product outcomes."
        breadcrumbs={<DiscoverBreadcrumbs items={[{ label: "Roadmap" }]} />}
        actions={<Button onClick={() => setOpen(true)}>Create roadmap item</Button>}
      />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : roadmapQuery.isLoading || ideasQuery.isLoading ? <LoadingState /> : roadmap.length === 0 && approvedCandidates.length === 0 ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="roadmap" /> : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {["Now", "Next", "Later"].map((bucket) => {
              const items = roadmap.filter((item) => roadmapBucket(item) === bucket);
              return (
                <section key={bucket} className="rounded-lg border bg-card p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{bucket}</h2>
                    <span className="text-xs text-muted-foreground">{items.length + approvedCandidates.filter((idea) => candidateBucket(idea) === bucket).length} items</span>
                  </div>
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No {bucket.toLowerCase()} roadmap items.</div>
                    ) : (
                      <>
                      {items.map((item) => (
                        <div key={item.id} className="rounded-md border bg-background p-3">
                          <div className="font-medium">{item.title}</div>
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description ?? "No description"}</p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <RoadmapStatusBadge value={item.status} />
                            <span className="text-xs text-muted-foreground">{item.target_quarter ?? "TBD"}</span>
                          </div>
                          <Button className="mt-3" size="sm" variant="outline" disabled>Change bucket placeholder</Button>
                        </div>
                      ))}
                      </>
                    )}
                    {approvedCandidates.filter((idea) => candidateBucket(idea) === bucket).map((idea) => (
                      <div key={`candidate-${idea.id}`} className="rounded-md border border-dashed bg-background p-3">
                        <div className="text-xs font-medium uppercase text-muted-foreground">Approved idea candidate</div>
                        <div className="mt-1 font-medium">{idea.title}</div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.business_value ?? idea.description}</p>
                        <div className="mt-2 text-xs text-muted-foreground">Impact {idea.impact_score ?? "unscored"} · Confidence {idea.confidence_score ?? "unscored"}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Now", "Next", "Later"].filter((target) => target !== bucket).map((target) => (
                            <Button key={target} size="sm" variant="outline" onClick={() => moveCandidate(idea.id, target)}>Move to {target}</Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Approved Idea Candidates</h2>
              <p className="text-sm text-muted-foreground">Approved ideas are shown in Now, Next, or Later as client-side planning candidates until roadmap promotion is wired.</p>
            </div>
            {approvedCandidates.length === 0 ? <EmptyState title="No approved ideas waiting for roadmap planning" /> : (
              <div className="grid gap-3 md:grid-cols-2">
                {approvedCandidates.map((idea) => (
                  <div key={idea.id} className="rounded-md border p-3">
                    <div className="font-medium">{idea.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.business_value ?? idea.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">Impact {idea.impact_score ?? "unscored"} · Confidence {idea.confidence_score ?? "unscored"}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      <CreateRoadmapItemDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
