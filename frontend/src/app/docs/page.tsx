"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";

export default function DocsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "pages"], queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 5 }), enabled: Boolean(accessToken), retry: 1 });

  return (
    <>
      <PageHeader title="Docs" description="Knowledge spaces, pages, comments, and search." />
      {spacesQuery.isLoading || pagesQuery.isLoading ? <LoadingState /> : <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <ModuleDashboardCard title="Spaces" value={(spacesQuery.data ?? []).length}>
            <Link className="text-sm text-primary hover:underline" href="/docs/spaces">Manage spaces</Link>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Pages" value={(pagesQuery.data ?? []).length}>
            <Link className="text-sm text-primary hover:underline" href="/docs/pages">Browse pages</Link>
          </ModuleDashboardCard>
          <ModuleDashboardCard title="Search">
            <Link className="text-sm text-primary hover:underline" href="/docs/pages">Search docs pages</Link>
          </ModuleDashboardCard>
        </div>
        <ModuleDashboardCard title="Recent Pages">
          {(pagesQuery.data ?? []).length === 0 ? <EmptyState title="No pages yet" /> : (
            <div className="space-y-2">
              {(pagesQuery.data ?? []).map((page) => (
                <Link key={page.id} href={`/docs/pages/${page.id}`} className="block rounded-md border p-3 hover:bg-muted">
                  <div className="text-sm font-medium">{page.title}</div>
                  <div className="text-xs text-muted-foreground">Space {page.space_id}</div>
                </Link>
              ))}
            </div>
          )}
        </ModuleDashboardCard>
      </div>}
    </>
  );
}
