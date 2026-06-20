"use client";

import { ClipboardCheck, Gauge, Inbox, Ticket } from "lucide-react";

export function DeskHeaderActions({
  onCreateTicket,
  onCreateQueue,
  onCreateSla,
  onCreateChangeRequest
}: {
  onCreateTicket?: () => void;
  onCreateQueue?: () => void;
  onCreateSla?: () => void;
  onCreateChangeRequest?: () => void;
}) {
  const buttonBase = "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium disabled:opacity-50";
  return (
    <>
      <button className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`} type="button" onClick={onCreateTicket} disabled={!onCreateTicket}><Ticket className="h-4 w-4" />Create Ticket</button>
      <button className={`${buttonBase} border bg-background hover:bg-muted`} type="button" onClick={onCreateQueue} disabled={!onCreateQueue}><Inbox className="h-4 w-4" />Create Queue</button>
      <button className={`${buttonBase} border bg-background hover:bg-muted`} type="button" onClick={onCreateSla} disabled={!onCreateSla}><Gauge className="h-4 w-4" />Add SLA</button>
      <button className={`${buttonBase} border bg-background hover:bg-muted`} type="button" onClick={onCreateChangeRequest} disabled={!onCreateChangeRequest}><ClipboardCheck className="h-4 w-4" />Create Change Request</button>
    </>
  );
}
