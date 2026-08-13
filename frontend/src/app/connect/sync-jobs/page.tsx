"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { IntegrationStatusBadge } from "@/components/modules/integration-status-badge";
import { connectApi } from "@/services/api/connect-api";
import { useAuthStore } from "@/stores/auth-store";
export default function SyncJobsPage() { const token = useAuthStore((s) => s.accessToken); const query = useQuery({ queryKey: ["connect", "sync-jobs"], queryFn: () => connectApi.listSyncJobs(token ?? "", { limit: 100 }), enabled: Boolean(token), retry: 1 }); return <div className="space-y-4"><PageHeader title="Sync Jobs" description="Integration synchronization lifecycle." /><EntityTable columns={["Integration", "Job Type", "Status"]}>{(query.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span>{item.integration_id}</span><span>{item.job_type}</span><IntegrationStatusBadge value={item.status} /></EntityTableRow>)}</EntityTable></div>; }
