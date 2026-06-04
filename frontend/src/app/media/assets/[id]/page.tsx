"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConfigJsonViewer } from "@/components/modules/config-json-viewer";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { MediaTypeBadge } from "@/components/modules/media-type-badge";
import { ProcessingStatusBadge } from "@/components/modules/processing-status-badge";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";

export default function MediaAssetDetailPage() {
  const id = useParams<{ id: string }>().id;
  const token = useAuthStore((s) => s.accessToken);
  const asset = useQuery({ queryKey: ["media", "asset", id], queryFn: () => mediaApi.getAsset(token ?? "", id), enabled: Boolean(token && id) });
  const transcripts = useQuery({ queryKey: ["media", "transcripts", id], queryFn: () => mediaApi.listTranscripts(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const annotations = useQuery({ queryKey: ["media", "annotations", id], queryFn: () => mediaApi.listAnnotations(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const tags = useQuery({ queryKey: ["media", "tags", id], queryFn: () => mediaApi.listAssetTags(token ?? "", id), enabled: Boolean(token && id), retry: 1 });
  const jobs = useQuery({ queryKey: ["media", "jobs", id], queryFn: () => mediaApi.listProcessingJobs(token ?? "", { asset_id: Number(id), limit: 20 }), enabled: Boolean(token && id), retry: 1 });
  if (asset.isLoading) return <DetailPanel title="Asset"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!asset.data) return <DetailPanel title="Asset"><div className="text-sm text-destructive">Unable to load asset.</div></DetailPanel>;
  return <div className="space-y-4"><EntityDetailHeader title={asset.data.title} description={asset.data.description ?? asset.data.file_url} meta={<MediaTypeBadge value={asset.data.asset_type} />} /><div className="grid gap-4 lg:grid-cols-2"><DetailPanel title="Transcripts"><ConfigJsonViewer value={transcripts.data ?? []} /></DetailPanel><DetailPanel title="Annotations"><ConfigJsonViewer value={annotations.data ?? []} /></DetailPanel><DetailPanel title="Tags"><div className="flex flex-wrap gap-2">{(tags.data ?? []).map((tag) => <span key={tag.id} className="rounded bg-muted px-2 py-1 text-xs">{tag.name}</span>)}</div></DetailPanel><DetailPanel title="Processing Jobs"><div className="space-y-2">{(jobs.data ?? []).map((job) => <div key={job.id} className="rounded-md border p-2 text-sm"><span className="mr-2">{job.job_type}</span><ProcessingStatusBadge value={job.status} /></div>)}</div></DetailPanel></div></div>;
}
