"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { AuditEventGroups, groupAuditEventsByDay } from "@/components/flow/audit-event-list";
import { FlowBackLink, FlowBreadcrumbs } from "@/components/flow/flow-breadcrumbs";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import {
  FLOW_BUSINESS_VALUE_OPTIONS,
  FLOW_COMPLEXITY_OPTIONS,
  FLOW_EFFORT_SIZE_OPTIONS,
  FLOW_ITEM_LEVEL_OPTIONS,
  FLOW_PRIORITY_OPTIONS,
  FLOW_RELATION_TYPE_OPTIONS,
  FLOW_RISK_OPTIONS,
  effortLabel,
  itemLevelLabel,
  planningLabel,
  priorityNameFromId,
  reporterLabel,
  validWorkflowTargets,
  workflowStatusKeyFor,
  workflowStatusLabelFor
} from "@/components/flow/flow-utils";
import { FlowMemberDisplay, FlowMemberPicker } from "@/components/flow/member-picker";
import { CommentComposer } from "@/components/modules/comment-composer";
import { CommentList } from "@/components/modules/comment-list";
import { DetailPanel } from "@/components/modules/detail-panel";
import { EntityActivityPanel, EntityDangerZone, EntityDetailLayout, EntityMetadataPanel } from "@/components/modules/entity-detail-layout";
import { EntityDetailHeader } from "@/components/modules/entity-detail-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiConfig } from "@/services/api/config";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CustomFieldDefinition, FlowItemLevel, LinkedEntity, LinkedEntityType, WorkItemRelationType } from "@/types/flow";

