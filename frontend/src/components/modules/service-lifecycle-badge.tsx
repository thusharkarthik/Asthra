const classes: Record<string, string> = {
  experimental: "bg-violet-100 text-violet-800",
  active: "bg-emerald-100 text-emerald-800",
  deprecated: "bg-amber-100 text-amber-800",
  retired: "bg-slate-100 text-slate-800"
};

export function ServiceLifecycleBadge({ value }: { value?: string | null }) {
  const status = value ?? "active";
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${classes[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
