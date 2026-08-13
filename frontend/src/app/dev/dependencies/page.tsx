"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { devNavItems } from "@/components/modules/module-navs";
import { AiPlaceholderPanel, ModuleSubnav, RelationshipPlaceholder } from "@/components/modules/product-experience";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DevDependenciesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const services = useQuery({ queryKey: ["dev", "services", workspaceId], queryFn: () => devApi.listServices(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Dependencies" description="Map service dependencies and future architecture risk." /><ModuleSubnav items={devNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view dependencies" /> : services.isLoading ? <LoadingState /> : (services.data ?? []).length === 0 ? <EmptyState title="No services available for dependency mapping" /> : <div className="grid gap-3 md:grid-cols-2">{(services.data ?? []).map((service) => <Link key={service.id} className="rounded-md border p-3 hover:bg-muted/60" href={`/dev/services/${service.id}`}><div className="font-medium">{service.name}</div><p className="mt-1 text-sm text-muted-foreground">Open service detail to view owners and dependencies.</p></Link>)}</div>}<RelationshipPlaceholder title="Dependency risk placeholder" description="Future dependency graphs will flag risky upstream services, release coupling, and incident blast radius." /><AiPlaceholderPanel title="AI engineering insights">Future AI can summarize dependency risk, release impact, and architectural coupling.</AiPlaceholderPanel></div>;
}
