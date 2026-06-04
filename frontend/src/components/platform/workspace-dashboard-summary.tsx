import Link from "next/link";
import type { WorkspaceDashboardSummary } from "@/types/platform";

export function WorkspaceDashboardSummaryCards({ summary }: { summary: WorkspaceDashboardSummary }) {
  const cards = [
    summary.work,
    summary.docs,
    summary.discovery,
    summary.desk,
    summary.pulse ?? summary.incidents,
    summary.dev ?? summary.engineering,
    summary.ai
  ].filter((card): card is { label: string; value: string | number; href: string } => Boolean(card));
  return (
    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="rounded-lg border bg-card p-3 hover:bg-muted">
          <div className="text-2xl font-semibold">{card.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{card.label}</div>
        </Link>
      ))}
    </div>
  );
}
