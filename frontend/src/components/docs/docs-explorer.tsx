import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import type { Page, Space } from "@/types/docs";

function PageTree({ pages, parentPageId = null, depth = 0 }: { pages: Page[]; parentPageId?: number | null; depth?: number }) {
  const children = pages.filter((page) => (page.parent_page_id ?? null) === parentPageId);
  if (children.length === 0) {
    return parentPageId === null ? <div className="text-xs text-muted-foreground">No pages in this space.</div> : null;
  }

  return (
    <div className={depth === 0 ? "space-y-1" : "ml-4 space-y-1 border-l pl-3"}>
      {children.map((page) => (
        <div key={page.id} className="space-y-1">
          <Link href={`/docs/pages/${page.id}`} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {page.title}
          </Link>
          <PageTree pages={pages} parentPageId={page.id} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

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
                <PageTree pages={spacePages} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
