"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { pulseNavItems } from "@/components/modules/module-navs";
import { AiPlaceholderPanel, ModuleSubnav } from "@/components/modules/product-experience";
import { pulseApi } from "@/services/api/pulse-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PulseOnCallPage() {
  const token = useAuthStore((s) => s.accessToken);
  const pathname = usePathname();
  const schedules = useQuery({ queryKey: ["pulse", "on-call"], queryFn: () => pulseApi.listOnCallSchedules(token ?? ""), enabled: Boolean(token), retry: 1 });
  return <div className="space-y-6"><PageHeader title="On-call" description="Review on-call schedules and reliability coverage." /><ModuleSubnav items={pulseNavItems} activePath={pathname} />{schedules.isLoading ? <LoadingState /> : (schedules.data ?? []).length === 0 ? <EmptyState title="No on-call schedules yet" /> : <EntityTable columns={["Schedule", "Timezone", "Rotation Notes"]}>{(schedules.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.timezone ?? "Not set"}</span><span className="text-muted-foreground">{item.rotation_notes ?? "No notes"}</span></EntityTableRow>)}</EntityTable>}<AiPlaceholderPanel title="AI coverage suggestions">Future AI can identify coverage gaps, escalation fatigue, and incident handoff risks.</AiPlaceholderPanel></div>;
}
