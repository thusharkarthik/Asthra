"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlowHeaderActions } from "@/components/flow/flow-header-actions";
import { FlowSetupState } from "@/components/flow/flow-setup-state";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_STATUS_OPTIONS } from "@/components/flow/flow-utils";
import { WorkItemCreateDialog } from "@/components/flow/work-item-create-dialog";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function BoardsPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const organizations = useWorkspaceStore((state) => state.organizations);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useWorkspaceStore((state) => state.projects);
  const hasOrganization = Boolean(selectedOrganizationId) || organizations.length > 0;
  const hasWorkspace = Boolean(selectedWorkspaceId) || workspaces.length > 0;
  const hasProject = Boolean(selectedProjectId) || projects.length > 0;

  const workItemsQuery = useQuery({
    queryKey: ["flow", "board-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId),
    retry: 1
  });

  return (
    <>
      <PageHeader title="Boards" description="Kanban-style planning for selected project work." actions={<FlowHeaderActions onCreate={() => setCreateOpen(true)} />} />
      <FlowSubnav />
      {!hasOrganization || !hasWorkspace || !hasProject ? <FlowSetupState hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} hasProject={hasProject} /> : (
        <div className="space-y-4">
          {workItemsQuery.isLoading ? <LoadingState /> : workItemsQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load board items. <Button size="sm" variant="outline" onClick={() => workItemsQuery.refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4">
              {FLOW_STATUS_OPTIONS.map((column) => {
                const columnItems = (workItemsQuery.data ?? []).filter((item) => String(item.status_id ?? "1") === column.value);
                return (
                  <section key={column.value} className="min-h-96 rounded-lg border bg-card">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <span className="text-sm font-semibold">{column.label}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{columnItems.length}</span>
                    </div>
                    <div className="space-y-2 p-3">
                      {columnItems.map((item) => (
                        <Link key={item.id} href={`/flow/work-items/${item.id}`} className="block rounded-md border bg-background p-3 text-sm hover:bg-muted">
                          <div className="font-medium">{item.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusBadge value={item.status_id} />
                            <PriorityBadge value={item.priority_id} />
                          </div>
                        </Link>
                      ))}
                      {columnItems.length === 0 ? <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No items in {column.label}.</div> : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
      <WorkItemCreateDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
