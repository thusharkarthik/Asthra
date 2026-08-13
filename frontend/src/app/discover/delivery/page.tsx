"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, CheckCircle2, FileText, GitBranch, Lightbulb, ListChecks } from "lucide-react";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailPanel } from "@/components/modules/detail-panel";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function DiscoverDeliveryPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);

  const pipelineQuery = useQuery({
    queryKey: ["discover", "delivery", selectedWorkspaceId, selectedProjectId],
    queryFn: () => discoverApi.getDeliveryPipeline(accessToken ?? "", { workspace_id: selectedWorkspaceId, project_id: selectedProjectId }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });

  const pipeline = pipelineQuery.data;

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
      ) : pipelineQuery.isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {!pipeline || pipeline.counts.ideas === 0 ? (
            <DetailPanel title="No delivery lifecycle yet">
              <p className="text-sm text-muted-foreground">Approve or convert an idea, create supporting docs, and create Flow work to see the lifecycle here.</p>
            </DetailPanel>
          ) : (
            <section className="grid gap-3 xl:grid-cols-6">
              <LifecycleColumn icon={<Lightbulb className="h-4 w-4" />} title="Ideas" count={pipeline.counts.ideas} items={pipeline.ideas} hrefPrefix="/discover/ideas" />
              <LifecycleColumn icon={<FileText className="h-4 w-4" />} title="Specifications" count={pipeline.counts.specifications} items={pipeline.specifications} hrefPrefix="/docs/pages" />
              <LifecycleColumn icon={<GitBranch className="h-4 w-4" />} title="Epics" count={pipeline.counts.epics} items={pipeline.epics} hrefPrefix="/flow/work-items" />
              <LifecycleColumn icon={<ListChecks className="h-4 w-4" />} title="Stories" count={pipeline.counts.stories} items={pipeline.stories} hrefPrefix="/flow/work-items" />
              <LifecycleColumn icon={<ListChecks className="h-4 w-4" />} title="Tasks" count={pipeline.counts.tasks} items={pipeline.tasks} hrefPrefix="/flow/work-items" />
              <LifecycleColumn icon={<CheckCircle2 className="h-4 w-4" />} title="Completed" count={pipeline.counts.completed} items={pipeline.completed} hrefPrefix="/discover/ideas" />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LifecycleColumn({ icon, title, count, items, hrefPrefix }: { icon: ReactNode; title: string; count: number; items: Array<Record<string, unknown>>; hrefPrefix: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{count}</span>
      </div>
      {items.length === 0 ? <p className="text-xs text-muted-foreground">Not linked yet</p> : (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {items.slice(0, 10).map((item) => (
            <li key={`${item.id}-${item.title}`}>
              <Link className="text-primary hover:underline" href={`${hrefPrefix}/${item.id}`}>{String(item.title ?? `Record ${item.id}`)}</Link>
              {item.status ? <div className="text-muted-foreground">{String(item.status)}</div> : null}
            </li>
          ))}
        </ul>
      )}
      {title !== "Completed" ? <ArrowDown className="mx-auto mt-3 h-4 w-4 text-muted-foreground xl:hidden" /> : null}
    </div>
  );
}
