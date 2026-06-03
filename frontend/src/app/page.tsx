"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { useWorkspaceContextQueries } from "@/hooks/use-workspace-context";
import { useWorkspaceStore } from "@/stores/workspace-store";

const sections = [
  { title: "Recent Work", items: ["Flow service hardening", "Workspace memory foundation", "Assistant shell planning"] },
  { title: "Recent Docs", items: ["Platform RAG", "Tool registry", "Frontend architecture"] },
  { title: "Assigned Items", items: ["Review gateway routes", "Verify local compose", "Prepare module backlog"] },
  { title: "Activity Feed", items: ["Memory indexed workspace context", "AI feature pack tests passed", "Docs updated"] },
  { title: "AI Suggestions", items: ["Summarize current milestone", "Find service gaps", "Draft next sprint plan"] }
];

export default function HomePage() {
  const { isLoading, error } = useWorkspaceContextQueries();
  const { organizations, workspaces, projects } = useWorkspaceStore();
  const countCards = [
    { title: "Organizations", value: organizations.length, description: "Available core organizations" },
    { title: "Workspaces", value: workspaces.length, description: "Workspaces in the selected organization" },
    { title: "Projects", value: projects.length, description: "Projects in the selected workspace" }
  ];

  return (
    <>
      <PageHeader title="Home" description="Workspace overview for the Asthra platform shell." />
      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Unable to load workspace context. The shell is still available.
        </div>
      )}
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        {countCards.map((card) => (
          <DashboardCard key={card.title} title={card.title}>
            <div className="text-3xl font-semibold">{isLoading ? "-" : card.value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
          </DashboardCard>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <DashboardCard key={section.title} title={section.title}>
            <ul className="space-y-2 text-sm">
              {section.items.map((item) => (
                <li key={item} className="rounded-md bg-muted px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </DashboardCard>
        ))}
      </section>
    </>
  );
}
