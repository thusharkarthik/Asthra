"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { pulseNavItems } from "@/components/modules/module-navs";
import { ModuleSubnav } from "@/components/modules/product-experience";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PulseEscalationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const policies = useQuery({ queryKey: ["pulse", "escalation-policies"], queryFn: () => pulseApi.listEscalationPolicies(token ?? ""), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Escalations" description="Escalation policies for incident response and ownership routing." /><ModuleSubnav items={pulseNavItems} activePath={pathname} />{policies.isLoading ? <LoadingState /> : (policies.data ?? []).length === 0 ? <EmptyState title="No escalation policies yet" /> : <EntityTable columns={["Policy", "Description", "Steps"]}>{(policies.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.description ?? "No description"}</span><span className="text-muted-foreground">{item.steps ?? "No steps"}</span></EntityTableRow>)}</EntityTable>}</div>;
}
