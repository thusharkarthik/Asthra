"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { platformApi } from "@/services/api/platform-api";
import { useAuthStore } from "@/stores/auth-store";

export default function PlatformActivityPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activityQuery = useQuery({
    queryKey: ["platform", "activity"],
    queryFn: () => platformApi.listActivity(accessToken ?? ""),
    enabled: Boolean(accessToken),
    retry: 1
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Cross-module activity from Flow, Docs, Discover, Desk, Collab, and Pulse." />
      <ModuleDashboardCard title="Recent Activity">
        {activityQuery.isLoading ? <LoadingState /> : activityQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load platform activity.</div>
        ) : (activityQuery.data?.items ?? []).length === 0 ? <EmptyState title="No platform activity yet" /> : (
          <div className="space-y-4">
            <ActivityFeed items={(activityQuery.data?.items ?? []).map((item) => ({ id: item.id, title: `${item.actor} ${item.action} ${item.entity.title}`, description: item.entity.description, actor: item.source, timestamp: item.timestamp }))} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(activityQuery.data?.items ?? []).map((item) => (
                <Link key={`${item.id}-entity`} className="rounded-md border p-3 text-sm hover:bg-muted/60" href={item.entity.href}>
                  <div className="font-medium">{item.entity.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.source} · {item.entity.entity_type}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </ModuleDashboardCard>
    </div>
  );
}
