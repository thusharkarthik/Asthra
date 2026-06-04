const roadmapClasses: Record<string, string> = {
  planned: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  shipped: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-800"
};

export function RoadmapStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? "planned";
  return (
    <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${roadmapClasses[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
