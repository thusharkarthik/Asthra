"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuditEventGroups, groupAuditEventsByDay } from "@/components/flow/audit-event-list";
import { FlowSubnav } from "@/components/flow/flow-subnav";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState, ErrorState, PageLoading } from "@/components/layout/ui-states";
import { DetailPanel } from "@/components/modules/detail-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const ACTION_OPTIONS = [
  "",
  "work_item.created",
  "work_item.updated",
  "work_item.archived",
  "status.changed",
  "priority.changed",
  "assignee.changed",
  "comment.added",
  "attachment.uploaded",
  "relation.added",
  "link.linked"
];

export default function FlowActivityPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState("");

  const auditQuery = useQuery({
    queryKey: ["flow", "audit-events", selectedProjectId, search, action, actorId],
    queryFn: () => flowApi.listAuditEvents(accessToken ?? "", {
      project_id: selectedProjectId,
      search: search.trim() || null,
      action: action || null,
      actor_id: actorId ? Number(actorId) : null,
      limit: 100
    }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const grouped = useMemo(() => groupAuditEventsByDay(auditQuery.data ?? []), [auditQuery.data]);

  if (!selectedProjectId) {
    return (
      <>
        <PageHeader title="Flow Activity" description="Review project audit history." />
        <FlowSubnav />
        <EmptyModuleState title="Select a project" description="Project activity is scoped to the selected project." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Flow Activity" description="Latest audit events for work items, comments, attachments, relations, and links." />
      <FlowSubnav />
      <DetailPanel title="Filters">
        <div className="grid gap-2 md:grid-cols-[1fr_220px_160px_auto]">
          <Input aria-label="Search audit events" placeholder="Search actor, action, or values" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select aria-label="Audit action" value={action} onChange={(event) => setAction(event.target.value)}>
            {ACTION_OPTIONS.map((option) => <option key={option || "all"} value={option}>{option || "All actions"}</option>)}
          </Select>
          <Input aria-label="Actor ID" inputMode="numeric" placeholder="Actor ID" value={actorId} onChange={(event) => setActorId(event.target.value)} />
          <Button variant="outline" onClick={() => { setSearch(""); setAction(""); setActorId(""); }}>Clear</Button>
        </div>
      </DetailPanel>
      <DetailPanel title="Project Audit Trail">
        {auditQuery.isLoading ? <PageLoading label="Loading audit events..." /> : null}
        {auditQuery.isError ? <ErrorState title="Audit events failed to load" description="Check flow-service and retry." onRetry={() => auditQuery.refetch()} /> : null}
        {!auditQuery.isLoading && !auditQuery.isError && (auditQuery.data ?? []).length === 0 ? (
          <EmptyModuleState title="No audit events yet" description="Editing work items, comments, attachments, relations, or links will create audit events." />
        ) : null}
        <AuditEventGroups grouped={grouped} />
      </DetailPanel>
    </>
  );
}
