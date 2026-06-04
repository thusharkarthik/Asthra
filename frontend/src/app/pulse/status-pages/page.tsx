"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { SLABadge } from "@/components/modules/sla-badge";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function StatusPagesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const statusPagesQuery = useQuery({
    queryKey: ["pulse", "status-pages", selectedWorkspaceId],
    queryFn: () => pulseApi.listStatusPages(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 50 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Status Pages" description="External service status surfaces and components." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view status pages" /> : statusPagesQuery.isLoading ? <LoadingState /> : (statusPagesQuery.data ?? []).length === 0 ? <EmptyState title="No status pages yet" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(statusPagesQuery.data ?? []).map((page) => (
            <div key={page.id} className="rounded-md border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{page.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{page.description ?? "No description"}</p>
                </div>
                <SLABadge value={page.is_public ? "open" : "pending"} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Component overview placeholder</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
