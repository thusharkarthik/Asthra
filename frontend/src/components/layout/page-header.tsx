import type { ReactNode } from "react";

export function PageHeader({ title, description, actions, breadcrumbs }: { title: string; description?: string; actions?: ReactNode; breadcrumbs?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {breadcrumbs ? <div className="mt-2">{breadcrumbs}</div> : null}
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
