"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ProcessingStatusBadge } from "@/components/modules/processing-status-badge";
import { mediaApi } from "@/services/api/media-api";
import { useAuthStore } from "@/stores/auth-store";
export default function MediaProcessingJobsPage() { const token = useAuthStore((s) => s.accessToken); const query = useQuery({ queryKey: ["media", "processing-jobs"], queryFn: () => mediaApi.listProcessingJobs(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 }); return <div className="space-y-4"><PageHeader title="Processing Jobs" description="OCR, transcription, and multimodal processing placeholders." /><EntityTable columns={["Asset", "Job Type", "Status"]}>{(query.data ?? []).map((job) => <EntityTableRow key={job.id} columns={3}><span>{job.asset_id}</span><span>{job.job_type}</span><ProcessingStatusBadge value={job.status} /></EntityTableRow>)}</EntityTable></div>; }
