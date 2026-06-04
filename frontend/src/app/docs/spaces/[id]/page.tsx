"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DocsExplorer } from "@/components/docs/docs-explorer";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate } from "@/components/docs/docs-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const spaceQuery = useQuery({ queryKey: ["docs", "space", id], queryFn: () => docsApi.getSpace(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "space-pages", id], queryFn: () => docsApi.listPages(accessToken ?? "", { space_id: Number(id), limit: 100 }), enabled: Boolean(accessToken && id), retry: 1 });
  const space = spaceQuery.data;
  const pages = pagesQuery.data ?? [];

  if (spaceQuery.isLoading) return <><DocsSubnav /><LoadingState /></>;
  if (!space) return <><DocsSubnav /><EmptyState title="Unable to load space" /></>;

  return (
    <div className="space-y-4">
      <DocsSubnav />
      <EntityDetailHeader title={space.name} description={space.description ?? "Knowledge space"} meta={<span className="rounded-md bg-muted px-2 py-0.5 text-xs">Updated {docsDate(space.updated_at ?? space.created_at)}</span>} />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <DocsExplorer spaces={spacesQuery.data ?? [space]} pages={pages} />
        <DetailPanel title="Pages in this space">
          {pages.length === 0 ? <EmptyState title="This space has no pages yet. Create the first page." /> : (
            <div className="space-y-2">
              {pages.map((page) => (
                <Link key={page.id} href={`/docs/pages/${page.id}`} className="block rounded-md border p-3 hover:bg-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{page.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Updated {docsDate(page.updated_at ?? page.created_at)}</div>
                    </div>
                    <StatusBadge value={page.status ?? "draft"} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DetailPanel>
      </div>
    </div>
  );
}
