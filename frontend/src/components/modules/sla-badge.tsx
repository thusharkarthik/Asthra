const statusClasses: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-100 text-slate-800"
};

export function SLABadge({ value }: { value?: string | null }) {
  const status = value ?? "pending";
  return (
    <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${statusClasses[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
