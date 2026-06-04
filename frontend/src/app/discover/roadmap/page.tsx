"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { RoadmapStatusBadge } from "@/components/modules/roadmap-status-badge";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function RoadmapPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const roadmapQuery = useQuery({
    queryKey: ["discover", "roadmap", selectedWorkspaceId],
    queryFn: () => discoverApi.listRoadmapItems(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Roadmap" description="Planned product outcomes by quarter and status." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view roadmap" /> : roadmapQuery.isLoading ? <LoadingState /> : (roadmapQuery.data ?? []).length === 0 ? <EmptyState title="No roadmap items yet" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          {["planned", "in_progress", "shipped"].map((status) => (
            <section key={status} className="space-y-3">
              <h2 className="text-sm font-semibold capitalize">{status.replace("_", " ")}</h2>
              {(roadmapQuery.data ?? []).filter((item) => item.status === status).map((item) => (
                <div key={item.id} className="rounded-md border bg-card p-3">
                  <div className="font-medium">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description ?? "No description"}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <RoadmapStatusBadge value={item.status} />
                    <span className="text-xs text-muted-foreground">{item.target_quarter ?? "TBD"}</span>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
