"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFeedbackDialog } from "@/components/discover/discover-create-dialogs";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { DISCOVER_SENTIMENTS, discoverDate } from "@/components/discover/discover-utils";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function FeedbackPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("all");

  const feedbackQuery = useQuery({
    queryKey: ["discover", "feedback", selectedWorkspaceId],
    queryFn: () => discoverApi.listFeedback(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const feedback = feedbackQuery.data ?? [];
  const filteredFeedback = useMemo(() => {
    const term = search.trim().toLowerCase();
    return feedback.filter((item) => {
      const matchesSearch = !term || `${item.content} ${item.source} ${item.author ?? ""}`.toLowerCase().includes(term);
      const matchesSentiment = sentiment === "all" || item.sentiment === sentiment;
      return matchesSearch && matchesSentiment;
    });
  }, [feedback, search, sentiment]);

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" description="Collect customer evidence, research notes, and stakeholder signals." actions={<Button onClick={() => setOpen(true)}>Add feedback</Button>} />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Search feedback" className="pl-9" placeholder="Search feedback, source, or author" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <Select aria-label="Filter feedback by sentiment" value={sentiment} onChange={(event) => setSentiment(event.target.value)}>
              <option value="all">All sentiment</option>
              {DISCOVER_SENTIMENTS.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
          </div>
          {feedbackQuery.isLoading ? <LoadingState /> : feedback.length === 0 ? <EmptyState title="No feedback captured yet" /> : filteredFeedback.length === 0 ? <EmptyState title="No feedback matches the current filters" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredFeedback.map((item) => (
                <ModuleDashboardCard key={item.id} title={item.source}>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{item.author ?? "Anonymous"}</span>
                    <span>{item.sentiment ?? "neutral"}</span>
                    <span>{discoverDate(item.created_at)}</span>
                  </div>
                </ModuleDashboardCard>
              ))}
            </div>
          )}
        </div>
      )}
      <CreateFeedbackDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
