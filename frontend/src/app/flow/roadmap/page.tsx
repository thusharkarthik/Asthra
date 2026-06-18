"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workflow } from "@/types/flow";

export default function FlowRoadmapPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const releasesQuery = useQuery({
    queryKey: ["flow", "roadmap", "releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const workItemsQuery = useQuery({
    queryKey: ["flow", "roadmap", "work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", selectedProjectId],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", selectedProjectId ?? 0),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });

  const releases = releasesQuery.data ?? [];
  const items = workItemsQuery.data ?? [];
  const initiatives = items.filter((item) => item.item_level === "initiative");
  const features = items.filter((item) => item.item_level === "feature");
  const sortedReleases = [...releases].sort((left, right) => {
    const leftDate = left.target_date ? new Date(left.target_date).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDate = right.target_date ? new Date(right.target_date).getTime() : Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate;
  });

  return (
    <>
      <PageHeader title="Roadmap" description="A lightweight timeline for initiatives, features, and releases." />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view the roadmap" /> : releasesQuery.isLoading || workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ModuleDashboardCard title="Initiatives" value={initiatives.length} />
            <ModuleDashboardCard title="Features" value={features.length} />
            <ModuleDashboardCard title="Releases" value={releases.length} />
          </div>
          <DetailPanel title="Release Timeline">
            {sortedReleases.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No releases planned yet. Create releases to start building the roadmap.</p> : (
              <div className="space-y-3">
                {sortedReleases.map((release) => {
                  const assigned = items.filter((item) => item.release_id === release.id);
                  return (
                    <div key={release.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link className="font-medium text-primary hover:underline" href={`/flow/releases/${release.id}`}>{release.name}</Link>
                          <p className="mt-1 text-sm text-muted-foreground">{release.version} · Target {release.target_date ? new Date(release.target_date).toLocaleDateString() : "not set"}</p>
                        </div>
                        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{release.status}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${release.completion_percentage}%` }} />
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {assigned.slice(0, 4).map((item) => (
                          <Link key={item.id} href={`/flow/work-items/${item.id}`} className="rounded-md border p-2 text-sm hover:bg-muted">
                            <div className="font-medium">{item.title}</div>
                            <div className="mt-1 flex items-center gap-2"><StatusBadge value={workflowStatusLabelFor(workflowQuery.data, item.status_id)} /></div>
                          </Link>
                        ))}
                        {assigned.length === 0 ? <p className="text-sm text-muted-foreground">No work assigned to this release.</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DetailPanel>
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailPanel title="Initiatives">
              <RoadmapItemList items={initiatives} workflow={workflowQuery.data} empty="Initiatives will appear here when work items are marked as initiative level." />
            </DetailPanel>
            <DetailPanel title="Features">
              <RoadmapItemList items={features} workflow={workflowQuery.data} empty="Features will appear here when work items are marked as feature level." />
            </DetailPanel>
          </div>
        </div>
      )}
    </>
  );
}

function RoadmapItemList({ items, workflow, empty }: { items: Array<{ id: number; title: string; status_id?: number | null }>; workflow?: Workflow; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="space-y-2">
      {items.slice(0, 6).map((item) => (
        <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border p-2 text-sm hover:bg-muted">
          <div className="font-medium">{item.title}</div>
          <div className="mt-1"><StatusBadge value={workflowStatusLabelFor(workflow, item.status_id)} /></div>
        </Link>
      ))}
    </div>
  );
}
