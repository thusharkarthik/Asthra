"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { isBlockedWorkItem, isHighRiskWorkItem, workflowStatusLabelFor } from "@/components/flow/flow-utils";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

export default function FlowReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const releaseId = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const releaseQuery = useQuery({ queryKey: ["flow", "release", releaseId], queryFn: () => flowApi.getRelease(accessToken ?? "", releaseId), enabled: Boolean(accessToken && releaseId), retry: 1 });
  const release = releaseQuery.data;
  const workItemsQuery = useQuery({
    queryKey: ["flow", "release-work-items", releaseId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { release_id: Number(releaseId), limit: 100 }),
    enabled: Boolean(accessToken && releaseId),
    retry: 1
  });
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", release?.project_id],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", release?.project_id ?? 0),
    enabled: Boolean(accessToken && release?.project_id),
    retry: 1
  });
  const items = workItemsQuery.data ?? [];
  const remaining = Math.max((release?.work_item_count ?? 0) - (release?.completed_work_count ?? 0), 0);

  const activateMutation = useMutation({
    mutationFn: () => flowApi.activateRelease(accessToken ?? "", releaseId),
    onSuccess: () => {
      addToast({ type: "success", title: "Release activated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });
  const releaseMutation = useMutation({
    mutationFn: () => flowApi.markReleaseReleased(accessToken ?? "", releaseId),
    onSuccess: () => {
      addToast({ type: "success", title: "Release marked released" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });

  if (releaseQuery.isLoading || !release) {
    return (
      <>
        <FlowSubnav />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={release.name}
        description={`${release.version} · ${release.description || "Release delivery plan."}`}
        actions={<div className="flex gap-2">
          {release.status !== "active" && release.status !== "released" ? <Button variant="outline" onClick={() => activateMutation.mutate()}>Activate Release</Button> : null}
          {release.status === "active" ? <Button variant="outline" onClick={() => releaseMutation.mutate()}>Mark Released</Button> : null}
          <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/releases">Back to Releases</Link>
        </div>}
      />
      <FlowSubnav />
      <div className="grid gap-4 md:grid-cols-4">
        <ModuleDashboardCard title="Progress" value={`${release.completion_percentage}%`} />
        <ModuleDashboardCard title="Completed" value={release.completed_work_count} />
        <ModuleDashboardCard title="Remaining" value={remaining} />
        <ModuleDashboardCard title="Blocked" value={items.filter(isBlockedWorkItem).length} />
        <ModuleDashboardCard title="High Risk" value={items.filter(isHighRiskWorkItem).length} />
      </div>
      <DetailPanel title="Release Overview">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div><div className="text-muted-foreground">Status</div><div className="font-medium">{release.status}</div></div>
          <div><div className="text-muted-foreground">Target</div><div className="font-medium">{release.target_date ? new Date(release.target_date).toLocaleDateString() : "Not set"}</div></div>
          <div><div className="text-muted-foreground">Actual Release</div><div className="font-medium">{release.actual_release_date ? new Date(release.actual_release_date).toLocaleDateString() : "Not released"}</div></div>
          <div><div className="text-muted-foreground">Assigned Work</div><div className="font-medium">{release.work_item_count}</div></div>
        </div>
      </DetailPanel>
      <DetailPanel title="Assigned Work">
        {items.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No work assigned to this release yet.</p> : (
          <EntityTable columns={["Title", "Status", "Priority", "Risk"]}>
            {items.map((item) => (
              <EntityTableRow key={item.id} columns={4}>
                <Link className="font-medium text-primary hover:underline" href={`/flow/work-items/${item.id}`}>{item.title}</Link>
                <StatusBadge value={workflowStatusLabelFor(workflowQuery.data, item.status_id)} />
                <PriorityBadge value={item.priority_id} />
                <span>{item.risk_level ?? "not set"}</span>
              </EntityTableRow>
            ))}
          </EntityTable>
        )}
      </DetailPanel>
    </>
  );
}
