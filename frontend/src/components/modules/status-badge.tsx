import { cn } from "@/lib/utils";

const labels: Record<number | string, string> = {
  1: "Todo",
  2: "In progress",
  3: "Review",
  4: "Done",
  draft: "Draft",
  published: "Published",
  archived: "Archived"
};

export function StatusBadge({ value }: { value?: number | string | null }) {
  const label = value === null || value === undefined ? "Unknown" : labels[value] ?? String(value);
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", label === "Done" && "border-green-500/40 text-green-700")}>
      {label}
    </span>
  );
}
