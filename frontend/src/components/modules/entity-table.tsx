import type { ReactNode } from "react";

export function EntityTable({
  columns,
  children
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid bg-muted px-4 py-2 text-xs font-medium uppercase text-muted-foreground" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

export function EntityTableRow({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <div className="grid items-center gap-3 px-4 py-3 text-sm" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}
