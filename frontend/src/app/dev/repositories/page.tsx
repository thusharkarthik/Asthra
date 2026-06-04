"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function RepositoriesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["dev", "repos", selectedWorkspaceId], queryFn: () => devApi.listRepositories(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Repositories" description="Source repositories connected to the workspace." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view repositories" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No repositories yet" /> : (
        <EntityTable columns={["Name", "Provider", "Branch", "Project"]}>
          {(query.data ?? []).map((repo) => <EntityTableRow key={repo.id} columns={4}><span className="font-medium">{repo.name}</span><span>{repo.provider}</span><span>{repo.default_branch ?? "main"}</span><span>{repo.project_id ?? "Workspace"}</span></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
