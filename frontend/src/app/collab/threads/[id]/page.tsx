"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@/components/modules/comment-composer";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { ThreadMessageList } from "@/components/modules/thread-message-list";
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
      <EntityDetailHeader title={thread.title} meta={<><StatusBadge value={thread.status} /><span className="text-xs text-muted-foreground">Workspace {thread.workspace_id}</span></>} />
      <DetailPanel title="Messages">
        <ThreadMessageList messages={messagesQuery.data ?? []} />
        <div className="mt-4"><CommentComposer onSubmit={(content) => messageMutation.mutate(content)} isSubmitting={messageMutation.isPending} /></div>
      </DetailPanel>
    </div>
  );
}
