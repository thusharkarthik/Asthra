"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate, spaceNameFor } from "@/components/docs/docs-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { StatusBadge } from "@/components/modules/status-badge";
import { Input } from "@/components/ui/input";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";

export default function DocsSearchPage() {
  const [query, setQuery] = useState("");
  const accessToken = useAuthStore((state) => state.accessToken);
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const pagesQuery = useQuery({ queryKey: ["docs", "search", query], queryFn: () => query.trim() ? docsApi.searchPages(accessToken ?? "", query.trim()) : docsApi.listPages(accessToken ?? "", { limit: 50 }), enabled: Boolean(accessToken), retry: 1 });
  const spaces = spacesQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const matchingSpaces = useMemo(() => spaces.filter((space) => !query.trim() || space.name.toLowerCase().includes(query.toLowerCase())), [query, spaces]);
  const matchingTags = query.trim() ? ["architecture", "runbook", "onboarding"].filter((tag) => tag.includes(query.toLowerCase())) : ["architecture", "runbook", "onboarding"];

  return (
    <>
      <PageHeader title="Docs Search" description="Search pages, spaces, and future tags." />
      <DocsSubnav />
      <div className="space-y-4">
        <Input aria-label="Search docs" placeholder="Search knowledge" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="grid gap-4 lg:grid-cols-3">
          <DetailPanel title="Pages">
            {pages.length === 0 ? <EmptyState title="No pages found" /> : <div className="space-y-2">{pages.map((page) => (
              <Link key={page.id} href={`/docs/pages/${page.id}`} className="block rounded-md border p-3 hover:bg-muted">
                <div className="text-sm font-medium">{page.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{spaceNameFor(page, spaces)} · {docsDate(page.updated_at ?? page.created_at)}</div>
                <div className="mt-2"><StatusBadge value={page.status ?? "draft"} /></div>
              </Link>
            ))}</div>}
          </DetailPanel>
          <DetailPanel title="Spaces">
            {matchingSpaces.length === 0 ? <EmptyState title="No spaces found" /> : <div className="space-y-2">{matchingSpaces.map((space) => <Link key={space.id} href={`/docs/spaces/${space.id}`} className="block rounded-md border p-3 text-sm font-medium hover:bg-muted">{space.name}</Link>)}</div>}
          </DetailPanel>
          <DetailPanel title="Tags">
            <div className="flex flex-wrap gap-2">{matchingTags.map((tag) => <span key={tag} className="rounded-md border px-2 py-1 text-xs">{tag}</span>)}</div>
          </DetailPanel>
        </div>
      </div>
    </>
  );
}
