import Link from "next/link";
import { ClipboardList, Columns3, Inbox, Plus, UserRound } from "lucide-react";

export function FlowHeaderActions({ onCreate }: { onCreate?: () => void }) {
  return (
    <>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Work Item
        </button>
      ) : (
        <Link
          href="/flow/work-items"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Work Item
        </Link>
      )}
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/boards">
        <Columns3 className="h-4 w-4" />
        View Boards
      </Link>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/my-work">
        <UserRound className="h-4 w-4" />
        My Work
      </Link>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/backlog">
        <Inbox className="h-4 w-4" />
        Backlog
      </Link>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted" href="/flow/work-items">
        <ClipboardList className="h-4 w-4" />
        Work Items
      </Link>
    </>
  );
}
