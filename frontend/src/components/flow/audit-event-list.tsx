"use client";

import Link from "next/link";
import type { FlowAuditEvent } from "@/types/flow";

export function AuditEventGroups({ grouped }: { grouped: Array<{ day: string; events: FlowAuditEvent[] }> }) {
  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section key={group.day} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{group.day}</h3>
          <div className="space-y-2">
            {group.events.map((event) => <AuditEventRow key={event.id} event={event} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AuditEventRow({ event }: { event: FlowAuditEvent }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-medium">{actorLabel(event)} {actionLabel(event.action)}</div>
        <time className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</time>
      </div>
      {event.old_value !== undefined || event.new_value !== undefined ? (
        <div className="mt-2 text-muted-foreground">
          <span>{event.old_value ?? "None"}</span>
          <span className="px-2">→</span>
          <span>{event.new_value ?? "None"}</span>
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{event.entity_type}</span>
        <span>{event.action}</span>
        {event.work_item_id ? <Link className="text-primary hover:underline" href={`/flow/work-items/${event.work_item_id}`}>Work item #{event.work_item_id}</Link> : null}
      </div>
    </div>
  );
}

export function groupAuditEventsByDay(events: FlowAuditEvent[]) {
  const groups = new Map<string, FlowAuditEvent[]>();
  for (const event of events) {
    const day = new Date(event.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return Array.from(groups, ([day, groupedEvents]) => ({ day, events: groupedEvents }));
}

function actorLabel(event: FlowAuditEvent) {
  if (event.actor_name) return event.actor_name;
  if (event.actor_id === 0) return "System";
  if (event.actor_id) return `User ${event.actor_id}`;
  return "Someone";
}

function actionLabel(action: string) {
  return action.replaceAll("_", " ").replaceAll(".", " ");
}
