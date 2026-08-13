import { DataTablePlaceholder } from "@/components/layout/data-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataTablePlaceholder />
        <EmptyState title={`${title} module workspace`} />
      </div>
    </>
  );
}
