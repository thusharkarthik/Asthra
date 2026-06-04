"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreateSpaceDialog } from "@/components/docs/docs-create-dialogs";
import { DocsHeaderActions } from "@/components/docs/docs-header-actions";
import { DocsSetupState } from "@/components/docs/docs-setup-state";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate, pageCountForSpace } from "@/components/docs/docs-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { Button } from "@/components/ui/button";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function SpacesPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "pages"], queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const spaces = spacesQuery.data ?? [];
  const pages = pagesQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Spaces"
        description="Spaces group pages by team, domain, product, or operating area."
        actions={<DocsHeaderActions onCreateSpace={selectedWorkspaceId ? () => setCreateOpen(true) : undefined} />}
      />
      <DocsSubnav />
      {!selectedWorkspaceId ? <DocsSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={false} /> : spacesQuery.isLoading ? <LoadingState /> : (
        <div className="space-y-4">
          {spaces.length === 0 ? (
            <DocsSetupState hasOrganization hasWorkspace hasSpaces={false} mode="spaces" />
          ) : spacesQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load spaces. <Button size="sm" variant="outline" onClick={() => spacesQuery.refetch()}>Retry</Button>
            </div>
          ) : (
            <EntityTable columns={["Space Name", "Description", "Page Count", "Last Updated"]}>
              {spaces.map((space) => (
                <EntityTableRow key={space.id} columns={4}>
                  <Link className="font-medium text-primary hover:underline" href={`/docs/spaces/${space.id}`}>{space.name}</Link>
                  <span>{space.description ?? "-"}</span>
                  <span>{pageCountForSpace(space.id, pages)}</span>
                  <span className="text-muted-foreground">{docsDate(space.updated_at ?? space.created_at)}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
          {spaces.length === 0 ? <EmptyState title="Examples: Engineering, Architecture, Product, Operations" /> : null}
        </div>
      )}
      <CreateSpaceDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
