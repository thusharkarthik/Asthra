"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function SpacesPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const createMutation = useMutation({
    mutationFn: () => docsApi.createSpace(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, name, description, created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setCreateOpen(false);
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["docs", "spaces"] });
    }
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Spaces" description="Organize documentation by workspace spaces." />
      {!selectedWorkspaceId ? <EmptyState title="Select a workspace to create spaces" /> : (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setCreateOpen(true)}>Create space</Button></div>
          {(spacesQuery.data ?? []).length === 0 ? <EmptyState title="No spaces yet" /> : (
            <EntityTable columns={["Name", "Description", "Workspace"]}>
              {(spacesQuery.data ?? []).map((space) => (
                <EntityTableRow key={space.id} columns={3}>
                  <span className="font-medium">{space.name}</span>
                  <span>{space.description ?? "-"}</span>
                  <span>{space.workspace_id}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateDialog title="Create space" open={isCreateOpen} onOpenChange={setCreateOpen}>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input aria-label="Space name" placeholder="Space name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input aria-label="Space description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button disabled={createMutation.isPending || !name.trim()}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
        </form>
      </CreateDialog>
    </>
  );
}
