"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function BacklogPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const workItemsQuery = useQuery({
    queryKey: ["flow", "backlog", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, status_id: 1, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];

  return (
    <>
      <PageHeader title="Backlog" description="Unstarted work ready for grooming and planning." actions={<FlowHeaderActions />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view the backlog" /> : workItemsQuery.isLoading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No backlog items yet" /> : (
        <EntityTable columns={["Title", "Status", "Priority", "Assignee"]}>
          {items.map((item) => (
            <EntityTableRow key={item.id} columns={4}>
              <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
              <StatusBadge value={item.status_id} />
              <PriorityBadge value={item.priority_id} />
              <span>{item.assignee_id ?? "Unassigned"}</span>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
    </>
  );
}
