const classes: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800",
  in_progress: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  draft: "bg-slate-100 text-slate-800",
  active: "bg-emerald-100 text-emerald-800",
  disabled: "bg-amber-100 text-amber-800",
  archived: "bg-zinc-100 text-zinc-800",
  open: "bg-red-100 text-red-800",
  accepted: "bg-amber-100 text-amber-800",
  mitigated: "bg-sky-100 text-sky-800",
  closed: "bg-emerald-100 text-emerald-800"
};

export function ComplianceStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? "pending";
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${classes[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
