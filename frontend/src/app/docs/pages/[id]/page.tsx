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
import { docsApi } from "@/services/api/docs-api";
import { useAuthStore } from "@/stores/auth-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";

export default function PageDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addViewed = useRecentItemsStore((state) => state.addViewed);
  const [isEditing, setEditing] = useState(false);
  const pageQuery = useQuery({ queryKey: ["docs", "page", id], queryFn: () => docsApi.getPage(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["docs", "comments", id], queryFn: () => docsApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const versionsQuery = useQuery({ queryKey: ["docs", "page-versions", id], queryFn: () => docsApi.listPageVersions(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const updateMutation = useMutation({
    mutationFn: () => docsApi.updatePage(accessToken ?? "", id, { title, content, updated_by_id: currentUser?.id }),
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
  const page = pageQuery.data;

  useEffect(() => {
    if (page) {
      addViewed({ source: "docs", entity_type: "docs_page", entity_id: page.id, title: page.title, href: `/docs/pages/${page.id}` });
    }
  }, [addViewed, page]);

  const startEditing = () => {
    setTitle(page?.title ?? "");
    setContent(page?.content ?? "");
    setEditing(true);
  };
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate();
  };

  if (pageQuery.isLoading) return <><DocsSubnav /><DetailPanel title="Page"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel></>;
  if (!page) return <><DocsSubnav /><DetailPanel title="Page"><div className="text-sm text-destructive">Unable to load page.</div></DetailPanel></>;

  return (
    <div className="space-y-4">
      <DocsSubnav />
      <DocsBackLink href="/docs/pages" label="Back to Pages" />
      <DocsBreadcrumbs items={[{ label: "Pages", href: "/docs/pages" }, { label: page.title }]} />
      <EntityDetailHeader
        title={page.title}
        description={`Space ${page.space_id} · Updated ${docsDate(page.updated_at ?? page.created_at)}`}
        meta={<StatusBadge value={page.status ?? "draft"} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={startEditing}>Edit</Button>
            <Button size="sm" variant="outline" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || page.status === "published"}>Publish</Button>
            <Button size="sm" variant="outline" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending || page.status === "archived"}>Archive</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <DetailPanel title="Overview">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div><div className="text-muted-foreground">Space</div><div className="font-medium">{page.space_id}</div></div>
              <div><div className="text-muted-foreground">Status</div><StatusBadge value={page.status ?? "draft"} /></div>
              <div><div className="text-muted-foreground">Versions</div><div className="font-medium">{versionsQuery.data?.length ?? 0}</div></div>
            </div>
          </DetailPanel>
          <DetailPanel title="Content">
            {isEditing ? (
              <form className="space-y-3" onSubmit={handleSave}>
                <Input aria-label="Edit page title" value={title} onChange={(event) => setTitle(event.target.value)} />
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
            {["Linked Work Items", "Linked Tickets", "Linked Incidents", "Linked Ideas"].map((label) => (
              <div key={label} className="rounded-md border border-dashed p-3">
                <div className="flex items-center gap-2 font-medium"><Link2 className="h-4 w-4" /> {label}</div>
                <p className="mt-1 text-muted-foreground">Future cross-module references will appear here.</p>
              </div>
            ))}
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}
