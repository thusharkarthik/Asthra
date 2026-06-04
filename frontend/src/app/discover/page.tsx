"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DiscoverPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);

  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const roadmapQuery = useQuery({
    queryKey: ["discover", "roadmap", selectedWorkspaceId],
    queryFn: () => discoverApi.listRoadmapItems(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 5 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });
  const featureRequestsQuery = useQuery({
    queryKey: ["discover", "feature-requests", selectedWorkspaceId],
    queryFn: () => discoverApi.listFeatureRequests(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const ideas = ideasQuery.data ?? [];
  const roadmap = roadmapQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Discover" description="Product discovery workspace for ideas, requests, validation, MVP planning, and roadmap items." />
      {!selectedWorkspaceId ? (
        <EmptyState title="Select a workspace to load Discover" />
      ) : (
        <>
          <ModuleStatsGrid
            stats={[
              { title: "Ideas", value: ideas.length, description: "Recent product opportunities" },
              { title: "Feature Requests", value: (featureRequestsQuery.data ?? []).length, description: "Requests captured for this workspace" },
              { title: "Roadmap Items", value: roadmap.length, description: "Planned product outcomes" }
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleDashboardCard title="Recent Ideas">
              {ideasQuery.isLoading ? <LoadingState /> : ideas.length === 0 ? <EmptyState title="No ideas yet" /> : (
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <Link key={idea.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/discover/ideas/${idea.id}`}>
                      <div className="font-medium">{idea.title}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.description}</div>
                      <div className="mt-2"><StatusBadge value={idea.status} /></div>
                    </Link>
                  ))}
                </div>
              )}
            </ModuleDashboardCard>
            <ModuleDashboardCard title="Roadmap Preview">
              {roadmapQuery.isLoading ? <LoadingState /> : roadmap.length === 0 ? <EmptyState title="No roadmap items yet" /> : (
                <div className="space-y-3">
                  {roadmap.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <RoadmapStatusBadge value={item.status} />
                        <span className="text-xs text-muted-foreground">{item.target_quarter ?? "No quarter"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModuleDashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
