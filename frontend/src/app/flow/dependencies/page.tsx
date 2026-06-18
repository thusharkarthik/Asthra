"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { FLOW_RELATION_TYPE_OPTIONS } from "@/components/flow/flow-utils";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge } from "@/components/modules/priority-badge";
import { StatusBadge } from "@/components/modules/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { WorkItemRelationType } from "@/types/flow";

export default function FlowDependenciesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState<WorkItemRelationType>("blocks");
  const [description, setDescription] = useState("");

  const workItemsQuery = useQuery({
    queryKey: ["flow", "dependency-work-items", selectedProjectId],
    queryFn: () => flowApi.listWorkItems(accessToken ?? "", { project_id: selectedProjectId, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const source = (workItemsQuery.data ?? []).find((item) => String(item.id) === sourceId);
  const relationsQuery = useQuery({
    queryKey: ["flow", "dependency-relations", sourceId],
    queryFn: () => flowApi.listRelations(accessToken ?? "", sourceId),
    enabled: Boolean(accessToken && sourceId),
    retry: 1
  });
  const addMutation = useMutation({
    mutationFn: () => flowApi.createRelation(accessToken ?? "", sourceId, {
      target_work_item_id: Number(targetId),
      relation_type: relationType,
      description: description.trim() || null
    }),
    onSuccess: () => {
      addToast({ type: "success", title: "Relation added" });
      setTargetId("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["flow", "dependency-relations", sourceId] });
    },
    onError: (error) => addToast({ type: "error", title: "Relation failed", message: error instanceof Error ? error.message : "Unable to add relation." })
  });
  const removeMutation = useMutation({
    mutationFn: (relationId: number) => flowApi.deleteRelation(accessToken ?? "", sourceId, relationId),
    onSuccess: () => {
      addToast({ type: "success", title: "Relation removed" });
      queryClient.invalidateQueries({ queryKey: ["flow", "dependency-relations", sourceId] });
    }
  });

  const grouped = FLOW_RELATION_TYPE_OPTIONS.map((option) => ({
    ...option,
    items: (relationsQuery.data ?? []).filter((relation) => relation.relation_type === option.value)
  }));

  return (
    <>
      <PageHeader title="Dependencies" description="Track blocks, blocked by, related work, and duplicate relationships." />
      <FlowSubnav />
      {!selectedProjectId ? <EmptyState title="Select a project to view dependencies" /> : workItemsQuery.isLoading ? <LoadingState /> : (
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Add Relation</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-5">
              <Select aria-label="Source work item" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
                <option value="">Source item</option>
                {(workItemsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
              <Select aria-label="Target work item" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
                <option value="">Target item</option>
                {(workItemsQuery.data ?? []).filter((item) => String(item.id) !== sourceId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
              <Select aria-label="Relation type" value={relationType} onChange={(event) => setRelationType(event.target.value as WorkItemRelationType)}>
                {FLOW_RELATION_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <Input aria-label="Relation description" placeholder="Description optional" value={description} onChange={(event) => setDescription(event.target.value)} />
              <Button disabled={!sourceId || !targetId || addMutation.isPending} onClick={() => addMutation.mutate()}>{addMutation.isPending ? "Adding..." : "Add Relation"}</Button>
            </div>
          </section>
          {!source ? <EmptyState title="Select a source work item to view dependency groups" /> : (
            <section className="rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">Relations for {source.title}</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {grouped.map((group) => (
                  <div key={group.value} className="rounded-md border p-3">
                    <h3 className="text-sm font-semibold">{dependencyGroupTitle(group.value)}</h3>
                    <div className="mt-2 space-y-2">
                      {group.items.length === 0 ? <p className="text-sm text-muted-foreground">No {group.label.toLowerCase()} relations.</p> : group.items.map((relation) => (
                        <div key={relation.id} className="rounded-md border bg-background p-3 text-sm">
                          <Link href={`/flow/work-items/${relation.target_work_item_id}`} className="font-medium text-primary hover:underline">{relation.target_title ?? `Work item #${relation.target_work_item_id}`}</Link>
                          <div className="mt-2 flex flex-wrap gap-2"><StatusBadge value={relation.target_status_id} /><PriorityBadge value={relation.target_priority_id} /><span>{dependencySentence(source.title, relation.target_title ?? `FLOW-${relation.target_work_item_id}`, relation.relation_type)}</span></div>
                          {relation.description ? <p className="mt-2 text-muted-foreground">{relation.description}</p> : null}
                          <Button className="mt-2" size="sm" variant="outline" onClick={() => removeMutation.mutate(relation.id)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function dependencyGroupTitle(type: WorkItemRelationType) {
  if (type === "blocks") return "This work blocks";
  if (type === "blocked_by") return "This work is waiting on";
  if (type === "duplicate_of") return "Duplicates";
  return "Related work";
}

function dependencySentence(sourceTitle: string, targetTitle: string, relationType: WorkItemRelationType) {
  if (relationType === "blocks") return `${sourceTitle} blocks ${targetTitle}`;
  if (relationType === "blocked_by") return `${sourceTitle} waiting on ${targetTitle}`;
  if (relationType === "duplicate_of") return `${sourceTitle} duplicates ${targetTitle}`;
  return `${sourceTitle} related to ${targetTitle}`;
}
