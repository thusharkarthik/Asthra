"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { devNavItems } from "@/components/modules/module-navs";
import { EntityBadge, ModuleSubnav } from "@/components/modules/product-experience";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";

export default function DevPullRequestsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const prs = useQuery({ queryKey: ["dev", "pull-requests"], queryFn: () => devApi.listPullRequests(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Pull Requests" description="Review open and recently merged engineering work." /><ModuleSubnav items={devNavItems} activePath={pathname} />{prs.isLoading ? <LoadingState /> : (prs.data ?? []).length === 0 ? <EmptyState title="No pull requests yet" /> : <EntityTable columns={["Pull Request", "Status", "Repository", "Author"]}>{(prs.data ?? []).map((item) => <EntityTableRow key={item.id} columns={4}><span className="font-medium">{item.title}</span><EntityBadge value={item.status} /><span>Repo {item.repository_id}</span><span>{item.author_id ? `User ${item.author_id}` : "Unknown"}</span></EntityTableRow>)}</EntityTable>}</div>;
}
