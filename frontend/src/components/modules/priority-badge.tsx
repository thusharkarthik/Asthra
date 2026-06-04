const labels: Record<number | string, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical"
};

export function PriorityBadge({ value }: { value?: number | string | null }) {
  const label = value === null || value === undefined ? "Unknown" : labels[value] ?? String(value);
  return <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{label}</span>;
}
