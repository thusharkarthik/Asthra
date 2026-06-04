"use client";

import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function BoardsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const boardsQuery = useQuery({ queryKey: ["flow", "boards"], queryFn: () => flowApi.listBoards(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const workItemsQuery = useQuery({
    queryKey: ["flow", "board-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedProjectId)
  });

  const columns = [
    { id: 1, name: "Todo" },
    { id: 2, name: "In Progress" },
    { id: 3, name: "Review" },
    { id: 4, name: "Done" }
  ];

  return (
    <>
      <PageHeader title="Boards" description="Simple Kanban view for selected project work items." />
      {!selectedProjectId ? <EmptyState title="Select a project to view boards" /> : (
        <div className="space-y-4">
          <ModuleDashboardCard title="Boards" value={(boardsQuery.data ?? []).length}>
            <div className="text-sm text-muted-foreground">Board column management is available through Flow API.</div>
          </ModuleDashboardCard>
          <div className="grid gap-4 md:grid-cols-4">
            {columns.map((column) => (
              <section key={column.id} className="min-h-80 rounded-lg border bg-card">
                <div className="border-b px-3 py-2 text-sm font-semibold">{column.name}</div>
                <div className="space-y-2 p-3">
                  {(workItemsQuery.data ?? []).filter((item) => item.status_id === column.id).map((item) => (
                    <div key={item.id} className="rounded-md border bg-background p-3 text-sm">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-2"><StatusBadge value={item.status_id} /></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
