"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function MediaCollectionsPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const query = useQuery({ queryKey: ["media", "collections", workspaceId], queryFn: () => mediaApi.listCollections(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Media Collections" description="Asset grouping metadata." />{!workspaceId ? <EmptyState title="Select a workspace to view collections" /> : <EntityTable columns={["Name", "Description", "Created By"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><span>{item.description ?? "-"}</span><span>{item.created_by_id ?? "-"}</span></EntityTableRow>)}</EntityTable>}</div>; }
