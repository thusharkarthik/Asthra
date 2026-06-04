"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ServiceLifecycleBadge } from "@/components/modules/service-lifecycle-badge";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ServicesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const query = useQuery({ queryKey: ["dev", "services", selectedWorkspaceId], queryFn: () => devApi.listServices(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }), enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId), retry: 1 });

  return (
    <div className="space-y-4">
      <PageHeader title="Service Catalog" description="Owned services, lifecycle status, and dependency visibility." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to view services" /> : query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No services yet" /> : (
        <EntityTable columns={["Service", "Lifecycle", "Repository", "Description"]}>
          {(query.data ?? []).map((service) => <EntityTableRow key={service.id} columns={4}><Link className="font-medium text-primary hover:underline" href={`/dev/services/${service.id}`}>{service.name}</Link><ServiceLifecycleBadge value={service.lifecycle_status} /><span>{service.repository_id ?? "Unlinked"}</span><span>{service.description ?? "No description"}</span></EntityTableRow>)}
        </EntityTable>
      )}
    </div>
  );
}
