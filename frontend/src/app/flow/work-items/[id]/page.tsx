"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import {
  FLOW_BUSINESS_VALUE_OPTIONS,
  FLOW_COMPLEXITY_OPTIONS,
  FLOW_EFFORT_SIZE_OPTIONS,
  FLOW_ITEM_LEVEL_OPTIONS,
  FLOW_PRIORITY_OPTIONS,
  FLOW_RELATION_TYPE_OPTIONS,
  FLOW_RISK_OPTIONS,
  FLOW_STATUS_OPTIONS,
  assigneeLabel,
  effortLabel,
  itemLevelLabel,
  planningLabel,
  priorityNameFromId,
  relationTypeLabel,
  reporterLabel,
  statusNameFromId
} from "@/components/flow/flow-utils";
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
import type { FlowItemLevel, WorkItemRelationType } from "@/types/flow";

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
    dueDate: "",
    effortScore: "",
    effortSize: "",
    businessValue: "",
    riskLevel: "",
    complexity: "",
    acceptanceCriteria: "",
    definitionOfDone: "",
    parentId: "",
    itemLevel: "work_item" as FlowItemLevel
  });
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [relationTargetId, setRelationTargetId] = useState("");
  const [relationType, setRelationType] = useState<WorkItemRelationType>("blocks");
  const [relationDescription, setRelationDescription] = useState("");

  const itemQuery = useQuery({ queryKey: ["flow", "work-item", id], queryFn: () => flowApi.getWorkItem(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["flow", "comments", id], queryFn: () => flowApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const childrenQuery = useQuery({ queryKey: ["flow", "children", id], queryFn: () => flowApi.listChildren(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const relationsQuery = useQuery({ queryKey: ["flow", "relations", id], queryFn: () => flowApi.listRelations(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const item = itemQuery.data;
  const relatedWorkQuery = useQuery({
    queryKey: ["flow", "work-items", item?.project_id],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: item?.project_id, limit: 100 }),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });

  useEffect(() => {
    if (!item) return;
    setDraft({
      title: item.title,
      description: item.description ?? "",
      statusName: statusNameFromId(item.status_id),
      priorityName: priorityNameFromId(item.priority_id),
      assigneeId: item.assignee_id ? String(item.assignee_id) : "",
      dueDate: item.due_date ? item.due_date.slice(0, 10) : "",
      effortScore: item.effort_score ? String(item.effort_score) : "",
      effortSize: item.effort_size ?? "",
      businessValue: item.business_value ?? "",
      riskLevel: item.risk_level ?? "",
      complexity: item.complexity ?? "",
      acceptanceCriteria: item.acceptance_criteria ?? "",
      definitionOfDone: item.definition_of_done ?? "",
      parentId: item.parent_id ? String(item.parent_id) : "",
      itemLevel: (item.item_level ?? "work_item") as FlowItemLevel
    });
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: () => flowApi.updateWorkItem(accessToken ?? "", id, {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      status_name: draft.statusName,
      priority_name: draft.priorityName,
      assignee_id: draft.assigneeId ? Number(draft.assigneeId) : null,
      due_date: draft.dueDate ? `${draft.dueDate}T00:00:00Z` : null,
      effort_score: draft.effortScore ? Number(draft.effortScore) : null,
      effort_size: draft.effortSize || null,
      business_value: draft.businessValue || null,
      risk_level: draft.riskLevel || null,
      complexity: draft.complexity || null,
      acceptance_criteria: draft.acceptanceCriteria.trim() || null,
      definition_of_done: draft.definitionOfDone.trim() || null,
      parent_id: draft.parentId ? Number(draft.parentId) : null,
      item_level: draft.itemLevel
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
  const subtaskMutation = useMutation({
    mutationFn: () => flowApi.createSubtask(accessToken ?? "", id, {
      project_id: item?.project_id ?? 0,
      title: subtaskTitle.trim(),
      item_level: "subtask"
    }),
    onSuccess: () => {
      setSubtaskTitle("");
      addToast({ type: "success", title: "Subtask added" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Subtask failed", message: error instanceof Error ? error.message : "Unable to add subtask." })
  });
  const relationMutation = useMutation({
    mutationFn: () => flowApi.createRelation(accessToken ?? "", id, {
      target_work_item_id: Number(relationTargetId),
      relation_type: relationType,
      description: relationDescription.trim() || null
    }),
    onSuccess: () => {
      setRelationTargetId("");
      setRelationDescription("");
      addToast({ type: "success", title: "Related work added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "relations", id] });
    },
    onError: (error) => addToast({ type: "error", title: "Relation failed", message: error instanceof Error ? error.message : "Unable to add relation." })
  });
  const deleteRelationMutation = useMutation({
    mutationFn: (relationId: number) => flowApi.deleteRelation(accessToken ?? "", id, relationId),
    onSuccess: () => {
      addToast({ type: "success", title: "Relation removed" });
      queryClient.invalidateQueries({ queryKey: ["flow", "relations", id] });
    }
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
  const siblingWorkItems = queryClient.getQueryData<Array<{ id: number; title: string }>>(["flow", "work-items", item.project_id]) ?? [];
  const parentWork = siblingWorkItems.find((candidate) => candidate.id === item.parent_id);

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
                <div className="rounded-md border p-3">
                  <h3 className="mb-3 text-sm font-semibold">Planning</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Effort Size</span>
                      <Select value={draft.effortSize} onChange={(event) => setDraft((value) => ({ ...value, effortSize: event.target.value }))}>
                        <option value="">Not set</option>
                        {FLOW_EFFORT_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Effort Score</span>
                      <Input inputMode="numeric" value={draft.effortScore} onChange={(event) => setDraft((value) => ({ ...value, effortScore: event.target.value }))} />
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Business Value</span>
                      <Select value={draft.businessValue} onChange={(event) => setDraft((value) => ({ ...value, businessValue: event.target.value }))}>
                        <option value="">Not set</option>
                        {FLOW_BUSINESS_VALUE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Risk Level</span>
                      <Select value={draft.riskLevel} onChange={(event) => setDraft((value) => ({ ...value, riskLevel: event.target.value }))}>
                        <option value="">Not set</option>
                        {FLOW_RISK_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Complexity</span>
                      <Select value={draft.complexity} onChange={(event) => setDraft((value) => ({ ...value, complexity: event.target.value }))}>
                        <option value="">Not set</option>
                        {FLOW_COMPLEXITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Work Level</span>
                      <Select value={draft.itemLevel} onChange={(event) => setDraft((value) => ({ ...value, itemLevel: event.target.value as FlowItemLevel }))}>
                        {FLOW_ITEM_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Parent Work</span>
                      <Input inputMode="numeric" placeholder="Parent work item ID" value={draft.parentId} onChange={(event) => setDraft((value) => ({ ...value, parentId: event.target.value }))} />
                    </label>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <h3 className="mb-3 text-sm font-semibold">Acceptance</h3>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Acceptance Criteria</span>
                    <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" value={draft.acceptanceCriteria} onChange={(event) => setDraft((value) => ({ ...value, acceptanceCriteria: event.target.value }))} />
                  </label>
                  <label className="mt-3 grid gap-1 text-sm">
                    <span className="font-medium">Completion Checklist</span>
                    <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm" value={draft.definitionOfDone} onChange={(event) => setDraft((value) => ({ ...value, definitionOfDone: event.target.value }))} />
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
        activity={<>
          <EntityActivityPanel>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Created {item.created_at ? new Date(item.created_at).toLocaleString() : "recently"}.</div>
              <div className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Last updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : "not available"}.</div>
            </div>
          </EntityActivityPanel>
          <DetailPanel title="Planning">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div><div className="text-muted-foreground">Effort</div><div className="font-medium">{effortLabel(item.effort_size, item.effort_score)}</div></div>
              <div><div className="text-muted-foreground">Business Value</div><div className="font-medium">{planningLabel(item.business_value)}</div></div>
              <div><div className="text-muted-foreground">Risk</div><div className="font-medium">{planningLabel(item.risk_level)}</div></div>
              <div><div className="text-muted-foreground">Complexity</div><div className="font-medium">{planningLabel(item.complexity)}</div></div>
            </div>
          </DetailPanel>
          <DetailPanel title="Acceptance">
            <div className="space-y-3 text-sm">
              <div><div className="font-medium">Acceptance Criteria</div><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.acceptance_criteria || "No acceptance criteria yet."}</p></div>
              <div><div className="font-medium">Completion Checklist</div><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.definition_of_done || "No completion checklist yet."}</p></div>
            </div>
          </DetailPanel>
        </>}
        metadata={<EntityMetadataPanel>
          <div className="grid gap-3 text-sm">
            <div><div className="text-muted-foreground">Project</div><div className="font-medium">{project?.name ?? "Selected project"}</div><div className="text-xs text-muted-foreground">ID {item.project_id}</div></div>
            <div><div className="text-muted-foreground">Assignee</div><div className="font-medium">{assigneeLabel(item.assignee_id)}</div></div>
            <div><div className="text-muted-foreground">Reporter</div><div className="font-medium">{reporterLabel(item.reporter_id)}</div></div>
            <div><div className="text-muted-foreground">Due date</div><div className="font-medium">{item.due_date ? new Date(item.due_date).toLocaleDateString() : "No due date"}</div></div>
          </div>
        </EntityMetadataPanel>}
        links={<>
          <DetailPanel title="Hierarchy">
            <div className="space-y-3 text-sm">
              <div><div className="text-muted-foreground">Current Level</div><div className="font-medium">{itemLevelLabel(item.item_level)}</div></div>
              <div><div className="text-muted-foreground">Parent Work</div><div className="font-medium">{parentWork?.title ?? (item.parent_id ? `Work item #${item.parent_id}` : "No parent work")}</div></div>
              <div>
                <div className="font-medium">Children / Subtasks</div>
                <div className="mt-2 space-y-2">
                  {(childrenQuery.data ?? []).length === 0 ? <p className="text-muted-foreground">No child work yet.</p> : (childrenQuery.data ?? []).map((child) => (
                    <Link key={child.id} href={`/flow/work-items/${child.id}`} className="block rounded-md border p-2 text-primary hover:bg-muted">{child.title}</Link>
                  ))}
                </div>
              </div>
              {item.item_level === "work_item" ? (
                <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); if (subtaskTitle.trim()) subtaskMutation.mutate(); }}>
                  <Input aria-label="Subtask title" placeholder="Add subtask title" value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} />
                  <Button size="sm" disabled={!subtaskTitle.trim() || subtaskMutation.isPending}>{subtaskMutation.isPending ? "Adding..." : "Add Subtask"}</Button>
                </form>
              ) : null}
            </div>
          </DetailPanel>
          <DetailPanel title="Related Work">
            <div className="space-y-3 text-sm">
              <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); if (relationTargetId) relationMutation.mutate(); }}>
                <Select aria-label="Related work target" value={relationTargetId} onChange={(event) => setRelationTargetId(event.target.value)}>
                  <option value="">Select target work</option>
                  {(relatedWorkQuery.data ?? []).filter((candidate) => candidate.id !== item.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
                </Select>
                <Select aria-label="Related work type" value={relationType} onChange={(event) => setRelationType(event.target.value as WorkItemRelationType)}>
                  {FLOW_RELATION_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
                <Input aria-label="Related work description" placeholder="Description optional" value={relationDescription} onChange={(event) => setRelationDescription(event.target.value)} />
                <Button size="sm" disabled={!relationTargetId || relationMutation.isPending}>{relationMutation.isPending ? "Adding..." : "Add Relation"}</Button>
              </form>
              <div className="space-y-2">
                {(relationsQuery.data ?? []).length === 0 ? <p className="text-muted-foreground">No related work yet.</p> : (relationsQuery.data ?? []).map((relation) => (
                  <div key={relation.id} className="rounded-md border p-2">
                    <Link href={`/flow/work-items/${relation.target_work_item_id}`} className="font-medium text-primary hover:underline">{relation.target_title ?? `Work item #${relation.target_work_item_id}`}</Link>
                    <div className="mt-1 text-xs text-muted-foreground">{relationTypeLabel(relation.relation_type)}</div>
                    {relation.description ? <p className="mt-1 text-muted-foreground">{relation.description}</p> : null}
                    <Button className="mt-2" size="sm" variant="outline" onClick={() => deleteRelationMutation.mutate(relation.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanel>
          <EntityLinksPanel labels={["Linked Docs", "Linked Tickets", "Linked Incidents", "Linked Discover Items"]} />
        </>}
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
