"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, FileText, GitBranch, Lightbulb, Package, Timer } from "lucide-react";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { StatusBadge } from "@/components/modules/status-badge";
import { docsApi } from "@/services/api/docs-api";
import { discoverApi } from "@/services/api/discover-api";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DiscoverDeliveryPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);

  const ideasQuery = useQuery({
    queryKey: ["discover", "delivery", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const pagesQuery = useQuery({
    queryKey: ["discover", "delivery", "docs-pages"],
    queryFn: () => docsApi.listPages(accessToken ?? "", { limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const workItemsQuery = useQuery({
    queryKey: ["discover", "delivery", "work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const sprintsQuery = useQuery({
    queryKey: ["discover", "delivery", "sprints", selectedProjectId],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: selectedProjectId, limit: 20 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const releasesQuery = useQuery({
    queryKey: ["discover", "delivery", "releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 20 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const relationshipsQuery = useQuery({
    queryKey: ["discover", "delivery", "relationships", selectedWorkspaceId],
    queryFn: () => discoverApi.listRelationships(accessToken ?? "", { source_type: "idea", limit: 500 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });

  const ideas = ideasQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const workItems = workItemsQuery.data ?? [];
  const sprints = sprintsQuery.data ?? [];
  const releases = releasesQuery.data ?? [];
  const relationships = relationshipsQuery.data ?? [];
  const convertedIdeas = ideas.filter((idea) => idea.status === "converted_to_work" || idea.status === "approved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery View"
        description="Follow product work from discovery through documentation, execution, sprint planning, and release."
        breadcrumbs={<DiscoverBreadcrumbs items={[{ label: "Delivery View" }]} />}
      />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? (
        <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" />
      ) : ideasQuery.isLoading || pagesQuery.isLoading || workItemsQuery.isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {convertedIdeas.length === 0 ? (
            <DetailPanel title="No delivery lifecycle yet">
              <p className="text-sm text-muted-foreground">Approve or convert an idea, create supporting docs, and create Flow work to see the lifecycle here.</p>
            </DetailPanel>
          ) : (
            convertedIdeas.slice(0, 8).map((idea) => {
              const ideaRelationships = relationships.filter((relationship) => relationship.source_id === String(idea.id));
              const linkedDocs = ideaRelationships.filter((relationship) => relationship.target_type === "doc_page");
              const linkedWork = ideaRelationships.filter((relationship) => relationship.target_type === "work_item");
              const linkedSprints = ideaRelationships.filter((relationship) => relationship.target_type === "sprint");
              const linkedReleases = ideaRelationships.filter((relationship) => relationship.target_type === "release");
              const fallbackDocs = pages.filter((page) => `${page.title} ${page.content}`.toLowerCase().includes(idea.title.toLowerCase().split(" ")[0] ?? ""));
              const fallbackWork = workItems.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(idea.title.toLowerCase().split(" ")[0] ?? ""));
              const relatedDocs = linkedDocs.length > 0 ? linkedDocs : fallbackDocs;
              const relatedWork = linkedWork.length > 0 ? linkedWork : fallbackWork;
              const relatedSprintIds = new Set(fallbackWork.map((item) => item.sprint_id).filter(Boolean));
              const relatedReleaseIds = new Set(fallbackWork.map((item) => item.release_id).filter(Boolean));
              return (
                <section key={idea.id} className="rounded-lg border bg-card p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link className="text-base font-semibold text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>{idea.title}</Link>
                      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{idea.business_value ?? idea.description}</p>
                    </div>
                    <StatusBadge value={idea.status} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-5">
                    <LifecycleColumn icon={<Lightbulb className="h-4 w-4" />} title="Idea" count={1} items={[idea.title]} />
                    <LifecycleColumn icon={<FileText className="h-4 w-4" />} title="Documents" count={relatedDocs.length} items={relatedDocs.slice(0, 3).map((page) => page.title ?? `Document ${"target_id" in page ? page.target_id : page.id}`)} />
                    <LifecycleColumn icon={<GitBranch className="h-4 w-4" />} title="Work Items" count={relatedWork.length} items={relatedWork.slice(0, 3).map((item) => item.title ?? `Work item ${"target_id" in item ? item.target_id : item.id}`)} />
                    <LifecycleColumn icon={<Timer className="h-4 w-4" />} title="Sprint" count={linkedSprints.length || relatedSprintIds.size} items={linkedSprints.length > 0 ? linkedSprints.map((sprint) => sprint.title ?? `Sprint ${sprint.target_id}`) : sprints.filter((sprint) => relatedSprintIds.has(sprint.id)).map((sprint) => sprint.name)} />
                    <LifecycleColumn icon={<Package className="h-4 w-4" />} title="Release" count={linkedReleases.length || relatedReleaseIds.size} items={linkedReleases.length > 0 ? linkedReleases.map((release) => release.title ?? `Release ${release.target_id}`) : releases.filter((release) => relatedReleaseIds.has(release.id)).map((release) => release.name)} />
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function LifecycleColumn({ icon, title, count, items }: { icon: ReactNode; title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{count}</span>
      </div>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">Not linked yet</p> : (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {title !== "Release" ? <ArrowDown className="mx-auto mt-3 h-4 w-4 text-muted-foreground md:hidden" /> : null}
    </div>
  );
}
