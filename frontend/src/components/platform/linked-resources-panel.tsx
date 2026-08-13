"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailPanel } from "@/components/modules/detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { platformApi } from "@/services/api/platform-api";
import { useAuthStore } from "@/stores/auth-store";
import type { CrossModuleLink, OperationalEntityType, RelationshipCreate } from "@/types/platform";

const ENTITY_OPTIONS: Array<{ value: OperationalEntityType; label: string }> = [
  { value: "flow_work_item", label: "Flow Work Item" },
  { value: "docs_page", label: "Docs Page" },
  { value: "discover_idea", label: "Discover Idea" },
  { value: "desk_ticket", label: "Desk Ticket" },
  { value: "collab_thread", label: "Collab Thread" },
  { value: "pulse_incident", label: "Pulse Incident" }
];

const RELATIONSHIP_OPTIONS: RelationshipCreate["relationship_type"][] = ["relates_to", "blocks", "references", "originates_from", "documents", "supports", "duplicates"];

type LinkedResourcesPanelProps = {
  entityType: OperationalEntityType;
  entityId: string | number;
  entityTitle: string;
  title?: string;
};

export function LinkedResourcesPanel({ entityType, entityId, entityTitle, title = "Linked Resources" }: LinkedResourcesPanelProps) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<OperationalEntityType>("docs_page");
  const [targetId, setTargetId] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipCreate["relationship_type"]>("relates_to");
  const queryKey = ["platform", "relationships", entityType, String(entityId)];

  const relationshipsQuery = useQuery({
    queryKey,
    queryFn: () => platformApi.listEntityRelationships(accessToken ?? "", entityType, entityId),
    enabled: Boolean(accessToken && entityId),
    retry: 1
  });

  const relationships = relationshipsQuery.data?.items ?? [];
  const visibleRelationships = useMemo(() => relationships.map((relationship) => toVisibleRelationship(relationship, entityType, entityId)), [entityId, entityType, relationships]);

  const createMutation = useMutation({
    mutationFn: () => platformApi.createRelationship(accessToken ?? "", {
      source_type: entityType,
      source_id: entityId,
      source_title: entityTitle,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      relationship_type: relationshipType,
      created_by: currentUser?.id
    }),
    onSuccess: () => {
      setTargetId("");
      setTargetTitle("");
      setRelationshipType("relates_to");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["platform", "relationships"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (relationshipId: string) => platformApi.deleteRelationship(accessToken ?? "", relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["platform", "relationships"] });
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetId.trim() || !targetTitle.trim()) return;
    createMutation.mutate();
  };

  return (
    <DetailPanel title={title}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Connect this item to related work, docs, ideas, tickets, discussions, and incidents.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>Link Existing Resource</Button>
        </div>
        {open ? (
          <form className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[170px_130px_1fr_170px_auto]" onSubmit={handleSubmit}>
            <Select aria-label="Linked resource type" value={targetType} onChange={(event) => setTargetType(event.target.value as OperationalEntityType)}>
              {ENTITY_OPTIONS.filter((option) => option.value !== entityType).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            <Input aria-label="Linked resource ID" placeholder="ID" value={targetId} onChange={(event) => setTargetId(event.target.value)} />
            <Input aria-label="Linked resource title" placeholder="Title" value={targetTitle} onChange={(event) => setTargetTitle(event.target.value)} />
            <Select aria-label="Relationship type" value={relationshipType} onChange={(event) => setRelationshipType(event.target.value as RelationshipCreate["relationship_type"])}>
              {RELATIONSHIP_OPTIONS.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
            </Select>
            <Button disabled={createMutation.isPending || !targetId.trim() || !targetTitle.trim()}>{createMutation.isPending ? "Linking..." : "Link"}</Button>
          </form>
        ) : null}
        {relationshipsQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading linked resources...</div> : visibleRelationships.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No linked resources yet.</div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[140px_1fr_160px_160px] border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              <span>Type</span>
              <span>Title</span>
              <span>Relationship</span>
              <span>Actions</span>
            </div>
            {visibleRelationships.map((item) => (
              <div key={item.id} className="grid grid-cols-[140px_1fr_160px_160px] items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0">
                <span>{formatLabel(item.entity.entity_type)}</span>
                <span className="font-medium">{item.entity.title}</span>
                <span className="text-muted-foreground">{formatLabel(item.relationshipType)}</span>
                <span className="flex gap-2">
                  <Link className="text-primary hover:underline" href={item.entity.href}>Open</Link>
                  <button className="text-muted-foreground hover:text-destructive" type="button" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}>Remove</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailPanel>
  );
}

function toVisibleRelationship(relationship: CrossModuleLink, entityType: OperationalEntityType, entityId: string | number) {
  const source = relationship.source ?? relationship.from;
  const target = relationship.target ?? relationship.to;
  const currentIsSource = relationship.source_type === entityType && String(relationship.source_id) === String(entityId);
  const currentIsOldSource = source.entity_type === entityType && String(source.entity_id) === String(entityId);
  return {
    id: relationship.id,
    relationshipType: relationship.relationship_type ?? relationship.relation,
    entity: currentIsSource || currentIsOldSource ? target : source
  };
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
