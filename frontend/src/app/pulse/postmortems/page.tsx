"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { pulseNavItems } from "@/components/modules/module-navs";
import { EntityLinkCard, ModuleSubnav, RelationshipPlaceholder } from "@/components/modules/product-experience";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PulsePostmortemsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const incidents = useQuery({ queryKey: ["pulse", "incidents", workspaceId], queryFn: () => pulseApi.listIncidents(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Postmortems" description="Track incident learnings, root causes, and follow-up actions." /><ModuleSubnav items={pulseNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view postmortems" /> : incidents.isLoading ? <LoadingState /> : (incidents.data ?? []).length === 0 ? <EmptyState title="No incident postmortems yet" /> : <div className="grid gap-3 md:grid-cols-2">{(incidents.data ?? []).map((incident) => <EntityLinkCard key={incident.id} href={`/pulse/incidents/${incident.id}`} title={incident.title} description="Open incident detail to view or create the postmortem." />)}</div>}<RelationshipPlaceholder title="Postmortem follow-ups" description="Future UI will connect postmortem action items to Flow work items, Desk tickets, and Dev releases." /></div>;
}
