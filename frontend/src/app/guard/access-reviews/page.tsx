"use client";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ComplianceStatusBadge } from "@/components/modules/compliance-status-badge";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { guardApi } from "@/services/api/guard-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
export default function AccessReviewsPage() { const token = useAuthStore((s) => s.accessToken); const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId); const reviews = useQuery({ queryKey: ["guard", "access-reviews", workspaceId], queryFn: () => guardApi.listAccessReviews(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); const exceptions = useQuery({ queryKey: ["guard", "exceptions", workspaceId], queryFn: () => guardApi.listSecurityExceptions(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 }); return <div className="space-y-4"><PageHeader title="Access Reviews" description="Access reviews and security exception visibility." />{!workspaceId ? <EmptyState title="Select a workspace to view access reviews" /> : <><EntityTable columns={["Review", "Status", "Reviewer"]}>{(reviews.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.name}</span><ComplianceStatusBadge value={item.status} /><span>{item.reviewer_id ?? "-"}</span></EntityTableRow>)}</EntityTable><EntityTable columns={["Exception", "Status", "Requester"]}>{(exceptions.data ?? []).map((item) => <EntityTableRow key={item.id} columns={3}><span className="font-medium">{item.title}</span><ComplianceStatusBadge value={item.status} /><span>{item.requested_by_id ?? "-"}</span></EntityTableRow>)}</EntityTable></>}</div>; }
