"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { needsValidation } from "@/components/discover/discover-utils";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { StatusBadge } from "@/components/modules/status-badge";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function ValidationPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const validationIdeas = (ideasQuery.data ?? []).filter(needsValidation);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validation"
        description="Focus on ideas that still need evidence, research, and customer proof."
        breadcrumbs={<DiscoverBreadcrumbs items={[{ label: "Validation" }]} />}
      />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : ideasQuery.isLoading ? <LoadingState /> : validationIdeas.length === 0 ? <EmptyState title="No ideas currently need validation" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {validationIdeas.map((idea) => (
            <ModuleDashboardCard key={idea.id} title={idea.title}>
              <p className="line-clamp-3 text-sm text-muted-foreground">{idea.problem_statement ?? idea.description}</p>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-medium">{idea.confidence_score ?? "Unscored"}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Impact</div>
                  <div className="font-medium">{idea.impact_score ?? "Unscored"}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Decision</div>
                  <div className="font-medium capitalize">{idea.status.replace("_", " ")}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{idea.business_value ?? "Validation notes and business value have not been captured yet."}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusBadge value={idea.status} />
                <Link className="text-sm text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>Review idea</Link>
              </div>
            </ModuleDashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}
