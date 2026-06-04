"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateDialog } from "@/components/modules/create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Space } from "@/types/docs";

export function CreateSpaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useMutation({
    mutationFn: () => docsApi.createSpace(accessToken ?? "", { workspace_id: selectedWorkspaceId ?? 0, name, description, created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setName("");
      setDescription("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !selectedWorkspaceId) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create space" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input aria-label="Space name" placeholder="Engineering, Architecture, Product..." value={name} onChange={(event) => setName(event.target.value)} />
        <Input aria-label="Space description" placeholder="What knowledge belongs here?" value={description} onChange={(event) => setDescription(event.target.value)} />
        {createMutation.error ? <p className="text-sm text-destructive">Unable to create space.</p> : null}
        <Button disabled={createMutation.isPending || !name.trim() || !selectedWorkspaceId}>{createMutation.isPending ? "Creating..." : "Create Space"}</Button>
      </form>
    </CreateDialog>
  );
}

export function CreatePageDialog({ open, onOpenChange, spaces }: { open: boolean; onOpenChange: (open: boolean) => void; spaces: Space[] }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [spaceId, setSpaceId] = useState<number | null>(spaces[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMutation = useMutation({
    mutationFn: () => docsApi.createPage(accessToken ?? "", { space_id: spaceId ?? spaces[0]?.id ?? 0, title, content, status: "draft", created_by_id: currentUser?.id ?? 1 }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || spaces.length === 0) return;
    createMutation.mutate();
  };

  return (
    <CreateDialog title="Create page" open={open} onOpenChange={onOpenChange}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Select aria-label="Page space" value={spaceId ?? spaces[0]?.id ?? ""} onChange={(event) => setSpaceId(Number(event.target.value))}>
          {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
        </Select>
        <Input aria-label="Page title" placeholder="Page title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea aria-label="Page content" className="min-h-32 w-full rounded-md border bg-background p-3 text-sm" placeholder="Capture the knowledge..." value={content} onChange={(event) => setContent(event.target.value)} />
        {spaces.length === 0 ? <p className="text-sm text-muted-foreground">Create a space before adding pages.</p> : null}
        {createMutation.error ? <p className="text-sm text-destructive">Unable to create page.</p> : null}
        <Button disabled={createMutation.isPending || !title.trim() || spaces.length === 0}>{createMutation.isPending ? "Creating..." : "Create Page"}</Button>
      </form>
    </CreateDialog>
  );
}
