"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { isHighImpactIdea } from "@/components/discover/discover-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { StatusBadge } from "@/components/modules/status-badge";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PrioritizationPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const ideas = ideasQuery.data ?? [];
  const rankedIdeas = [...ideas].sort((a, b) => Number(isHighImpactIdea(b)) - Number(isHighImpactIdea(a)));

  return (
    <div className="space-y-6">
      <PageHeader title="Prioritization" description="Compare ideas by impact, confidence, reach, effort, and roadmap readiness." />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : ideasQuery.isLoading ? <LoadingState /> : ideas.length === 0 ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="ideas" /> : (
        <>
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Scores are a lightweight frontend view for now. The backend impact score endpoint can later provide reach, impact, confidence, effort, and total score controls.
          </div>
          {rankedIdeas.length === 0 ? <EmptyState title="No ideas to prioritize yet" /> : (
            <EntityTable columns={["Idea", "Status", "Priority Signal", "Problem"]}>
              {rankedIdeas.map((idea) => (
                <EntityTableRow key={idea.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>{idea.title}</Link>
                  <StatusBadge value={idea.status} />
                  <span>{isHighImpactIdea(idea) ? "High impact" : "Needs scoring"}</span>
                  <span className="line-clamp-2 text-muted-foreground">{idea.problem_statement ?? idea.description}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </>
      )}
    </div>
  );
}
