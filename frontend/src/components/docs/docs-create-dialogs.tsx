"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EntityCreateDialog, EntityEditDialog, FormActions, FormField } from "@/components/modules/entity-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { docsApi } from "@/services/api/docs-api";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Space } from "@/types/docs";

export function CreateSpaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useMutation({
    mutationFn: () => docsApi.createSpace(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, project_id: selectedProjectId, name, description, created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setName("");
      setDescription("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.docs.dashboardSummary(selectedWorkspaceId) });
      addToast({ type: "success", title: "Space created", message: "Docs was updated with the new space." });
    },
    onError: () => {
      addToast({ type: "error", title: "Space was not created", message: "Check required fields and try again." });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !selectedWorkspaceId) {
      addToast({ type: "error", title: "Missing required fields", message: "Select a workspace and enter a space name." });
      return;
    }
    createMutation.mutate();
  };

  return (
    <EntityCreateDialog title="Create space" open={open} onOpenChange={onOpenChange} onSubmit={handleSubmit} error={createMutation.error ? "Unable to create space." : null}>
      <FormField label="Space name" required error={!name.trim() ? "Required" : null}>
        <Input aria-label="Space name" placeholder="Engineering, Architecture, Product..." value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label="Description">
        <Input aria-label="Space description" placeholder="What knowledge belongs here?" value={description} onChange={(event) => setDescription(event.target.value)} />
      </FormField>
      <FormActions submitLabel="Create Space" loadingLabel="Creating..." isSubmitting={createMutation.isPending} disabled={!name.trim() || !selectedWorkspaceId} onCancel={() => onOpenChange(false)} />
    </EntityCreateDialog>
  );
}

export function CreatePageDialog({ open, onOpenChange, spaces }: { open: boolean; onOpenChange: (open: boolean) => void; spaces: Space[] }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [spaceId, setSpaceId] = useState<number | null>(spaces[0]?.id ?? null);
  const [parentPageId, setParentPageId] = useState("");
  const [status, setStatus] = useState("draft");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  useEffect(() => {
    if (!spaceId && spaces[0]?.id) setSpaceId(spaces[0].id);
  }, [spaceId, spaces]);
  const createMutation = useMutation({
    mutationFn: () => docsApi.createPage(accessToken ?? "", { space_id: spaceId ?? spaces[0]?.id ?? 0, parent_page_id: parentPageId ? Number(parentPageId) : null, title, content, status, created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      setParentPageId("");
      setStatus("draft");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.docs.dashboardSummary(selectedWorkspaceId) });
      addToast({ type: "success", title: "Page created", message: "Docs was updated with the new page." });
    },
    onError: () => {
      addToast({ type: "error", title: "Page was not created", message: "Check required fields and try again." });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || spaces.length === 0) {
      addToast({ type: "error", title: "Missing required fields", message: "Create a space and enter a page title." });
      return;
    }
    createMutation.mutate();
  };

  return (
    <EntityCreateDialog title="Create page" open={open} onOpenChange={onOpenChange} onSubmit={handleSubmit} error={createMutation.error ? "Unable to create page." : null}>
        <FormField label="Space" required>
          <Select aria-label="Page space" value={spaceId ?? spaces[0]?.id ?? ""} onChange={(event) => setSpaceId(Number(event.target.value))}>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Parent page">
          <Input aria-label="Parent page ID" placeholder="Optional parent page ID" value={parentPageId} onChange={(event) => setParentPageId(event.target.value)} />
        </FormField>
        <FormField label="Page title" required error={!title.trim() ? "Required" : null}>
          <Input aria-label="Page title" placeholder="Page title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select aria-label="Page status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </FormField>
        <FormField label="Content">
          <textarea aria-label="Page content" className="min-h-32 w-full rounded-md border bg-background p-3 text-sm" placeholder="Capture the knowledge..." value={content} onChange={(event) => setContent(event.target.value)} />
        </FormField>
        {spaces.length === 0 ? <p className="text-sm text-muted-foreground">Create a space before adding pages.</p> : null}
        <FormActions submitLabel="Create Page" loadingLabel="Creating..." isSubmitting={createMutation.isPending} disabled={!title.trim() || spaces.length === 0} onCancel={() => onOpenChange(false)} />
    </EntityCreateDialog>
  );
}

export function EditSpaceDialog({ open, onOpenChange, space }: { open: boolean; onOpenChange: (open: boolean) => void; space: Space }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? "");

  useEffect(() => {
    setName(space.name);
    setDescription(space.description ?? "");
  }, [space]);

  const updateMutation = useMutation({
    mutationFn: () => docsApi.updateSpace(accessToken ?? "", space.id, { name, description }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.docs.dashboardSummary(selectedWorkspaceId) });
      addToast({ type: "success", title: "Space updated", message: "Space metadata was saved." });
    },
    onError: () => {
      addToast({ type: "error", title: "Space was not updated", message: "Check the space fields and try again." });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      addToast({ type: "error", title: "Missing required fields", message: "Enter a space name." });
      return;
    }
    updateMutation.mutate();
  };

  return (
    <EntityEditDialog title="Edit space" open={open} onOpenChange={onOpenChange} onSubmit={handleSubmit} error={updateMutation.error ? "Unable to update space." : null}>
      <FormField label="Space name" required error={!name.trim() ? "Required" : null}>
        <Input aria-label="Edit space name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label="Description">
        <Input aria-label="Edit space description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </FormField>
      <FormActions submitLabel="Save Space" loadingLabel="Saving..." isSubmitting={updateMutation.isPending} disabled={!name.trim()} onCancel={() => onOpenChange(false)} />
    </EntityEditDialog>
  );
}
