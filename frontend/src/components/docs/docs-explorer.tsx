import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import type { Page, Space } from "@/types/docs";

export function DocsExplorer({ spaces, pages }: { spaces: Space[]; pages: Page[] }) {
  if (spaces.length === 0) {
    return (
      <section className="rounded-lg border border-dashed p-4">
        <div className="text-sm font-medium">No spaces yet</div>
        <p className="mt-1 text-sm text-muted-foreground">Create a space to start organizing pages.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3 text-sm font-semibold">Docs Explorer</div>
      <div className="space-y-4 p-4">
        {spaces.map((space) => {
          const spacePages = pages.filter((page) => page.space_id === space.id);
          return (
            <div key={space.id} className="space-y-2">
              <Link href={`/docs/spaces/${space.id}`} className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                <FolderOpen className="h-4 w-4 text-primary" />
                {space.name}
              </Link>
              <div className="ml-6 space-y-1 border-l pl-3">
                {spacePages.length === 0 ? <div className="text-xs text-muted-foreground">No pages in this space.</div> : spacePages.map((page) => (
                  <Link key={page.id} href={`/docs/pages/${page.id}`} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {page.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
