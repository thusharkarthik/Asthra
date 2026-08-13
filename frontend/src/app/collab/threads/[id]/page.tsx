"use client";

import { useParams } from "next/navigation";
import { Archive } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { ThreadMessageList } from "@/components/modules/thread-message-list";
import { Button } from "@/components/ui/button";
import { CollabBackLink, CollabBreadcrumbs } from "@/components/collab/collab-breadcrumbs";
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
import { collabApi } from "@/services/api/collab-api";
import { useAuthStore } from "@/stores/auth-store";

export default function ThreadDetailPage() {
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const threadQuery = useQuery({ queryKey: ["collab", "thread", id], queryFn: () => collabApi.getThread(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const messagesQuery = useQuery({ queryKey: ["collab", "messages", id], queryFn: () => collabApi.listMessages(accessToken ?? "", id), enabled: Boolean(accessToken && id), retry: 1 });
  const messageMutation = useMutation({ mutationFn: (content: string) => collabApi.createMessage(accessToken ?? "", id, { content, author_id: currentUser?.id }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collab", "messages", id] }) });

  if (threadQuery.isLoading) return <DetailPanel title="Thread"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>;
  if (!threadQuery.data) return <DetailPanel title="Thread"><div className="text-sm text-destructive">Unable to load thread.</div></DetailPanel>;
  const thread = threadQuery.data;

  return (
    <div className="space-y-4">
      <CollabBackLink href="/collab/threads" label="Back to Threads" />
      <CollabBreadcrumbs items={[{ label: "Threads", href: "/collab/threads" }, { label: thread.title }]} />
      <EntityDetailHeader
        title={thread.title}
        meta={<><StatusBadge value={thread.status} /><span className="text-xs text-muted-foreground">Workspace {thread.workspace_id}</span></>}
        actions={<Button variant="outline" disabled title="Archive support is pending backend update"><Archive className="mr-2 h-4 w-4" />Archive Thread</Button>}
      />
      <DetailPanel title="Overview">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Topic</dt><dd className="font-medium">{thread.entity_type ?? "General"}</dd></div>
          <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{thread.project_id ?? "Workspace-level"}</dd></div>
          <div><dt className="text-muted-foreground">Created by</dt><dd className="font-medium">User {thread.created_by_id}</dd></div>
        </dl>
      </DetailPanel>
      <DetailPanel title="Participants">
        <p className="text-sm text-muted-foreground">Participants will be resolved from workspace membership when the member lookup API is available. Current author: User {thread.created_by_id}.</p>
      </DetailPanel>
      <DetailPanel title="Messages">
        <ThreadMessageList messages={messagesQuery.data ?? []} />
        <div className="mt-4"><CommentComposer onSubmit={(content) => messageMutation.mutate(content)} isSubmitting={messageMutation.isPending} /></div>
      </DetailPanel>
      <LinkedResourcesPanel entityType="collab_thread" entityId={thread.id} entityTitle={thread.title} />
    </div>
  );
}
