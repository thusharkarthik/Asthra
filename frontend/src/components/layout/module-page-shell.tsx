import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModuleState, ErrorState, PageLoading } from "@/components/layout/ui-states";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";

export type ModuleSummaryCard = {
  title: string;
  value?: string | number;
  description?: string;
};

export function ModulePageShell({
  title,
  description,
  actions,
  summary,
  isLoading,
  error,
  empty,
  onRetry,
  children
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  summary?: ModuleSummaryCard[];
  isLoading?: boolean;
  error?: unknown;
  empty?: { title: string; description?: string };
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} actions={actions} />
      {summary && summary.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {summary.map((card) => (
            <ModuleDashboardCard key={card.title} title={card.title} value={card.value}>
              {card.description ? <p className="text-sm text-muted-foreground">{card.description}</p> : null}
            </ModuleDashboardCard>
          ))}
        </section>
      ) : null}
      {isLoading ? <PageLoading label={`Loading ${title}...`} /> : error ? (
        <ErrorState title={`Unable to load ${title}`} description="The page is still available. Retry after checking the API Gateway." onRetry={onRetry} />
      ) : empty ? (
        <EmptyModuleState title={empty.title} description={empty.description} />
      ) : (
        <section>{children}</section>
      )}
    </div>
  );
}
