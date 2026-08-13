import type { ReactNode } from "react";

export function EntityDetailHeader({
  title,
  description,
  meta,
  actions,
  breadcrumbs
}: {
  title: string;
  description?: string | null;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {breadcrumbs ? <div className="mt-2">{breadcrumbs}</div> : null}
        {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
