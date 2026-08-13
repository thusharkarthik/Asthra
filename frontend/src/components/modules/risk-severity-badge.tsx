const classes: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

export function RiskSeverityBadge({ value }: { value?: string | null }) {
  const severity = value ?? "medium";
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-xs font-medium ${classes[severity] ?? "bg-muted text-muted-foreground"}`}>{severity}</span>;
}
