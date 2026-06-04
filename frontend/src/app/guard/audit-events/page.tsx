"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { AuditEventTable } from "@/components/modules/audit-event-table";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function AuditEventsPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const query = useQuery({ queryKey: ["guard", "audits", workspaceId], queryFn: () => guardApi.listAuditEvents(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Audit Events" description="Security and governance audit trail." />{!workspaceId ? <EmptyState title="Select a workspace to view audit events" /> : <AuditEventTable events={query.data ?? []} />}</div>; }
