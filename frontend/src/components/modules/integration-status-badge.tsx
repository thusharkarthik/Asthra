const classes: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-800",
  error: "bg-red-100 text-red-800",
  connected: "bg-emerald-100 text-emerald-800",
  disconnected: "bg-slate-100 text-slate-800",
  pending: "bg-slate-100 text-slate-800",
  running: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800"
};

export function IntegrationStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? "inactive";
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${classes[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
