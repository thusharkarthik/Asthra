"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, FileSearch, FileText, Sparkles } from "lucide-react";
import { CreatePageDialog, CreateSpaceDialog } from "@/components/docs/docs-create-dialogs";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsExplorer } from "@/components/docs/docs-explorer";
import { DocsHeaderActions } from "@/components/docs/docs-header-actions";
import { DocsSetupState } from "@/components/docs/docs-setup-state";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate, sortedDocsPages, spaceNameFor } from "@/components/docs/docs-utils";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";
import { usePlatformContext } from "@/context/platformContext";
import type { Page, Space } from "@/types/docs";

export default function DocsPage() {
  const [isCreateSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [isCreatePageOpen, setCreatePageOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { organizations, workspaces, currentScope } = usePlatformContext();
  const selectedOrganizationId = currentScope.organizationId;
  const selectedWorkspaceId = currentScope.workspaceId;
  const recentViewed = useRecentItemsStore((state) => state.viewed).filter((item) => item.source === "docs");
  const hasOrganization = Boolean(selectedOrganizationId) || organizations.length > 0;
  const hasWorkspace = Boolean(selectedWorkspaceId) || workspaces.length > 0;

  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken) && hasWorkspace, retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "pages"], queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 100 }), enabled: Boolean(accessToken) && hasWorkspace, retry: 1 });
  const spaces = spacesQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const recentPages = sortedDocsPages(pages).slice(0, 6);
  const drafts = pages.filter((page) => (page.status ?? "draft") === "draft").slice(0, 5);
  const draftPages = pages.filter((page) => (page.status ?? "draft") === "draft");
  const publishedPages = pages.filter((page) => page.status === "published");
  const pagesLinkedToWork = pages.filter((page) => /flow|work item|work/i.test(`${page.title} ${page.content}`));
  const pagesWithoutWork = pages.filter((page) => !pagesLinkedToWork.some((linkedPage) => linkedPage.id === page.id));

  return (
    <>
      <PageHeader
        title="Docs"
        description="Organize workspace knowledge into spaces and pages that are searchable, discussable, and AI-ready."
        breadcrumbs={<DocsBreadcrumbs items={[]} />}
        actions={<DocsHeaderActions onCreateSpace={hasWorkspace ? () => setCreateSpaceOpen(true) : undefined} onCreatePage={hasWorkspace && spaces.length > 0 ? () => setCreatePageOpen(true) : undefined} />}
      />
      <DocsSubnav />
      {!hasOrganization || !hasWorkspace ? (
        <DocsSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} />
      ) : spacesQuery.isLoading || pagesQuery.isLoading ? (
        <LoadingState />
      ) : spacesQuery.error || pagesQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Unable to load Docs. <Button size="sm" variant="outline" onClick={() => { spacesQuery.refetch(); pagesQuery.refetch(); }}>Retry</Button>
        </div>
      ) : spaces.length === 0 ? (
        <DocsSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasSpaces={false} mode="spaces" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <ModuleDashboardCard title="Total Spaces" value={spaces.length} />
            <ModuleDashboardCard title="Total Pages" value={pages.length} />
            <ModuleDashboardCard title="Draft Pages" value={draftPages.length} />
            <ModuleDashboardCard title="Published Pages" value={publishedPages.length} />
            <ModuleDashboardCard title="Recently Updated" value={recentPages.length} />
            <ModuleDashboardCard title="Pages Linked To Work" value={pagesLinkedToWork.length} />
            <ModuleDashboardCard title="Pages Without Work" value={pagesWithoutWork.length} />
            <ModuleDashboardCard title="Recently Referenced" value={recentViewed.length} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr_0.9fr]">
            <DocsExplorer spaces={spaces} pages={pages} />
            <ModuleDashboardCard title="Recent Pages">
              {recentPages.length === 0 ? (
                <DocsSetupState hasOrganization hasWorkspace hasPages={false} mode="pages" />
              ) : (
                <div className="space-y-2">
                  {recentPages.map((page) => (
                    <Link key={page.id} href={`/docs/pages/${page.id}`} className="block rounded-md border p-3 hover:bg-muted">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{page.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{spaceNameFor(page, spaces)} · Updated {docsDate(page.updated_at ?? page.created_at)}</div>
                        </div>
                        <StatusBadge value={page.status ?? "draft"} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ModuleDashboardCard>
            <div className="space-y-4">
              <ModuleDashboardCard title="My Drafts" value={drafts.length}>
                <PageLinkList pages={drafts} spaces={spaces} empty="No draft pages yet." />
              </ModuleDashboardCard>
              <ModuleDashboardCard title="Recently Viewed" value={recentViewed.length}>
                {recentViewed.length === 0 ? <p className="text-sm text-muted-foreground">Viewed pages will appear here.</p> : (
                  <div className="space-y-2">
                    {recentViewed.slice(0, 5).map((item) => <Link key={`${item.entity_type}-${item.entity_id}`} href={item.href} className="block rounded-md border p-3 text-sm hover:bg-muted">{item.title}</Link>)}
                  </div>
                )}
              </ModuleDashboardCard>
            </div>
          </div>
          <ModuleDashboardCard title="AI Knowledge Shortcuts">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Summarize onboarding docs", Brain],
                ["Show deployment guide", FileSearch],
                ["Search architecture pages", Sparkles]
              ].map(([label, Icon]) => {
                const IconComponent = Icon as typeof Brain;
                return (
                  <button key={String(label)} className="flex items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <span>{String(label)}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">AI shortcuts are placeholders until the assistant is wired into Docs-specific retrieval.</p>
          </ModuleDashboardCard>
        </div>
      )}
      <CreateSpaceDialog open={isCreateSpaceOpen} onOpenChange={setCreateSpaceOpen} />
      <CreatePageDialog open={isCreatePageOpen} onOpenChange={setCreatePageOpen} spaces={spaces} />
    </>
  );
}

function PageLinkList({ pages, spaces, empty }: { pages: Page[]; spaces: Space[]; empty: string }) {
  if (pages.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2">
      {pages.map((page) => (
        <Link key={page.id} href={`/docs/pages/${page.id}`} className="block rounded-md border p-3 hover:bg-muted">
          <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /> {page.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{spaceNameFor(page, spaces)}</div>
        </Link>
      ))}
    </div>
  );
}
