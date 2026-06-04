"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ActivityFeed } from "@/components/modules/activity-feed";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { insightsNavItems } from "@/components/modules/module-navs";
import { AiPlaceholderPanel, ModuleSubnav } from "@/components/modules/product-experience";
import { insightsApi } from "@/services/api/insights-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function InsightEventsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const pathname = usePathname();
  const events = useQuery({ queryKey: ["insights", "events", workspaceId], queryFn: () => insightsApi.listInsightEvents(token ?? "", { workspace_id: workspaceId, limit: 100 }), enabled: Boolean(token && workspaceId), retry: 1 });
  return <div className="space-y-6"><PageHeader title="Insight Events" description="Operational signals, risks, and analytics events across the workspace." /><ModuleSubnav items={insightsNavItems} activePath={pathname} />{!workspaceId ? <EmptyState title="Select a workspace to view insight events" /> : events.isLoading ? <LoadingState /> : (events.data ?? []).length === 0 ? <EmptyState title="No insight events yet" /> : <ActivityFeed items={(events.data ?? []).map((event) => ({ id: event.id, title: event.title, description: event.description, actor: event.severity, timestamp: event.created_at }))} />}<AiPlaceholderPanel title="AI insight suggestions">Future AI can summarize trends, forecast risk, and generate executive summaries from insight events.</AiPlaceholderPanel></div>;
}
