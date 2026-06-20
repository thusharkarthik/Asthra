"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFeatureRequestDialog, CreateFeedbackDialog, CreateIdeaDialog, CreateRoadmapItemDialog } from "@/components/discover/discover-create-dialogs";
import { DiscoverBreadcrumbs } from "@/components/discover/discover-breadcrumbs";
import { DiscoverHeaderActions } from "@/components/discover/discover-header-actions";
import { DiscoverSetupState } from "@/components/discover/discover-setup-state";
import { DiscoverSubnav } from "@/components/discover/discover-subnav";
import { DISCOVER_IDEA_STATUSES, discoverDate, isHighImpactIdea } from "@/components/discover/discover-utils";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { StatusBadge } from "@/components/modules/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { discoverApi } from "@/services/api/discover-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function IdeasPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [project, setProject] = useState("all");

  const ideasQuery = useQuery({
    queryKey: ["discover", "ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId),
    retry: 1
  });

  const ideas = ideasQuery.data ?? [];
  const filteredIdeas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return ideas.filter((idea) => {
      const matchesSearch = !normalizedSearch || `${idea.title} ${idea.description} ${idea.problem_statement ?? ""} ${idea.target_users ?? ""}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === "all" || idea.status === status;
      const matchesProject = project === "all" || (project === "selected" ? idea.project_id === selectedProjectId : !idea.project_id);
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [ideas, project, search, selectedProjectId, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Capture opportunities, clarify the problem, and move promising ideas toward validation."
        breadcrumbs={<DiscoverBreadcrumbs items={[{ label: "Ideas" }]} />}
        actions={
          <DiscoverHeaderActions
            onCreateIdea={() => setIdeaOpen(true)}
            onCreateFeatureRequest={() => setRequestOpen(true)}
            onAddFeedback={() => setFeedbackOpen(true)}
            onCreateRoadmapItem={() => setRoadmapOpen(true)}
          />
        }
      />
      <DiscoverSubnav />
      {!selectedOrganizationId || !selectedWorkspaceId ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="context" /> : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_160px_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Search ideas" className="pl-9" placeholder="Search ideas, problems, or users" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <Select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {DISCOVER_IDEA_STATUSES.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
            </Select>
            <Select aria-label="Filter by project" value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="all">All projects</option>
              <option value="selected">Selected project</option>
              <option value="workspace">Workspace only</option>
            </Select>
          </div>
          {ideasQuery.isLoading ? <LoadingState /> : ideasQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to load ideas.</div>
          ) : ideas.length === 0 ? <DiscoverSetupState hasOrganization={Boolean(selectedOrganizationId)} hasWorkspace={Boolean(selectedWorkspaceId)} mode="ideas" /> : filteredIdeas.length === 0 ? <EmptyState title="No ideas match the current filters" /> : (
            <EntityTable columns={["Title", "Status", "Problem", "Target Users", "Impact", "Updated"]}>
              {filteredIdeas.map((idea) => (
                <EntityTableRow key={idea.id} columns={6}>
                  <Link className="font-medium text-primary hover:underline" href={`/discover/ideas/${idea.id}`}>{idea.title}</Link>
                  <StatusBadge value={idea.status} />
                  <span className="line-clamp-2 text-muted-foreground">{idea.problem_statement ?? idea.description}</span>
                  <span>{idea.target_users ?? "Not defined"}</span>
                  <span>{isHighImpactIdea(idea) ? "High" : "Unscored"}</span>
                  <span className="text-muted-foreground">{discoverDate(idea.updated_at ?? idea.created_at)}</span>
                </EntityTableRow>
              ))}
            </EntityTable>
          )}
        </div>
      )}
      <CreateIdeaDialog open={ideaOpen} onOpenChange={setIdeaOpen} />
      <CreateFeatureRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <CreateFeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <CreateRoadmapItemDialog open={roadmapOpen} onOpenChange={setRoadmapOpen} />
    </div>
  );
}
