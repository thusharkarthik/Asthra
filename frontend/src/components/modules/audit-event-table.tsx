import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { RiskSeverityBadge } from "@/components/modules/risk-severity-badge";

export function AuditEventTable({ events }: { events: Array<{ id: number; action: string; severity?: string | null; entity_type?: string | null; actor_user_id?: number | null }> }) {
  if (events.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No audit events yet.</div>;
  }
  return (
    <EntityTable columns={["Action", "Severity", "Entity", "Actor"]}>
      {events.map((event) => (
        <EntityTableRow key={event.id} columns={4}>
          <span className="font-medium">{event.action}</span>
          <RiskSeverityBadge value={event.severity} />
          <span>{event.entity_type ?? "General"}</span>
          <span>{event.actor_user_id ?? "System"}</span>
        </EntityTableRow>
      ))}
    </EntityTable>
  );
}
