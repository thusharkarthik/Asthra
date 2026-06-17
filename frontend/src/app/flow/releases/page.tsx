"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FlowReleasesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const releasesQuery = useQuery({
    queryKey: ["flow", "releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const releases = releasesQuery.data ?? [];
  const activeReleases = releases.filter((release) => release.status === "active");
  const upcomingReleases = releases.filter((release) => release.status === "planned").slice(0, 3);
  const averageProgress = releases.length ? Math.round(releases.reduce((sum, release) => sum + release.completion_percentage, 0) / releases.length) : 0;

  const createMutation = useMutation({
    mutationFn: () => flowApi.createRelease(accessToken ?? "", {
      project_id: selectedProjectId ?? 0,
      name: name.trim(),
      version: version.trim(),
      description: description.trim() || null,
      target_date: targetDate ? new Date(targetDate).toISOString() : null
    }),
    onSuccess: () => {
      setName("");
      setVersion("");
      setDescription("");
      setTargetDate("");
      addToast({ type: "success", title: "Release created" });
      queryClient.invalidateQueries({ queryKey: ["flow", "releases"] });
    },
    onError: (error) => addToast({ type: "error", title: "Release create failed", message: error instanceof Error ? error.message : "Unable to create release." })
  });
  const activateMutation = useMutation({
    mutationFn: (releaseId: number) => flowApi.activateRelease(accessToken ?? "", releaseId),
    onSuccess: () => {
      addToast({ type: "success", title: "Release activated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });
  const releaseMutation = useMutation({
    mutationFn: (releaseId: number) => flowApi.markReleaseReleased(accessToken ?? "", releaseId),
    onSuccess: () => {
      addToast({ type: "success", title: "Release marked released" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name.trim() && version.trim()) createMutation.mutate();
  };

  return (
    <>
      <PageHeader title="Releases" description="Plan delivery milestones, assign work, and track progress toward target dates." />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to manage releases" /> : releasesQuery.isLoading ? <LoadingState /> : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <ModuleDashboardCard title="Total Releases" value={releases.length} />
              <ModuleDashboardCard title="Active Releases" value={activeReleases.length} />
              <ModuleDashboardCard title="Upcoming" value={upcomingReleases.length} />
              <ModuleDashboardCard title="Avg Progress" value={`${averageProgress}%`} />
            </div>
            <DetailPanel title="Release List">
              <div className="space-y-3">
                {releases.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No releases yet. Create one to plan a delivery milestone.</p> : null}
                {releases.map((release) => (
                  <div key={release.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link className="font-medium text-primary hover:underline" href={`/flow/releases/${release.id}`}>{release.name}</Link>
                        <p className="mt-1 text-sm text-muted-foreground">{release.version} · {release.description || "No release notes yet."}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border px-2 py-0.5">{release.status}</span>
                          <span>{release.completed_work_count}/{release.work_item_count} complete</span>
                          <span>{release.completion_percentage}% progress</span>
                          <span>Target {release.target_date ? new Date(release.target_date).toLocaleDateString() : "not set"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {release.status !== "active" && release.status !== "released" ? <Button size="sm" variant="outline" onClick={() => activateMutation.mutate(release.id)}>Activate</Button> : null}
                        {release.status === "active" ? <Button size="sm" variant="outline" onClick={() => releaseMutation.mutate(release.id)}>Mark Released</Button> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailPanel>
          </div>
          <DetailPanel title="Create Release">
            <form className="space-y-2" onSubmit={handleCreate}>
              <Input aria-label="Release name" placeholder="Release name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input aria-label="Release version" placeholder="Version, for example v1.0.0" value={version} onChange={(event) => setVersion(event.target.value)} />
              <Input aria-label="Release description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
              <Input aria-label="Release target date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              <Button className="w-full" disabled={!name.trim() || !version.trim() || createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Release"}</Button>
            </form>
          </DetailPanel>
        </div>
      )}
    </>
  );
}
