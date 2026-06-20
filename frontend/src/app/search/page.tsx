"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingState } from "@/components/layout/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTable, EntityTableRow } from "@/components/modules/entity-table";
import { ModuleDashboardCard } from "@/components/modules/module-dashboard-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { platformApi } from "@/services/api/platform-api";
import { useAuthStore } from "@/stores/auth-store";

const MODULES = ["flow", "docs", "discover", "desk", "collab", "pulse"];
const TYPES = ["flow_work_item", "docs_page", "discover_idea", "desk_ticket", "collab_thread", "pulse_incident"];

export default function PlatformSearchPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [entityType, setEntityType] = useState("");
  const searchQuery = useQuery({
    queryKey: ["platform", "search", query, module, entityType],
    queryFn: () => platformApi.search(accessToken ?? "", { q: query, module, entity_type: entityType }),
    enabled: Boolean(accessToken),
    retry: 1
  });
  const grouped = useMemo(() => {
    const items = searchQuery.data?.items ?? [];
    return items.reduce<Record<string, typeof items>>((groups, item) => {
      groups[item.source] = groups[item.source] ?? [];
      groups[item.source].push(item);
      return groups;
    }, {});
  }, [searchQuery.data?.items]);

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Search across ideas, pages, work items, tickets, incidents, and threads." />
      <ModuleDashboardCard title="Unified Search">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
          <Input aria-label="Search platform" placeholder="Search Asthra" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select aria-label="Filter module" value={module} onChange={(event) => setModule(event.target.value)}>
            <option value="">All modules</option>
            {MODULES.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}
          </Select>
          <Select aria-label="Filter type" value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            <option value="">All types</option>
            {TYPES.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}
          </Select>
        </div>
      </ModuleDashboardCard>
      {searchQuery.isLoading ? <LoadingState /> : searchQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Unable to search platform entities.</div>
      ) : (searchQuery.data?.items ?? []).length === 0 ? <EmptyState title="No results found" /> : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([source, items]) => (
            <ModuleDashboardCard key={source} title={formatLabel(source)}>
              <EntityTable columns={["Title", "Type", "Module", "Open"]}>
                {items.map((item) => (
                  <EntityTableRow key={`${item.entity_type}-${item.entity_id}`} columns={4}>
                    <span className="font-medium">{item.title}</span>
                    <span>{formatLabel(item.entity_type)}</span>
                    <span>{formatLabel(item.source)}</span>
                    <Link className="text-primary hover:underline" href={item.href}>Open</Link>
                  </EntityTableRow>
                ))}
              </EntityTable>
            </ModuleDashboardCard>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