const LINK_TYPE_OPTIONS: { value: LinkedEntityType; label: string; section: string }[] = [
  { value: "doc_page", label: "Document", section: "Documents" },
  { value: "discover_idea", label: "Idea", section: "Ideas" },
  { value: "desk_ticket", label: "Ticket", section: "Tickets" },
  { value: "pulse_incident", label: "Incident", section: "Incidents" },
  { value: "dev_release", label: "Release", section: "Releases" },
  { value: "work_item", label: "Work Item", section: "Related Work" }
];

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
    originalEstimateHours: "",
    remainingEstimateHours: "",
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
  const [linkType, setLinkType] = useState<LinkedEntityType>("doc_page");
  const [linkEntityId, setLinkEntityId] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workLogMinutes, setWorkLogMinutes] = useState("");
  const [workLogDescription, setWorkLogDescription] = useState("");
  const [customFieldDraft, setCustomFieldDraft] = useState<Record<number, string>>({});

  const itemQuery = useQuery({ queryKey: ["flow", "work-item", id], queryFn: () => flowApi.getWorkItem(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const commentsQuery = useQuery({ queryKey: ["flow", "comments", id], queryFn: () => flowApi.listComments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const attachmentsQuery = useQuery({ queryKey: ["flow", "attachments", id], queryFn: () => flowApi.listAttachments(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const workLogsQuery = useQuery({ queryKey: ["flow", "work-logs", id], queryFn: () => flowApi.listWorkLogs(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const childrenQuery = useQuery({ queryKey: ["flow", "children", id], queryFn: () => flowApi.listChildren(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const relationsQuery = useQuery({ queryKey: ["flow", "relations", id], queryFn: () => flowApi.listRelations(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const linksQuery = useQuery({ queryKey: ["flow", "links", id], queryFn: () => flowApi.listLinks(accessToken ?? "", id), enabled: Boolean(accessToken && id) });
  const auditQuery = useQuery({ queryKey: ["flow", "audit-events", "work-item", id], queryFn: () => flowApi.listWorkItemAuditEvents(accessToken ?? "", id, { limit: 100 }), enabled: Boolean(accessToken && id) });
  const item = itemQuery.data;
  const workflowQuery = useQuery({
    queryKey: ["flow", "project-workflow", item?.project_id],
    queryFn: () => flowApi.getProjectWorkflow(accessToken ?? "", item?.project_id ?? 0),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });
  const relatedWorkQuery = useQuery({
    queryKey: ["flow", "work-items", item?.project_id],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: item?.project_id, limit: 100 }),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });
  const releasesQuery = useQuery({
    queryKey: ["flow", "releases", item?.project_id],
    queryFn: () => flowApi.listReleases(accessToken ?? "", { project_id: item?.project_id, limit: 100 }),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });
  const sprintsQuery = useQuery({
    queryKey: ["flow", "sprints", item?.project_id],
    queryFn: () => flowApi.listSprints(accessToken ?? "", { project_id: item?.project_id, limit: 100 }),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });
  const customFieldDefinitionsQuery = useQuery({
    queryKey: ["flow", "custom-fields", item?.project_id],
    queryFn: () => flowApi.listCustomFieldDefinitions(accessToken ?? "", { project_id: item?.project_id }),
    enabled: Boolean(accessToken && item?.project_id),
    retry: 1
  });
  const customFieldValuesQuery = useQuery({
    queryKey: ["flow", "custom-field-values", id],
    queryFn: () => flowApi.listCustomFieldValues(accessToken ?? "", id),
    enabled: Boolean(accessToken && id),
    retry: 1
  });
  const customFieldDefinitions = customFieldDefinitionsQuery.data ?? [];
  const customFieldValues = customFieldValuesQuery.data ?? [];

  useEffect(() => {
    if (!item) return;
    setDraft({
      title: item.title,
      description: item.description ?? "",
      statusName: workflowStatusKeyFor(workflowQuery.data, item.status_id),
      priorityName: priorityNameFromId(item.priority_id),
      assigneeId: item.assignee_id ? String(item.assignee_id) : "",
      dueDate: item.due_date ? item.due_date.slice(0, 10) : "",
      effortScore: item.effort_score ? String(item.effort_score) : "",
      effortSize: item.effort_size ?? "",
      originalEstimateHours: item.original_estimate_minutes ? String(item.original_estimate_minutes / 60) : "",
      remainingEstimateHours: item.remaining_estimate_minutes ? String(item.remaining_estimate_minutes / 60) : "",
      businessValue: item.business_value ?? "",
      riskLevel: item.risk_level ?? "",
      complexity: item.complexity ?? "",
      acceptanceCriteria: item.acceptance_criteria ?? "",
      definitionOfDone: item.definition_of_done ?? "",
      parentId: item.parent_id ? String(item.parent_id) : "",
      itemLevel: (item.item_level ?? "work_item") as FlowItemLevel
    });
  }, [item, workflowQuery.data]);

  useEffect(() => {
    if (!customFieldDefinitions.length) return;
    const nextDraft: Record<number, string> = {};
    for (const definition of customFieldDefinitions) {
      const existing = customFieldValues.find((value) => value.custom_field_id === definition.id);
      nextDraft[definition.id] = existing?.value ?? "";
    }
    setCustomFieldDraft(nextDraft);
  }, [customFieldDefinitions, customFieldValues]);

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
      original_estimate_minutes: draft.originalEstimateHours ? Math.round(Number(draft.originalEstimateHours) * 60) : null,
      remaining_estimate_minutes: draft.remainingEstimateHours ? Math.round(Number(draft.remainingEstimateHours) * 60) : null,
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
      queryClient.invalidateQueries({ queryKey: ["flow", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
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
      queryClient.invalidateQueries({ queryKey: ["flow", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Comment failed", message: error instanceof Error ? error.message : "Unable to add comment." })
  });
  const uploadAttachmentMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("Choose a file before uploading.");
      return flowApi.uploadAttachment(accessToken ?? "", id, selectedFile, currentUser?.id);
    },
    onSuccess: () => {
      setSelectedFile(null);
      addToast({ type: "success", title: "Attachment uploaded" });
      queryClient.invalidateQueries({ queryKey: ["flow", "attachments", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Attachment upload failed", message: error instanceof Error ? error.message : "Unable to upload attachment." })
  });
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => flowApi.deleteAttachment(accessToken ?? "", id, attachmentId),
    onSuccess: () => {
      addToast({ type: "success", title: "Attachment deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "attachments", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Attachment delete failed", message: error instanceof Error ? error.message : "Unable to delete attachment." })
  });
  const workLogMutation = useMutation({
    mutationFn: () => flowApi.createWorkLog(accessToken ?? "", id, {
      user_id: currentUser?.id,
      description: workLogDescription.trim() || null,
      time_spent_minutes: Number(workLogMinutes)
    }),
    onSuccess: () => {
      setWorkLogMinutes("");
      setWorkLogDescription("");
      addToast({ type: "success", title: "Work log added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "work-logs", id] });
    },
    onError: (error) => addToast({ type: "error", title: "Work log failed", message: error instanceof Error ? error.message : "Unable to add work log." })
  });
  const deleteWorkLogMutation = useMutation({
    mutationFn: (workLogId: number) => flowApi.deleteWorkLog(accessToken ?? "", id, workLogId),
    onSuccess: () => {
      addToast({ type: "success", title: "Work log deleted" });
      queryClient.invalidateQueries({ queryKey: ["flow", "work-logs", id] });
    }
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
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Relation failed", message: error instanceof Error ? error.message : "Unable to add relation." })
  });
  const deleteRelationMutation = useMutation({
    mutationFn: (relationId: number) => flowApi.deleteRelation(accessToken ?? "", id, relationId),
    onSuccess: () => {
      addToast({ type: "success", title: "Relation removed" });
      queryClient.invalidateQueries({ queryKey: ["flow", "relations", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    }
  });
  const linkMutation = useMutation({
    mutationFn: () => flowApi.createLink(accessToken ?? "", id, {
      entity_type: linkType,
      entity_id: linkEntityId.trim(),
      entity_title: linkTitle.trim()
    }),
    onSuccess: () => {
      setLinkEntityId("");
      setLinkTitle("");
      addToast({ type: "success", title: "Link added" });
      queryClient.invalidateQueries({ queryKey: ["flow", "links", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Link failed", message: error instanceof Error ? error.message : "Unable to add link." })
  });
  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: number) => flowApi.deleteLink(accessToken ?? "", id, linkId),
    onSuccess: () => {
      addToast({ type: "success", title: "Link removed" });
      queryClient.invalidateQueries({ queryKey: ["flow", "links", id] });
      queryClient.invalidateQueries({ queryKey: ["flow", "audit-events"] });
    },
    onError: (error) => addToast({ type: "error", title: "Link remove failed", message: error instanceof Error ? error.message : "Unable to remove link." })
  });
  const releaseAssignmentMutation = useMutation<unknown, Error, number | null>({
    mutationFn: (releaseId: number | null) => {
      if (releaseId === null) {
        return flowApi.updateWorkItem(accessToken ?? "", id, { release_id: null });
      }
      return flowApi.assignWorkItemToRelease(accessToken ?? "", releaseId, id);
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Release assignment updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Release assignment failed", message: error instanceof Error ? error.message : "Unable to update release assignment." })
  });
  const sprintAssignmentMutation = useMutation({
    mutationFn: (sprintId: number | null) => flowApi.updateWorkItem(accessToken ?? "", id, { sprint_id: sprintId }),
    onSuccess: () => {
      addToast({ type: "success", title: "Sprint assignment updated" });
      queryClient.invalidateQueries({ queryKey: ["flow"] });
    },
    onError: (error) => addToast({ type: "error", title: "Sprint assignment failed", message: error instanceof Error ? error.message : "Unable to update sprint assignment." })
  });
  const customFieldMutation = useMutation({
    mutationFn: async () => {
      const definitions = customFieldDefinitionsQuery.data ?? [];
      for (const definition of definitions) {
        const value = customFieldDraft[definition.id] ?? "";
        if (definition.required && value === "") {
          throw new Error(`${definition.name} is required.`);
        }
        await flowApi.saveCustomFieldValue(accessToken ?? "", id, {
          custom_field_id: definition.id,
          value: normalizeCustomFieldValue(definition, value)
        });
      }
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Custom fields saved" });
      queryClient.invalidateQueries({ queryKey: ["flow", "custom-field-values", id] });
    },
    onError: (error) => addToast({ type: "error", title: "Custom field save failed", message: error instanceof Error ? error.message : "Unable to save custom fields." })
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
  const linksByType = groupLinksByType(linksQuery.data ?? []);
  const releases = releasesQuery.data ?? [];
  const currentRelease = releases.find((release) => release.id === item.release_id);
  const workLogs = workLogsQuery.data ?? [];
  const totalLoggedMinutes = workLogs.reduce((sum, log) => sum + log.time_spent_minutes, 0);
  const auditGroups = groupAuditEventsByDay(auditQuery.data ?? []);
  const compactAuditGroups = groupAuditEventsByDay((auditQuery.data ?? []).slice(0, 10));
  const sprints = sprintsQuery.data ?? [];
  const currentSprint = sprints.find((sprint) => sprint.id === item.sprint_id);

  return (
    <div className="space-y-4">
      <FlowSubnav />
      <EntityDetailLayout
        header={<EntityDetailHeader
          title={item.title}
          description={`Work item #${item.id}`}
          breadcrumbs={<FlowBreadcrumbs items={[{ label: "Work Items", href: "/flow/work-items" }, { label: item.title }]} />}
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
                      {validWorkflowTargets(workflowQuery.data, item.status_id).map((statusOption) => <option key={statusOption.key} value={statusOption.key}>{statusOption.name}</option>)}
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
                    <FlowMemberPicker value={draft.assigneeId} onChange={(nextValue) => setDraft((value) => ({ ...value, assigneeId: nextValue }))} />
                    <span className="text-xs text-muted-foreground">Members are resolved from project context, workspace members, then organization members.</span>
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
                      <span className="font-medium">Original estimate hours</span>
                      <Input inputMode="decimal" value={draft.originalEstimateHours} onChange={(event) => setDraft((value) => ({ ...value, originalEstimateHours: event.target.value }))} />
                    </label>
                    <label className="grid gap-1 text-sm">
                      <span className="font-medium">Remaining estimate hours</span>
                      <Input inputMode="decimal" value={draft.remainingEstimateHours} onChange={(event) => setDraft((value) => ({ ...value, remainingEstimateHours: event.target.value }))} />
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
                      <Select value={draft.parentId} onChange={(event) => setDraft((value) => ({ ...value, parentId: event.target.value }))}>
                        <option value="">No parent work</option>
                        {(relatedWorkQuery.data ?? [])
                          .filter((candidate) => candidate.id !== item.id && isValidParentOption(candidate.item_level ?? "work_item", draft.itemLevel))
                          .map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
                      </Select>
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
                  <StatusBadge value={workflowStatusLabelFor(workflowQuery.data, item.status_id)} />
                  <PriorityBadge value={item.priority_id} />
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Assignee: <FlowMemberDisplay userId={item.assignee_id} /></span>
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
              {(linksQuery.data ?? []).slice(0, 4).map((link) => (
                <div key={link.id} className="flex gap-2"><Activity className="mt-0.5 h-4 w-4" /> Linked {linkTypeLabel(link.entity_type)}: {link.entity_title}.</div>
              ))}
            </div>
          </EntityActivityPanel>
          <DetailPanel title="Planning">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div><div className="text-muted-foreground">Effort</div><div className="font-medium">{effortLabel(item.effort_size, item.effort_score)}</div></div>
              <div><div className="text-muted-foreground">Business Value</div><div className="font-medium">{planningLabel(item.business_value)}</div></div>
              <div><div className="text-muted-foreground">Risk</div><div className="font-medium">{planningLabel(item.risk_level)}</div></div>
              <div><div className="text-muted-foreground">Complexity</div><div className="font-medium">{planningLabel(item.complexity)}</div></div>
              <div><div className="text-muted-foreground">Original Estimate</div><div className="font-medium">{formatTimeMinutes(item.original_estimate_minutes)}</div></div>
              <div><div className="text-muted-foreground">Remaining Estimate</div><div className="font-medium">{formatTimeMinutes(item.remaining_estimate_minutes)}</div></div>
            </div>
          </DetailPanel>
          <DetailPanel title="Time Tracking">
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div><div className="text-muted-foreground">Original Estimate</div><div className="font-medium">{formatTimeMinutes(item.original_estimate_minutes)}</div></div>
                <div><div className="text-muted-foreground">Remaining Estimate</div><div className="font-medium">{formatTimeMinutes(item.remaining_estimate_minutes)}</div></div>
                <div><div className="text-muted-foreground">Time Logged</div><div className="font-medium">{formatTimeMinutes(totalLoggedMinutes)}</div></div>
              </div>
              <form className="grid gap-2 rounded-md border p-3" onSubmit={(event) => { event.preventDefault(); if (Number(workLogMinutes) > 0) workLogMutation.mutate(); }}>
                <Input aria-label="Time spent minutes" inputMode="numeric" placeholder="Time spent minutes" value={workLogMinutes} onChange={(event) => setWorkLogMinutes(event.target.value)} />
                <Input aria-label="Work log description" placeholder="Description optional" value={workLogDescription} onChange={(event) => setWorkLogDescription(event.target.value)} />
                <Button size="sm" disabled={Number(workLogMinutes) <= 0 || workLogMutation.isPending}>{workLogMutation.isPending ? "Adding..." : "Add Work Log"}</Button>
              </form>
              <div className="space-y-2">
                {workLogs.length === 0 ? <p className="rounded-md border border-dashed p-3 text-muted-foreground">No work logs yet.</p> : null}
                {workLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{formatTimeMinutes(log.time_spent_minutes)}</div>
                        <div className="text-xs text-muted-foreground">{log.logged_at ? new Date(log.logged_at).toLocaleString() : "Logged recently"} · {log.user_id ? `User ${log.user_id}` : "No user"}</div>
                        {log.description ? <p className="mt-1 text-muted-foreground">{log.description}</p> : null}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => deleteWorkLogMutation.mutate(log.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanel>
          <DetailPanel title="Custom Fields">
            {customFieldDefinitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom fields are configured for this project.</p>
            ) : (
              <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); customFieldMutation.mutate(); }}>
                <div className="grid gap-3 md:grid-cols-2">
                  {customFieldDefinitions.map((definition) => (
                    <label key={definition.id} className="grid gap-1 text-sm">
                      <span className="font-medium">{definition.name}{definition.required ? " *" : ""}</span>
                      <CustomFieldInput
                        definition={definition}
                        value={customFieldDraft[definition.id] ?? ""}
                        onChange={(value) => setCustomFieldDraft((current) => ({ ...current, [definition.id]: value }))}
                      />
                    </label>
                  ))}
                </div>
                <Button size="sm" disabled={customFieldMutation.isPending}>{customFieldMutation.isPending ? "Saving..." : "Save Custom Fields"}</Button>
              </form>
            )}
          </DetailPanel>
          <DetailPanel title="Release">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Current Release</div>
                <div className="font-medium">{currentRelease ? `${currentRelease.name} (${currentRelease.version})` : item.release_id ? `Release #${item.release_id}` : "No release assigned"}</div>
                {currentRelease ? <div className="text-xs text-muted-foreground">{currentRelease.status} · {currentRelease.completion_percentage}% complete</div> : null}
              </div>
              <label className="grid gap-1">
                <span className="font-medium">Assign Release</span>
                <Select
                  aria-label="Assign release"
                  value={item.release_id ? String(item.release_id) : ""}
                  disabled={releaseAssignmentMutation.isPending}
                  onChange={(event) => releaseAssignmentMutation.mutate(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">No release</option>
                  {releases.map((release) => <option key={release.id} value={release.id}>{release.name} · {release.version}</option>)}
                </Select>
              </label>
              {releases.length === 0 ? <p className="text-xs text-muted-foreground">Create releases from Flow Releases before assigning work.</p> : null}
            </div>
          </DetailPanel>
          <DetailPanel title="Sprint Membership">
            <div className="space-y-2 text-sm">
              <FlowBackLink href="/flow/work-items" label="Back to Work Items" />
              <div><div className="text-muted-foreground">Current Sprint</div><div className="font-medium">{currentSprint?.name ?? (item.sprint_id ? `Sprint #${item.sprint_id}` : "Backlog / not assigned to sprint")}</div></div>
              <label className="grid gap-1">
                <span className="font-medium">Sprint</span>
                <Select
                  aria-label="Assign sprint"
                  value={item.sprint_id ? String(item.sprint_id) : ""}
                  disabled={sprintAssignmentMutation.isPending}
                  onChange={(event) => sprintAssignmentMutation.mutate(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Backlog</option>
                  {sprints.filter((sprint) => sprint.status !== "completed" && sprint.status !== "cancelled").map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                </Select>
              </label>
              <p className="text-xs text-muted-foreground">Flow sprint path: Backlog → assign work item to sprint → start sprint → execute work → complete sprint.</p>
              <Link className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-muted" href="/flow/backlog">Assign from Backlog</Link>
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
            <div><div className="text-muted-foreground">Assignee</div><div className="font-medium"><FlowMemberDisplay userId={item.assignee_id} /></div></div>
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
                    <div className="mt-1 text-xs text-muted-foreground">{dependencySentence(item.title, relation.target_title ?? `FLOW-${relation.target_work_item_id}`, relation.relation_type)}</div>
                    {relation.description ? <p className="mt-1 text-muted-foreground">{relation.description}</p> : null}
                    <Button className="mt-2" size="sm" variant="outline" onClick={() => deleteRelationMutation.mutate(relation.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanel>
          <DetailPanel title="Linked Resources">
            <div className="space-y-4 text-sm">
              <form className="grid gap-2 rounded-md border p-3" onSubmit={(event) => { event.preventDefault(); if (linkEntityId.trim() && linkTitle.trim()) linkMutation.mutate(); }}>
                <div className="grid gap-2 md:grid-cols-[160px_1fr]">
                  <Select aria-label="Link type" value={linkType} onChange={(event) => setLinkType(event.target.value as LinkedEntityType)}>
                    {LINK_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                  <Input aria-label="Linked entity ID" placeholder="Entity ID" value={linkEntityId} onChange={(event) => setLinkEntityId(event.target.value)} />
                </div>
                <Input aria-label="Linked entity title" placeholder="Title" value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} />
                <Button size="sm" disabled={!linkEntityId.trim() || !linkTitle.trim() || linkMutation.isPending}>{linkMutation.isPending ? "Adding..." : "Add Link"}</Button>
              </form>
              {LINK_TYPE_OPTIONS.map((option) => {
                const links = linksByType[option.value] ?? [];
                return (
                  <section key={option.value} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium">{option.section}</h3>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{links.length}</span>
                    </div>
                    {links.length === 0 ? <p className="text-muted-foreground">No {option.section.toLowerCase()} linked yet.</p> : (
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div key={link.id} className="rounded-md bg-muted p-2">
                            <div className="font-medium">{link.entity_title}</div>
                            <div className="text-xs text-muted-foreground">{linkTypeLabel(link.entity_type)} · {link.entity_id}</div>
                            {link.entity_url ? <a className="text-xs text-primary hover:underline" href={link.entity_url}>Open resource</a> : null}
                            <Button className="mt-2" size="sm" variant="outline" disabled={deleteLinkMutation.isPending} onClick={() => deleteLinkMutation.mutate(link.id)}>Remove Link</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </DetailPanel>
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
      <DetailPanel title="Attachments">
        <div className="space-y-4">
          <form className="grid gap-2 rounded-md border p-3" onSubmit={(event) => { event.preventDefault(); uploadAttachmentMutation.mutate(); }}>
            <Input aria-label="Attachment file" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : "Images, PDFs, text files, docs, spreadsheets, and generic files are supported for dev upload."}</p>
              <Button size="sm" disabled={!selectedFile || uploadAttachmentMutation.isPending}>{uploadAttachmentMutation.isPending ? "Uploading..." : "Upload"}</Button>
            </div>
          </form>
          {attachmentsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading attachments...</p> : null}
          {!attachmentsQuery.isLoading && (attachmentsQuery.data ?? []).length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No attachments yet.</p> : null}
          <div className="space-y-2">
            {(attachmentsQuery.data ?? []).map((attachment) => (
              <div key={attachment.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <a className="font-medium text-primary hover:underline" href={attachmentHref(id, attachment.id, attachment.file_url)} target="_blank" rel="noreferrer">{attachment.file_name}</a>
                  <div className="text-xs text-muted-foreground">
                    {attachment.file_type ?? "File"} · {formatFileSize(attachment.file_size)} · Uploaded {attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleString() : "recently"}
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled={deleteAttachmentMutation.isPending} onClick={() => deleteAttachmentMutation.mutate(attachment.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      </DetailPanel>
      <DetailPanel title="Audit Trail">
        {auditQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading audit trail...</p> : null}
        {auditQuery.isError ? <p className="text-sm text-destructive">Unable to load audit trail.</p> : null}
        {!auditQuery.isLoading && !auditQuery.isError && auditGroups.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No audit events yet.</p>
        ) : (
          <div className="space-y-3">
            <AuditEventGroups grouped={compactAuditGroups} />
            {(auditQuery.data ?? []).length > 10 ? (
              <Link className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/activity">
                View Full Activity
              </Link>
            ) : null}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}

function formatFileSize(value?: number | null) {
  if (!value) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatTimeMinutes(value?: number | null) {
  if (!value) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function attachmentHref(workItemId: string, attachmentId: number, fileUrl?: string | null) {
  if (fileUrl?.startsWith("http://") || fileUrl?.startsWith("https://")) {
    return fileUrl;
  }
  return `${apiConfig.gatewayUrl}${flowApi.attachmentDownloadPath(workItemId, attachmentId)}`;
}

function groupLinksByType(links: LinkedEntity[]) {
  return links.reduce<Record<LinkedEntityType, LinkedEntity[]>>((groups, link) => {
    groups[link.entity_type] = [...(groups[link.entity_type] ?? []), link];
    return groups;
  }, {} as Record<LinkedEntityType, LinkedEntity[]>);
}

function linkTypeLabel(type: LinkedEntityType) {
  return LINK_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

function dependencySentence(sourceTitle: string, targetTitle: string, relationType: WorkItemRelationType) {
  if (relationType === "blocks") return `${sourceTitle} blocks ${targetTitle}`;
  if (relationType === "blocked_by") return `${sourceTitle} is waiting on ${targetTitle}`;
  if (relationType === "duplicate_of") return `${sourceTitle} duplicates ${targetTitle}`;
  return `${sourceTitle} is related to ${targetTitle}`;
}

function isValidParentOption(parentLevel: string, childLevel: FlowItemLevel) {
  if (childLevel === "initiative") return false;
  if (childLevel === "feature") return parentLevel === "initiative";
  if (childLevel === "work_item") return parentLevel === "initiative" || parentLevel === "feature";
  if (childLevel === "subtask") return parentLevel === "work_item";
  return false;
}

function CustomFieldInput({ definition, value, onChange }: { definition: CustomFieldDefinition; value: string; onChange: (value: string) => void }) {
  if (definition.field_type === "select") {
    return (
      <Select value={value} required={definition.required} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {(definition.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    );
  }
  if (definition.field_type === "checkbox") {
    return (
      <label className="flex items-center gap-2 rounded-md border px-3 py-2">
        <input type="checkbox" checked={value === "true"} onChange={(event) => onChange(event.target.checked ? "true" : "false")} />
        <span>{value === "true" ? "Checked" : "Unchecked"}</span>
      </label>
    );
  }
  return (
    <Input
      type={definition.field_type === "number" ? "number" : definition.field_type === "date" ? "date" : "text"}
      value={value}
      required={definition.required}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function normalizeCustomFieldValue(definition: CustomFieldDefinition, value: string) {
  if (definition.field_type === "checkbox") {
    return value === "true";
  }
  if (definition.field_type === "number" && value !== "") {
    return Number(value);
  }
  return value || null;
}
