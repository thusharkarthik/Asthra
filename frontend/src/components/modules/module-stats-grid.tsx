import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";

export type ModuleStat = {
  title: string;
  value: string | number;
  description?: string;
};

export function ModuleStatsGrid({ stats }: { stats: ModuleStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <ModuleDashboardCard key={stat.title} title={stat.title} value={stat.value}>
          {stat.description ? <p className="text-sm text-muted-foreground">{stat.description}</p> : null}
        </ModuleDashboardCard>
      ))}
    </div>
  );
}
