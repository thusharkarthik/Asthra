"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_EFFORT_SIZE_OPTIONS, FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS, effortLabel, itemLevelLabel, planningLabel } from "@/components/flow/flow-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function BacklogPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const workItemsQuery = useQuery({
    queryKey: ["flow", "backlog", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, status_id: 1, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const groomingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof flowApi.updateWorkItem>[2] }) => flowApi.updateWorkItem(accessToken ?? "", id, payload),
    onSuccess: () => {
      addToast({ type: "success", title: "Backlog item updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Backlog update failed", message: error instanceof Error ? error.message : "Unable to update backlog item." })
  });

  return (
    <>
      <PageHeader title="Backlog" description="Unstarted work ready for grooming and planning." actions={<FlowHeaderActions />} />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view the backlog" /> : workItemsQuery.isLoading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No backlog items yet" /> : (
        <EntityTable columns={["Title", "Level", "Priority", "Effort", "Business Value", "Risk", "Parent Work", "Grooming"]}>
          {items.map((item) => (
            <EntityTableRow key={item.id} columns={8}>
              <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
              <span>{itemLevelLabel(item.item_level)}</span>
              <PriorityBadge value={item.priority_id} />
              <span>{effortLabel(item.effort_size, item.effort_score)}</span>
              <span>{planningLabel(item.business_value)}</span>
              <span>{planningLabel(item.risk_level)}</span>
              <span>{item.parent_id ? `Work item #${item.parent_id}` : "No parent"}</span>
              <div className="grid gap-2">
                <Select aria-label={`Set priority for ${item.title}`} value="" onChange={(event) => groomingMutation.mutate({ id: item.id, payload: { priority_name: event.target.value } })}>
                  <option value="">Set priority</option>
                  {FLOW_PRIORITY_OPTIONS.map((priority) => <option key={priority.name} value={priority.name}>{priority.label}</option>)}
                </Select>
                <Select aria-label={`Set effort for ${item.title}`} value="" onChange={(event) => groomingMutation.mutate({ id: item.id, payload: { effort_size: event.target.value } })}>
                  <option value="">Set effort</option>
                  {FLOW_EFFORT_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </Select>
                <Select aria-label={`Move backlog item ${item.title}`} value="" onChange={(event) => groomingMutation.mutate({ id: item.id, payload: { status_name: event.target.value } })}>
                  <option value="">Move status</option>
                  {FLOW_STATUS_OPTIONS.map((status) => <option key={status.name} value={status.name}>{status.label}</option>)}
                </Select>
              </div>
            </EntityTableRow>
          ))}
        </EntityTable>
      )}
    </>
  );
}
