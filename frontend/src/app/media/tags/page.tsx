"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { mediaNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";

export default function MediaTagsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const tags = useQuery({ queryKey: ["media", "tags"], queryFn: () => mediaApi.listTags(token ?? ""), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Tags" description="Shared labels for organizing media assets and collections." /><ModuleSubnav items={mediaNavItems} activePath={pathname} />{tags.isLoading ? <LoadingState /> : (tags.data ?? []).length === 0 ? <EmptyState title="No media tags yet" /> : <div className="flex flex-wrap gap-2">{(tags.data ?? []).map((tag) => <EntityBadge key={tag.id} value={tag.name} />)}</div>}</div>;
}
