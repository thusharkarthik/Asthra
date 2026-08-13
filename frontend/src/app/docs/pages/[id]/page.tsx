"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { DocsBackLink, DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { DocsSubnav } from "@/components/docs/docs-subnav";
import { docsDate } from "@/components/docs/docs-utils";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
import { docsApi } from "@/services/api/docs-api";
import { discoverApi } from "@/services/api/discover-api";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PageDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const addViewed = useRecentItemsStore((state) => state.addViewed);
  const [isEditing, setEditing] = useState(false);
  const pageQuery = useQuery({ queryKey: ["docs", "page", id], queryFn: () => docsApi.getPage(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const spacesQuery = useQuery({ queryKey: ["docs", "spaces"], queryFn: () => docsApi.listSpaces(accessToken ?? ""), enabled: Boolean(accessToken), retry: 1 });
  const commentsQuery = useQuery({ queryKey: ["docs", "comments", id], queryFn: () => docsApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const versionsQuery = useQuery({ queryKey: ["docs", "page-versions", id], queryFn: () => docsApi.listPageVersions(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const ideasQuery = useQuery({
    queryKey: ["docs", "page-ideas", selectedWorkspaceId],
    queryFn: () => discoverApi.listIdeas(accessToken ?? "", { workspace_id: selectedWorkspaceId, limit: 100 }),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });
  const workItemsQuery = useQuery({
    queryKey: ["docs", "page-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const releasesQuery = useQuery({
    queryKey: ["docs", "page-releases", selectedProjectId],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: selectedProjectId, limit: 50 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const sourceRelationshipsQuery = useQuery({
    queryKey: ["docs", "page-relationships-source", id],
    queryFn: () => discoverApi.listRelationships(accessToken ?? "", { source_type: "doc_page", source_id: id, limit: 100 }),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const targetRelationshipsQuery = useQuery({
    queryKey: ["docs", "page-relationships-target", id],
    queryFn: () => discoverApi.listRelationships(accessToken ?? "", { target_type: "doc_page", target_id: id, limit: 100 }),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const pageFlowLinksQuery = useQuery({
    queryKey: ["docs", "page-flow-links", id],
    queryFn: () => docsApi.listPageFlowWorkItems(accessToken ?? "", id),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [parentPageId, setParentPageId] = useState("");
  const [showFlowLinkDraft, setShowFlowLinkDraft] = useState(false);
  const [linkMode, setLinkMode] = useState<"idea" | "work_item" | "release" | null>(null);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkTargetTitle, setLinkTargetTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const updateMutation = useMutation({
    mutationFn: () => docsApi.updatePage(accessToken ?? "", id, { title, content, status, parent_page_id: parentPageId ? Number(parentPageId) : null, updated_by_id: currentUser?.id }),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["docs", "page", id] });
    }
  });
  const commentMutation = useMutation({
    mutationFn: (comment: string) => docsApi.createComment(accessToken ?? "", id, { content: comment, user_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs", "comments", id] })
  });
  const publishMutation = useMutation({
    mutationFn: () => docsApi.publishPage(accessToken ?? "", id, currentUser?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs", "page", id] })
  });
  const archiveMutation = useMutation({
    mutationFn: () => docsApi.archivePage(accessToken ?? "", id, currentUser?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs", "page", id] })
  });
  const linkMutation = useMutation({
    mutationFn: () => {
      if (!linkMode) throw new Error("Select a link type.");
      return discoverApi.createRelationship(accessToken ?? "", {
        source_type: "doc_page",
        source_id: String(id),
        target_type: linkMode,
        target_id: linkTargetId,
        relationship_type: linkMode === "idea" ? "references" : linkMode === "work_item" ? "executes" : "ships_in",
        title: linkTargetTitle || `${linkMode.replace("_", " ")} ${linkTargetId}`,
        label: `Linked ${linkMode.replace("_", " ")}`
      });
    },
    onSuccess: async () => {
      setLinkMode(null);
      setLinkTargetId("");
      setLinkTargetTitle("");
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-relationships-source", id] });
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-relationships-target", id] });
    }
  });
  const unlinkMutation = useMutation({
    mutationFn: (relationshipId: number) => discoverApi.deleteRelationship(accessToken ?? "", relationshipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-relationships-source", id] });
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-relationships-target", id] });
    }
  });
  const createFlowWorkMutation = useMutation({
    mutationFn: (work_item_type: "epic" | "story" | "task") => {
      if (!selectedProjectId) throw new Error("Select a project before creating Flow work from Docs.");
      return docsApi.createPageFlowWorkItem(accessToken ?? "", id, {
        project_id: selectedProjectId,
        work_item_type,
        reporter_id: currentUser?.id,
        title: `${work_item_type === "epic" ? "Epic" : work_item_type === "story" ? "Story" : "Task"}: ${page?.title ?? "Docs page"}`
      });
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Unable to create Flow work item."),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-flow-links", id] });
      await queryClient.invalidateQueries({ queryKey: ["docs", "page-relationships-source", id] });
      await queryClient.invalidateQueries({ queryKey: ["flow"] });
      await queryClient.invalidateQueries({ queryKey: ["discover", "delivery"] });
    }
  });
  const page = pageQuery.data;
  const spaces = spacesQuery.data ?? [];
  const currentSpace = spaces.find((space) => space.id === page?.space_id);
  const pageToken = page?.title.toLowerCase().split(" ")[0] ?? "";
  const persistedRelationships = [...(sourceRelationshipsQuery.data ?? []), ...(targetRelationshipsQuery.data ?? [])];
  const persistedIdeas = persistedRelationships.filter((relationship) => relationship.source_type === "idea" || relationship.target_type === "idea");
  const persistedWorkItems = persistedRelationships.filter((relationship) => relationship.source_type === "work_item" || relationship.target_type === "work_item");
  const persistedReleases = persistedRelationships.filter((relationship) => relationship.source_type === "release" || relationship.target_type === "release");
  const fallbackWorkItems = (workItemsQuery.data ?? []).filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(pageToken));
  const relatedIdeas = persistedIdeas.length > 0 ? persistedIdeas : (ideasQuery.data ?? []).filter((idea) => `${idea.title} ${idea.description}`.toLowerCase().includes(pageToken)).map((idea) => ({ id: idea.id, target_id: String(idea.id), title: idea.title }));
  const pageFlowLinks = pageFlowLinksQuery.data ?? [];
  const relatedWorkItems = pageFlowLinks.length > 0
    ? pageFlowLinks.map((link) => ({ id: link.id, target_id: String(link.flow_work_item_id), title: link.title, status: link.status, assignee_id: link.assignee_id, priority_id: link.priority_id, source: "doc_flow" }))
    : persistedWorkItems.length > 0 ? persistedWorkItems : fallbackWorkItems.map((item) => ({ id: item.id, target_id: String(item.id), title: item.title, status: item.status_id ? `Status ${item.status_id}` : "Unknown", assignee_id: item.assignee_id, priority_id: item.priority_id }));
  const linkedReleaseIds = new Set(fallbackWorkItems.map((item) => item.release_id).filter(Boolean));
  const linkedReleases = persistedReleases.length > 0 ? persistedReleases : (releasesQuery.data ?? []).filter((release) => linkedReleaseIds.has(release.id)).map((release) => ({ id: release.id, target_id: String(release.id), title: release.name }));

  useEffect(() => {
    if (page) {
      addViewed({ source: "docs", entity_type: "docs_page", entity_id: page.id, title: page.title, href: `/docs/pages/${page.id}` });
    }
  }, [addViewed, page]);

  const startEditing = () => {
    setTitle(page?.title ?? "");
    setContent(page?.content ?? "");
    setStatus(page?.status ?? "draft");
    setParentPageId(page?.parent_page_id ? String(page.parent_page_id) : "");
    setEditing(true);
  };
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate();
  };
  const handleManualLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!linkTargetId.trim()) return;
    linkMutation.mutate();
  };

  if (pageQuery.isLoading) return <><DocsSubnav /><DetailPanel title="Page"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel></>;
  if (!page) return <><DocsSubnav /><DetailPanel title="Page"><div className="text-sm text-destructive">Unable to load page.</div></DetailPanel></>;

  return (
    <div className="space-y-4">
      <DocsSubnav />
      <DocsBackLink href="/docs/pages" label="Back to Pages" />
      <DocsBreadcrumbs items={[{ label: "Spaces", href: "/docs/spaces" }, { label: currentSpace?.name ?? "Space", href: currentSpace ? `/docs/spaces/${currentSpace.id}` : undefined }, { label: page.title }]} />
      <EntityDetailHeader
        title={page.title}
        description={`${currentSpace?.name ?? `Space ${page.space_id}`} · Updated ${docsDate(page.updated_at ?? page.created_at)}`}
        meta={<StatusBadge value={page.status ?? "draft"} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={startEditing}>Edit</Button>
            <Button size="sm" variant="outline" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || page.status === "published"}>Publish</Button>
            <Button size="sm" variant="outline" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending || page.status === "archived"}>Archive</Button>
            <Button size="sm" variant="outline" onClick={() => setShowFlowLinkDraft((value) => !value)}>Link Flow Work Item</Button>
          </div>
        }
      />
      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{actionError}</div> : null}
      {showFlowLinkDraft ? (
        <DetailPanel title="Create Flow Work From Page">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Create a real Flow record from this Docs page and keep it linked to the source page.
            </p>
            <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(
                {
                  project_id: selectedProjectId,
                  source: "doc_page",
                  source_id: page.id,
                  title: page.title,
                  supported_types: ["epic", "story", "task"]
                },
                null,
                2
              )}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => createFlowWorkMutation.mutate("epic")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Epic</Button>
              <Button variant="outline" onClick={() => createFlowWorkMutation.mutate("story")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Story</Button>
              <Button variant="outline" onClick={() => createFlowWorkMutation.mutate("task")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Task</Button>
              <Button variant="outline" onClick={() => setShowFlowLinkDraft(false)}>Close</Button>
            </div>
          </div>
        </DetailPanel>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <DetailPanel title="Overview">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div><div className="text-muted-foreground">Space</div><div className="font-medium">{currentSpace?.name ?? "Space unavailable"}</div></div>
              <div><div className="text-muted-foreground">Parent</div><div className="font-medium">{page.parent_page_id ? `Page ${page.parent_page_id}` : "Top-level"}</div></div>
              <div><div className="text-muted-foreground">Status</div><StatusBadge value={page.status ?? "draft"} /></div>
              <div><div className="text-muted-foreground">Versions</div><div className="font-medium">{versionsQuery.data?.length ?? 0}</div></div>
            </div>
          </DetailPanel>
          <DetailPanel title="Content">
            {isEditing ? (
              <form className="space-y-3" onSubmit={handleSave}>
                <Input aria-label="Edit page title" value={title} onChange={(event) => setTitle(event.target.value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Status</span>
                    <Select aria-label="Edit page status" value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Parent page</span>
                    <Input aria-label="Edit parent page ID" placeholder="Optional parent page ID" value={parentPageId} onChange={(event) => setParentPageId(event.target.value)} />
                  </label>
                </div>
                <textarea aria-label="Edit page content" className="min-h-56 w-full rounded-md border bg-background p-3 text-sm" value={content} onChange={(event) => setContent(event.target.value)} />
                <div className="flex gap-2">
                  <Button disabled={updateMutation.isPending}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <article className="whitespace-pre-wrap text-sm leading-6">{page.content || "No content."}</article>
                <Button size="sm" variant="outline">AI summary placeholder</Button>
              </div>
            )}
          </DetailPanel>
          <DetailPanel title="Comments">
            <div className="space-y-3">
              <CommentList comments={commentsQuery.data ?? []} />
              <CommentComposer onSubmit={(comment) => commentMutation.mutate(comment)} isSubmitting={commentMutation.isPending} />
            </div>
          </DetailPanel>
          <DetailPanel title="Version History">
            {(versionsQuery.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No versions have been recorded yet.</p> : (
              <div className="space-y-2">
                {(versionsQuery.data ?? []).map((version) => (
                  <div key={version.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">Version {version.version_number}: {version.title}</div>
                      <div className="text-xs text-muted-foreground">{docsDate(version.created_at)}</div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{version.content || "No content"}</p>
                  </div>
                ))}
              </div>
            )}
          </DetailPanel>
        </div>
        <DetailPanel title="Links">
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-dashed p-3">
              <div className="flex items-center gap-2 font-medium"><Link2 className="h-4 w-4" /> Linked Work Items</div>
              {relatedWorkItems.length === 0 ? <p className="mt-1 text-muted-foreground">No Flow work item is linked yet. Use Link Flow Work Item to review the link payload.</p> : (
                <div className="mt-2 space-y-2">{relatedWorkItems.slice(0, 4).map((item) => (
                  <div key={`${item.id}-${item.target_id}`} className="flex items-start justify-between gap-2">
                    <div>
                      <a className="text-primary hover:underline" href={`/flow/work-items/${item.target_id}`}>{item.title ?? `Work item ${item.target_id}`}</a>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Status: {"status" in item ? item.status ?? "Unknown" : "Unknown"} · Assignee: {"assignee_id" in item ? item.assignee_id ?? "Unassigned" : "Unassigned"} · Priority: {"priority_id" in item ? item.priority_id ?? "Unset" : "Unset"}
                      </div>
                    </div>
                    {"relationship_type" in item ? <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(item.id)} disabled={unlinkMutation.isPending}>Unlink</Button> : null}
                  </div>
                ))}</div>
              )}
            </div>
            <div className="rounded-md border border-dashed p-3">
              <div className="flex items-center gap-2 font-medium"><Link2 className="h-4 w-4" /> Related Ideas</div>
              {relatedIdeas.length === 0 ? <p className="mt-1 text-muted-foreground">No related idea is linked yet.</p> : (
                <div className="mt-2 space-y-2">{relatedIdeas.slice(0, 4).map((idea) => (
                  <div key={`${idea.id}-${idea.target_id}`} className="flex items-center justify-between gap-2">
                    <a className="text-primary hover:underline" href={`/discover/ideas/${idea.target_id}`}>{idea.title ?? `Idea ${idea.target_id}`}</a>
                    {"relationship_type" in idea ? <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(idea.id)} disabled={unlinkMutation.isPending}>Unlink</Button> : null}
                  </div>
                ))}</div>
              )}
            </div>
            <div className="rounded-md border border-dashed p-3">
              <div className="flex items-center gap-2 font-medium"><Link2 className="h-4 w-4" /> Linked Releases</div>
              {linkedReleases.length === 0 ? <p className="mt-1 text-muted-foreground">No release is linked through related Flow work yet.</p> : (
                <div className="mt-2 space-y-2">{linkedReleases.slice(0, 4).map((release) => (
                  <div key={`${release.id}-${release.target_id}`} className="flex items-center justify-between gap-2">
                    <a className="text-primary hover:underline" href={`/flow/releases/${release.target_id}`}>{release.title ?? `Release ${release.target_id}`}</a>
                    {"relationship_type" in release ? <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate(release.id)} disabled={unlinkMutation.isPending}>Unlink</Button> : null}
                  </div>
                ))}</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setLinkMode("idea")}>Link Idea</Button>
              <Button size="sm" variant="outline" onClick={() => createFlowWorkMutation.mutate("epic")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Epic</Button>
              <Button size="sm" variant="outline" onClick={() => createFlowWorkMutation.mutate("story")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Story</Button>
              <Button size="sm" variant="outline" onClick={() => createFlowWorkMutation.mutate("task")} disabled={createFlowWorkMutation.isPending || !selectedProjectId}>Create Task</Button>
              <Button size="sm" variant="outline" onClick={() => setLinkMode("work_item")}>Link Work Item</Button>
              <Button size="sm" variant="outline" onClick={() => setLinkMode("release")}>Link Release</Button>
            </div>
            {linkMode ? (
              <ManualLinkForm
                typeLabel={linkMode === "idea" ? "Idea" : linkMode === "work_item" ? "Work Item" : "Release"}
                targetId={linkTargetId}
                targetTitle={linkTargetTitle}
                isPending={linkMutation.isPending}
                onTargetIdChange={setLinkTargetId}
                onTargetTitleChange={setLinkTargetTitle}
                onCancel={() => setLinkMode(null)}
                onSubmit={handleManualLink}
              />
            ) : null}
          </div>
        </DetailPanel>
      </div>
      <LinkedResourcesPanel entityType="docs_page" entityId={page.id} entityTitle={page.title} />
    </div>
  );
}

function ManualLinkForm({
  typeLabel,
  targetId,
  targetTitle,
  isPending,
  onTargetIdChange,
  onTargetTitleChange,
  onCancel,
  onSubmit
}: {
  typeLabel: string;
  targetId: string;
  targetTitle: string;
  isPending: boolean;
  onTargetIdChange: (value: string) => void;
  onTargetTitleChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-md border border-dashed p-3" onSubmit={onSubmit}>
      <p className="mb-3 text-xs text-muted-foreground">Search lookup is pending. Enter a known {typeLabel.toLowerCase()} ID and title to persist this link.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label={`${typeLabel} ID`} placeholder={`${typeLabel} ID`} value={targetId} onChange={(event) => onTargetIdChange(event.target.value)} />
        <Input aria-label={`${typeLabel} title`} placeholder={`${typeLabel} title`} value={targetTitle} onChange={(event) => onTargetTitleChange(event.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={isPending || !targetId.trim()}>{isPending ? "Linking..." : `Link ${typeLabel}`}</Button>
        <Button size="sm" type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
