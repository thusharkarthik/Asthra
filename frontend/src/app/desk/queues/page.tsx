"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { SLABadge } from "@/components/modules/sla-badge";
import { deskApi } from "@/services/api/desk-api";
import { useAuthStore } from "@/stores/auth-store";

export default function QueuesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queuesQuery = useQuery({ queryKey: ["desk", "queues"], queryFn: () => deskApi.listQueues(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const slasQuery = useQuery({ queryKey: ["desk", "slas"], queryFn: () => deskApi.listSlas(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Queues" description="Support queues and SLA coverage." />
      {queuesQuery.isLoading ? <LoadingState /> : (queuesQuery.data ?? []).length === 0 ? <EmptyState title="No queues yet" /> : (
        <EntityTable columns={["Queue", "Description", "Workspace"]}>
          {(queuesQuery.data ?? []).map((queue) => (
            <EntityTableRow key={queue.id} columns={3}>
              <span className="font-medium">{queue.name}</span>
              <span>{queue.description ?? "No description"}</span>
              <span>{queue.workspace_id}</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">SLA Summary</h2>
        {(slasQuery.data ?? []).length === 0 ? <EmptyState title="No SLAs yet" /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {(slasQuery.data ?? []).map((sla) => (
              <div key={sla.id} className="rounded-md border p-3">
                <div className="font-medium">{sla.name}</div>
                <div className="mt-2 flex gap-2"><SLABadge value={sla.priority} /><span className="text-xs text-muted-foreground">{sla.response_time_minutes}m response</span></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
