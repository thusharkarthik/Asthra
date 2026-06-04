"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { MediaTypeBadge } from "@/components/modules/media-type-badge";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { ModuleStatsGrid } from "@/components/modules/module-stats-grid";
import { ProcessingStatusBadge } from "@/components/modules/processing-status-badge";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function MediaPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const assets = useQuery({ queryKey: ["media", "assets", workspaceId], queryFn: () => mediaApi.listAssets(token ?? "", { workspace_id: workspaceId, limit: 5 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const collections = useQuery({ queryKey: ["media", "collections", workspaceId], queryFn: () => mediaApi.listCollections(token ?? "", { workspace_id: workspaceId, limit: 50 }), enabled: Boolean(token && workspaceId), retry: 1 });
  const jobs = useQuery({ queryKey: ["media", "jobs"], queryFn: () => mediaApi.listProcessingJobs(token ?? "", { limit: 50 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Media" description="Multimodal metadata layer for assets, transcripts, annotations, tags, and processing jobs." />{!workspaceId ? <EmptyState title="Select a workspace to load Media" /> : <><ModuleStatsGrid stats={[{ title: "Assets", value: (assets.data ?? []).length, description: "Tracked media metadata" }, { title: "Collections", value: (collections.data ?? []).length, description: "Organized asset groups" }, { title: "Processing Jobs", value: (jobs.data ?? []).length, description: "OCR/transcription placeholders" }]} /><div className="grid gap-4 lg:grid-cols-2"><ModuleDashboardCard title="Recent Assets">{(assets.data ?? []).length === 0 ? <EmptyState title="No assets yet" /> : <div className="space-y-3">{(assets.data ?? []).map((asset) => <Link key={asset.id} className="block rounded-md border p-3 hover:bg-muted/60" href={`/media/assets/${asset.id}`}><div className="font-medium">{asset.title}</div><div className="mt-2"><MediaTypeBadge value={asset.asset_type} /></div></Link>)}</div>}</ModuleDashboardCard><ModuleDashboardCard title="Processing Jobs">{(jobs.data ?? []).length === 0 ? <EmptyState title="No processing jobs yet" /> : <div className="space-y-3">{(jobs.data ?? []).map((job) => <div key={job.id} className="rounded-md border p-3"><div className="font-medium">{job.job_type}</div><div className="mt-2"><ProcessingStatusBadge value={job.status} /></div></div>)}</div>}</ModuleDashboardCard></div></>}</div>;
}
