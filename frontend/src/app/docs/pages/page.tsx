"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CreatePageDialog, CreateSpaceDialog } from "@/components/docs/docs-create-dialogs";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsHeaderActions } from "@/components/docs/docs-header-actions";
import { DocsSetupState } from "@/components/docs/docs-setup-state";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate, spaceNameFor } from "@/components/docs/docs-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PagesPage() {
  const [isCreateSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [isCreatePageOpen, setCreatePageOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "pages"], queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });
  const spaces = spacesQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const filteredPages = useMemo(() => {
    const text = search.trim().toLowerCase();
    return pages.filter((page) => {
      const matchesText = !text || page.title.toLowerCase().includes(text) || page.content.toLowerCase().includes(text);
      const matchesSpace = !spaceFilter || page.space_id === Number(spaceFilter);
      const matchesStatus = !statusFilter || (page.status ?? "draft") === statusFilter;
      return matchesText && matchesSpace && matchesStatus;
    });
  }, [pages, search, spaceFilter, statusFilter]);

  return (
    <>
      <PageHeader
        title="Pages"
        description="Browse, search, and create knowledge pages."
        breadcrumbs={<DocsBreadcrumbs items={[{ label: "Pages" }]} />}
        actions={<DocsHeaderActions onCreateSpace={selectedWorkspaceId ? () => setCreateSpaceOpen(true) : undefined} onCreatePage={spaces.length > 0 ? () => setCreatePageOpen(true) : undefined} />}
      />
      <DocsSubnav />
      {!selectedWorkspaceId ? <DocsSetupState hasOrganization hasWorkspace={false} /> : spacesQuery.isLoading || pagesQuery.isLoading ? <LoadingState /> : spaces.length === 0 ? (
        <DocsSetupState hasOrganization hasWorkspace hasSpaces={false} mode="spaces" />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" aria-label="Search pages" placeholder="Search pages and content" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <Select aria-label="Space filter" value={spaceFilter} onChange={(event) => setSpaceFilter(event.target.value)}>
                <option value="">All spaces</option>
                {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
              </Select>
              <Select aria-label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
              <Button onClick={() => setCreatePageOpen(true)}>Create Page</Button>
            </div>
          </div>
          {filteredPages.length === 0 ? <EmptyState title={pages.length === 0 ? "This space has no pages yet. Create the first page." : "No pages match this search."} /> : (
            <EntityTable columns={["Title", "Space", "Updated", "Tags", "Status"]}>
              {filteredPages.map((page) => (
                <EntityTableRow key={page.id} columns={5}>
                  <Link href={`/docs/pages/${page.id}`} className="font-medium text-primary hover:underline">{page.title}</Link>
                  <span>{spaceNameFor(page, spaces)}</span>
                  <span className="text-muted-foreground">{docsDate(page.updated_at ?? page.created_at)}</span>
                  <span className="text-muted-foreground">Tags coming soon</span>
                  <StatusBadge value={page.status ?? "draft"} />
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateSpaceDialog open={isCreateSpaceOpen} onOpenChange={setCreateSpaceOpen} />
      <CreatePageDialog open={isCreatePageOpen} onOpenChange={setCreatePageOpen} spaces={spaces} />
    </>
  );
}
