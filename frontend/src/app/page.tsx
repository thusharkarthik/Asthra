import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

const sections = [
  { title: "Recent Work", items: ["Flow service hardening", "Workspace memory foundation", "Assistant shell planning"] },
  { title: "Recent Docs", items: ["Platform RAG", "Tool registry", "Frontend architecture"] },
  { title: "Assigned Items", items: ["Review gateway routes", "Verify local compose", "Prepare module backlog"] },
  { title: "Activity Feed", items: ["Memory indexed workspace context", "AI feature pack tests passed", "Docs updated"] },
  { title: "AI Suggestions", items: ["Summarize current milestone", "Find service gaps", "Draft next sprint plan"] }
];

export default function HomePage() {
  return (
    <>
      <PageHeader title="Home" description="Workspace overview for the Asthra platform shell." />
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
