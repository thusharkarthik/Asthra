import { PageHeader } from "@/components/layout/page-header";
import { EntityBadge } from "@/components/modules/product-experience";

const rows = [
  { module: "Core", create: "ready", list: "ready", detail: "partial", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" },
  { module: "Flow", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "ready", filters: "ready", empty: "ready" },
  { module: "Docs", create: "ready", list: "ready", detail: "ready", update: "ready", delete: "planned", search: "ready", filters: "partial", empty: "ready" },
  { module: "Discover", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "partial", filters: "ready", empty: "ready" },
  { module: "Desk", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "partial", filters: "ready", empty: "ready" },
  { module: "Pulse", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "partial", filters: "partial", empty: "ready" },
  { module: "Dev", create: "partial", list: "ready", detail: "partial", update: "partial", delete: "planned", search: "partial", filters: "partial", empty: "ready" },
  { module: "Collab", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "partial", filters: "partial", empty: "ready" },
  { module: "Automation", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" },
  { module: "Connect", create: "ready", list: "ready", detail: "partial", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" },
  { module: "Guard", create: "partial", list: "ready", detail: "partial", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" },
  { module: "Insights", create: "ready", list: "ready", detail: "partial", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" },
  { module: "Media", create: "ready", list: "ready", detail: "ready", update: "partial", delete: "planned", search: "planned", filters: "partial", empty: "ready" }
];

const columns = ["Create", "List", "Detail", "Update", "Delete/Archive", "Search", "Filters", "Empty States"];

export default function CrudChecklistPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="CRUD Checklist" description="Internal product-readiness matrix for manual UI testing across Asthra modules." />
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-medium">Module</th>
                {columns.map((column) => <th key={column} className="p-3 font-medium">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.module} className="border-b last:border-b-0">
                  <td className="p-3 font-medium">{row.module}</td>
                  <td className="p-3"><ChecklistBadge value={row.create} /></td>
                  <td className="p-3"><ChecklistBadge value={row.list} /></td>
                  <td className="p-3"><ChecklistBadge value={row.detail} /></td>
                  <td className="p-3"><ChecklistBadge value={row.update} /></td>
                  <td className="p-3"><ChecklistBadge value={row.delete} /></td>
                  <td className="p-3"><ChecklistBadge value={row.search} /></td>
                  <td className="p-3"><ChecklistBadge value={row.filters} /></td>
                  <td className="p-3"><ChecklistBadge value={row.empty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">Manual testing order</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with Core setup, then test Flow and Docs creation, then move through Discover, Desk, Pulse, Dev, Collab, Automation, Connect, Guard, Insights, and Media.
        </p>
      </section>
    </div>
  );
}

function ChecklistBadge({ value }: { value: string }) {
  const label = value === "ready" ? "Ready" : value === "partial" ? "Partial" : "Planned";
  return <EntityBadge value={label} />;
}
