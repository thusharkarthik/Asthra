"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function CollabBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  const fullItems = [{ label: "Collab", href: "/collab" }, ...items];
  return (
    <nav aria-label="Collab breadcrumbs" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {fullItems.map((item, index) => {
        const isLast = index === fullItems.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
            {item.href && !isLast ? <Link className="font-medium hover:text-foreground hover:underline" href={item.href}>{item.label}</Link> : <span className={isLast ? "font-medium text-foreground" : ""}>{item.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function CollabBackLink({ href, label }: { href: string; label: string }) {
  return <Link className="inline-flex items-center text-sm font-medium text-primary hover:underline" href={href}><span className="mr-1">←</span>{label}</Link>;
}
