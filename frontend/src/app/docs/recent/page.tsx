"use client";

import Link from "next/link";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useRecentItemsStore } from "@/stores/recent-items-store";

export default function DocsRecentPage() {
  const recent = useRecentItemsStore((state) => state.viewed).filter((item) => item.source === "docs");
  return (
    <>
      <PageHeader title="Recent Pages" description="Recently viewed Docs pages from this browser." />
      <DocsSubnav />
      {recent.length === 0 ? <EmptyState title="Recently viewed pages will appear here" /> : (
        <div className="space-y-2">
          {recent.map((item) => <Link key={`${item.entity_type}-${item.entity_id}`} href={item.href} className="block rounded-md border bg-card p-3 text-sm hover:bg-muted">{item.title}</Link>)}
        </div>
      )}
    </>
  );
}
