"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Link2 } from "lucide-react";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";

export default function WorkItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);

  const itemQuery = useQuery({ queryKey: ["flow", "work-item", id], queryFn: () => flowApi.getWorkItem(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["flow", "comments", id], queryFn: () => flowApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentMutation = useMutation({
    mutationFn: (content: string) => flowApi.createComment(accessToken ?? "", id, { content, user_id: currentUser?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flow", "comments", id] })
  });

  if (itemQuery.isLoading) {
    return (
      <>
        <FlowSubnav />
        <DetailPanel title="Work item"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>
      </>
    );
  }

  if (itemQuery.error || !itemQuery.data) {
    return (
      <>
        <FlowSubnav />
        <DetailPanel title="Work item"><div className="text-sm text-destructive">Unable to load work item.</div></DetailPanel>
      </>
    );
  }

  const item = itemQuery.data;
  return (
    <div className="space-y-4">
      <FlowSubnav />
      <EntityDetailHeader
        title={item.title}
        description={`Work item #${item.id}`}
        actions={<Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/work-items">Back to Work Items</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <DetailPanel title="Overview">
            <div className="space-y-3">
              <p className="whitespace-pre-wrap text-sm">{item.description || "No description."}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={item.status_id} />
                <PriorityBadge value={item.priority_id} />
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Assignee: {item.assignee_id ?? "Unassigned"}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Reporter: {item.reporter_id ?? "Unknown"}</span>
              </div>
              <Button variant="outline" size="sm">AI breakdown placeholder</Button>
            </div>
          </DetailPanel>
          <DetailPanel title="Comments">
            <div className="space-y-3">
              <CommentList comments={commentsQuery.data ?? []} />
              <CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} />
            </div>
          </DetailPanel>
          <DetailPanel title="Activity">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Created {item.created_at ? new Date(item.created_at).toLocaleString() : "recently"}.</div>
              <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Last updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : "not available"}.</div>
            </div>
          </DetailPanel>
        </div>
        <DetailPanel title="Links">
          <div className="space-y-3 text-sm">
            {["Linked Docs", "Linked Tickets", "Linked Incidents"].map((label) => (
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
