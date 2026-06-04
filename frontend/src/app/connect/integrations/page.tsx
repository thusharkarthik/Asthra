"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.currentUser);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("github");
  const query = useQuery({ queryKey: ["connect", "integrations", workspaceId], queryFn: () => connectApi.listIntegrations(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const create = useMutation({ mutationFn: () => connectApi.createIntegration(token ?? "", { workspace_id: workspaceId ?? 0, name, provider, status: "inactive", created_by_id: user?.id }), onSuccess: () => { setOpen(false); setName(""); qc.invalidateQueries({ queryKey: ["connect", "integrations", workspaceId] }); } });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim() && workspaceId) create.mutate(); };
  return <><PageHeader title="Integrations" description="External system integrations and connector configuration." />{!workspaceId ? <EmptyState title="Select a workspace to manage integrations" /> : <div className="space-y-4"><div className="flex justify-end"><QuickCreateButton label="Create integration" onClick={() => setOpen(true)} /></div>{(query.data ?? []).length === 0 ? <EmptyState title="No integrations yet" /> : <EntityTable columns={["Name", "Provider", "Status"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.provider}</span><IntegrationStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable>}</div>}<CreateDialog title="Create integration" open={open} onOpenChange={setOpen}><form className="space-y-3" onSubmit={submit}><Input aria-label="Integration name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><Input aria-label="Integration provider" placeholder="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} /><Button disabled={create.isPending || !name.trim()}>{create.isPending ? "Creating..." : "Create"}</Button></form></CreateDialog></>;
}
