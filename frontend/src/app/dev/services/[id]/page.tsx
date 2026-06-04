"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { ServiceLifecycleBadge } from "@/components/modules/service-lifecycle-badge";
import { devApi } from "@/services/api/dev-api";
import { useAuthStore } from "@/stores/auth-store";

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const serviceQuery = useQuery({ queryKey: ["dev", "service", id], queryFn: () => devApi.getService(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const ownersQuery = useQuery({ queryKey: ["dev", "owners", id], queryFn: () => devApi.listServiceOwners(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const dependenciesQuery = useQuery({ queryKey: ["dev", "dependencies", id], queryFn: () => devApi.listServiceDependencies(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });

  if (serviceQuery.isLoading) return <DetailPanel title="Service"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!serviceQuery.data) return <DetailPanel title="Service"><div className="text-sm text-destructive">Unable to load service.</div></DetailPanel>;
  const service = serviceQuery.data;

  return (
    <div className="space-y-4">
      <EntityDetailHeader title={service.name} description={service.description} meta={<><ServiceLifecycleBadge value={service.lifecycle_status} /><span className="text-xs text-muted-foreground">Workspace {service.workspace_id}</span></>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DetailPanel title="Owners">
          {(ownersQuery.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No owners yet.</div> : <div className="space-y-2">{(ownersQuery.data ?? []).map((owner) => <div key={owner.id} className="rounded-md border p-2 text-sm">User {owner.owner_id} · {owner.role ?? "owner"}</div>)}</div>}
        </DetailPanel>
        <DetailPanel title="Dependencies">
          {(dependenciesQuery.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No dependencies yet.</div> : <div className="space-y-2">{(dependenciesQuery.data ?? []).map((dep) => <div key={dep.id} className="rounded-md border p-2 text-sm">Depends on service {dep.depends_on_service_id} · {dep.dependency_type ?? "runtime"}</div>)}</div>}
        </DetailPanel>
      </div>
    </div>
  );
}
