"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { WorkflowStatusBadge } from "@/components/modules/workflow-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { automationApi } from "@/services/api/automation-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.currentUser);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const query = useQuery({ queryKey: ["automation", "workflows", workspaceId], queryFn: () => automationApi.listWorkflows(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const create = useMutation({ mutationFn: () => automationApi.createWorkflow(token ?? "", { workspace_id: workspaceId ?? 0, name, description, status: "draft", created_by_id: user?.id ?? 1 }), onSuccess: () => { setName(""); setDescription(""); setOpen(false); qc.invalidateQueries({ queryKey: ["automation", "workflows", workspaceId] }); } });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim() && workspaceId) create.mutate(); };

  return (
    <>
      <PageHeader title="Workflows" description="List and create workflow definitions. Builder canvas is deferred." />
      {!workspaceId ? <EmptyState title="Select a workspace to manage workflows" /> : <div className="space-y-4"><div className="flex justify-end"><QuickCreateButton label="Create workflow" onClick={() => setOpen(true)} /></div>{query.isLoading ? <LoadingState /> : (query.data ?? []).length === 0 ? <EmptyState title="No workflows yet" /> : <EntityTable columns={["Name", "Status", "Created By"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><Link className="font-medium text-primary hover:underline" href={`/automation/workflows/${item.id}`}>{item.name}</Link><WorkflowStatusBadge value={item.status} /><span>{item.created_by_id}</span></EntityTableRow>)}</EntityTable>}</div>}
      <CreateDialog title="Create workflow" open={open} onOpenChange={setOpen}><form className="space-y-3" onSubmit={submit}><Input aria-label="Workflow name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /><Input aria-label="Workflow description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} /><Button disabled={create.isPending || !name.trim()}>{create.isPending ? "Creating..." : "Create"}</Button></form></CreateDialog>
    </>
  );
}
