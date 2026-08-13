const classes: Record<string, string> = {
  image: "bg-sky-100 text-sky-800",
  video: "bg-violet-100 text-violet-800",
  audio: "bg-amber-100 text-amber-800",
  document: "bg-emerald-100 text-emerald-800",
  other: "bg-slate-100 text-slate-800"
};

export function MediaTypeBadge({ value }: { value?: string | null }) {
  const type = value ?? "other";
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${classes[type] ?? "bg-muted text-muted-foreground"}`}>{type}</span>;
}
