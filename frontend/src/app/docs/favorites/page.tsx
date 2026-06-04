"use client";

import Link from "next/link";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useFavoritesStore } from "@/stores/favorites-store";

export default function DocsFavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites).filter((item) => item.source === "docs");
  return (
    <>
      <PageHeader title="Favorite Pages" description="Pinned Docs pages and knowledge shortcuts." />
      <DocsSubnav />
      {favorites.length === 0 ? <EmptyState title="No favorite pages yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {favorites.map((item) => <Link key={`${item.entity_type}-${item.entity_id}`} href={item.href} className="rounded-lg border bg-card p-4 text-sm font-medium hover:bg-muted">{item.title}</Link>)}
        </div>
      )}
    </>
  );
}
