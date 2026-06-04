import Link from "next/link";
import { FilePlus2, Files, FolderOpen, Plus } from "lucide-react";

export function DocsHeaderActions({ onCreateSpace, onCreatePage }: { onCreateSpace?: () => void; onCreatePage?: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onCreateSpace}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        disabled={!onCreateSpace}
      >
        <Plus className="h-4 w-4" />
        Create Space
      </button>
      <button
        type="button"
        onClick={onCreatePage}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
        disabled={!onCreatePage}
      >
        <FilePlus2 className="h-4 w-4" />
        Create Page
      </button>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/docs/spaces">
        <FolderOpen className="h-4 w-4" />
        Browse Spaces
      </Link>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/docs/pages">
        <Files className="h-4 w-4" />
        Browse Pages
      </Link>
    </>
  );
}
