"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateDialog } from "@/components/modules/create-dialog";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { MediaTypeBadge } from "@/components/modules/media-type-badge";
import { QuickCreateButton } from "@/components/modules/quick-create-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MediaAssetsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.currentUser);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [assetType, setAssetType] = useState("document");
  const query = useQuery({ queryKey: ["media", "assets", workspaceId], queryFn: () => mediaApi.listAssets(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const create = useMutation({ mutationFn: () => mediaApi.createAsset(token ?? "", { workspace_id: workspaceId ?? 0, uploaded_by_id: user?.id, title, asset_type: assetType, file_url: fileUrl, file_name: title }), onSuccess: () => { setOpen(false); setTitle(""); setFileUrl(""); qc.invalidateQueries({ queryKey: ["media", "assets", workspaceId] }); } });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (title.trim() && fileUrl.trim() && workspaceId) create.mutate(); };
  return <><PageHeader title="Media Assets" description="Asset metadata grid/list. File upload storage is deferred." />{!workspaceId ? <EmptyState title="Select a workspace to manage media assets" /> : <div className="space-y-4"><div className="flex justify-end"><QuickCreateButton label="Create asset metadata" onClick={() => setOpen(true)} /></div><EntityTable columns={["Title", "Type", "URL"]}>{(query.data ?? []).map((asset) => <EntityTableRow key={asset.id} columns={3}><Link className="font-medium text-primary hover:underline" href={`/media/assets/${asset.id}`}>{asset.title}</Link><MediaTypeBadge value={asset.asset_type} /><span className="truncate">{asset.file_url}</span></EntityTableRow>)}</EntityTable></div>}<CreateDialog title="Create asset metadata" open={open} onOpenChange={setOpen}><form className="space-y-3" onSubmit={submit}><Input aria-label="Asset title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} /><Input aria-label="Asset type" placeholder="document" value={assetType} onChange={(e) => setAssetType(e.target.value)} /><Input aria-label="File URL" placeholder="https://example.com/file.pdf" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} /><Button disabled={create.isPending || !title.trim() || !fileUrl.trim()}>{create.isPending ? "Creating..." : "Create"}</Button></form></CreateDialog></>;
}
