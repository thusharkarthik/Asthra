"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_PRIORITY_OPTIONS, FLOW_STATUS_OPTIONS, assigneeLabel, priorityNameFromId, reporterLabel, statusNameFromId } from "@/components/flow/flow-utils";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityActivityPanel, EntityDangerZone, EntityDetailLayout, EntityLinksPanel, EntityMetadataPanel } from "@/components/modules/entity-detail-layout";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function WorkItemDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const projects = useWorkspaceStore((state) => state.projects);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    statusName: "todo",
    priorityName: "medium",
    assigneeId: "",
    dueDate: ""
  });

  const itemQuery = useQuery({ queryKey: ["flow", "work-item", id], queryFn: () => flowApi.getWorkItem(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["flow", "comments", id], queryFn: () => flowApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const item = itemQuery.data;

  useEffect(() => {
    if (!item) return;
    setDraft({
      title: item.title,
      description: item.description ?? "",
      statusName: statusNameFromId(item.status_id),
      priorityName: priorityNameFromId(item.priority_id),
      assigneeId: item.assignee_id ? String(item.assignee_id) : "",
      dueDate: item.due_date ? item.due_date.slice(0, 10) : ""
    });
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: () => flowApi.updateWorkItem(accessToken ?? "", id, {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      status_name: draft.statusName,
      priority_name: draft.priorityName,
      assignee_id: draft.assigneeId ? Number(draft.assigneeId) : null,
      due_date: draft.dueDate ? `${draft.dueDate}T00:00:00Z` : null
    }),
    onSuccess: () => {
      setEditing(false);
      addToast({ type: "success", title: "Work item updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Update failed", message: error instanceof Error ? error.message : "Unable to update work item." })
  });

  const deleteMutation = useMutation({
    mutationFn: () => flowApi.deleteWorkItem(accessToken ?? "", id),
    onSuccess: () => {
      addToast({ type: "success", title: "Work item archived" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
      router.push("/flow/work-items");
    },
    onError: (error) => addToast({ type: "error", title: "Archive failed", message: error instanceof Error ? error.message : "Unable to archive work item." })
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => flowApi.createComment(accessToken ?? "", id, { content, user_id: currentUser?.id }),
    onSuccess: () => {
      addToast({ type: "success", title: "Comment added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "comments", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "work-item", id] });
    },
    onError: (error) => addToast({ type: "error", title: "Comment failed", message: error instanceof Error ? error.message : "Unable to add comment." })
  });

  if (itemQuery.isLoading) {
    return (
      <>
        <FlowSubnav />
        <DetailPanel title="Work item"><div className="text-sm text-muted-foreground">Loading...</div></DetailPanel>
      </>
    );
  }

  if (itemQuery.error || !item) {
    return (
      <>
        <FlowSubnav />
        <DetailPanel title="Work item"><div className="text-sm text-destructive">Unable to load work item.</div></DetailPanel>
      </>
    );
  }

  const project = projects.find((candidate) => candidate.id === item.project_id) ?? projects.find((candidate) => candidate.id === selectedProjectId);

  return (
    <div className="space-y-4">
      <FlowSubnav />
      <EntityDetailLayout
        header={<EntityDetailHeader
          title={item.title}
          description={`Work item #${item.id}`}
          actions={<>
            <Button variant="outline" onClick={() => setEditing((value) => !value)}>{isEditing ? "Cancel" : "Edit"}</Button>
            <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/work-items">Back to Work Items</Link>
          </>}
        />}
        overview={
          <DetailPanel title="Overview">
            {isEditing ? (
              <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }}>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Title</span>
                  <Input value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} required />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Description</span>
                  <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm" value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Status</span>
                    <Select value={draft.statusName} onChange={(event) => setDraft((value) => ({ ...value, statusName: event.target.value }))}>
                      {FLOW_STATUS_OPTIONS.map((status) => <option key={status.name} value={status.name}>{status.label}</option>)}
                    </Select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Priority</span>
                    <Select value={draft.priorityName} onChange={(event) => setDraft((value) => ({ ...value, priorityName: event.target.value }))}>
                      {FLOW_PRIORITY_OPTIONS.map((priority) => <option key={priority.name} value={priority.name}>{priority.label}</option>)}
                    </Select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Assignee</span>
                    <Input inputMode="numeric" placeholder="User ID optional" value={draft.assigneeId} onChange={(event) => setDraft((value) => ({ ...value, assigneeId: event.target.value }))} />
                    <span className="text-xs text-muted-foreground">Member picker pending. Leave blank for Unassigned.</span>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Due date</span>
                    <Input type="date" value={draft.dueDate} onChange={(event) => setDraft((value) => ({ ...value, dueDate: event.target.value }))} />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap text-sm">{item.description || "No description."}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={item.status_id} />
                  <PriorityBadge value={item.priority_id} />
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Assignee: {assigneeLabel(item.assignee_id)}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Reporter: {reporterLabel(item.reporter_id)}</span>
                </div>
                <Button variant="outline" size="sm">AI breakdown placeholder</Button>
              </div>
            )}
          </DetailPanel>
        }
        activity={<EntityActivityPanel>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Created {item.created_at ? new Date(item.created_at).toLocaleString() : "recently"}.</div>
            <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Last updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : "not available"}.</div>
          </div>
        </EntityActivityPanel>}
        metadata={<EntityMetadataPanel>
          <div className="grid gap-3 text-sm">
            <div><div className="text-muted-foreground">Project</div><div className="font-medium">{project?.name ?? "Selected project"}</div><div className="text-xs text-muted-foreground">ID {item.project_id}</div></div>
            <div><div className="text-muted-foreground">Assignee</div><div className="font-medium">{assigneeLabel(item.assignee_id)}</div></div>
            <div><div className="text-muted-foreground">Reporter</div><div className="font-medium">{reporterLabel(item.reporter_id)}</div></div>
            <div><div className="text-muted-foreground">Due date</div><div className="font-medium">{item.due_date ? new Date(item.due_date).toLocaleDateString() : "No due date"}</div></div>
          </div>
        </EntityMetadataPanel>}
        links={<EntityLinksPanel labels={["Linked Docs", "Linked Tickets", "Linked Incidents"]} />}
        dangerZone={<EntityDangerZone
          label="Archive work item"
          description="Archiving hides this item from active Flow lists."
          action={<Button size="sm" variant="outline" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("Archive this work item?")) deleteMutation.mutate(); }}>{deleteMutation.isPending ? "Archiving..." : "Archive"}</Button>}
        />}
      />
      <DetailPanel title="Comments">
        <div className="space-y-3">
          <CommentList comments={commentsQuery.data ?? []} />
          <CommentComposer onSubmit={(content) => commentMutation.mutate(content)} isSubmitting={commentMutation.isPending} />
        </div>
      </DetailPanel>
    </div>
  );
}
