"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { mediaNavItems } from "@/components/modules/module-navs";
import { ModuleSubnav, RelationshipPlaceholder } from "@/components/modules/product-experience";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MediaTranscriptsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const assets = useQuery({ queryKey: ["media", "assets", workspaceId], queryFn: () => mediaApi.listAssets(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Transcripts" description="Transcript readiness for audio, video, and document assets." /><ModuleSubnav items={mediaNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view transcripts" /> : assets.isLoading ? <LoadingState /> : (assets.data ?? []).length === 0 ? <EmptyState title="No assets available for transcripts" /> : <div className="grid gap-3 md:grid-cols-2">{(assets.data ?? []).map((asset) => <Link key={asset.id} className="rounded-md border p-3 hover:bg-muted/60" href={`/media/assets/${asset.id}`}><div className="font-medium">{asset.title}</div><p className="mt-1 text-sm text-muted-foreground">Open asset detail to view transcripts.</p></Link>)}</div>}<RelationshipPlaceholder title="Transcription placeholder" description="Future processing jobs will create transcripts from uploaded media without changing this navigation model." /></div>;
}
