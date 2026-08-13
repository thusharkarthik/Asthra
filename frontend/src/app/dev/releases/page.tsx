"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ReleaseStatusBadge } from "@/components/modules/release-status-badge";
import { Button } from "@/components/ui/button";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ReleasesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["dev", "releases", selectedWorkspaceId], queryFn: () => devApi.listReleases(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const summaryMutation = useMutation({ mutationFn: (releaseId: number) => devApi.summarizeRelease(accessToken ?? "", releaseId) });

  return (
    <div className="space-y-4">
      <PageHeader title="Releases" description="Release planning, rollout status, and AI summary entry point." />
      {summaryMutation.data ? <div className="rounded-md border bg-muted p-3 text-sm">{summaryMutation.data.release_overview ?? summaryMutation.data.raw_response ?? "Release summary returned."}</div> : null}
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view releases" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No releases yet" /> : (
        <EntityTable columns={["Version", "Status", "Service", "AI"]}>
          {(query.data ?? []).map((release) => <EntityTableRow key={release.id} columns={4}><span className="font-medium">{release.version}</span><ReleaseStatusBadge value={release.status} /><span>{release.service_id ?? "Workspace"}</span><Button onClick={() => summaryMutation.mutate(release.id)} disabled={summaryMutation.isPending}>AI summary</Button></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
