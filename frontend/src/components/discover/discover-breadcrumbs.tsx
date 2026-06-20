"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type DiscoverBreadcrumbItem = {
  label: string;
  href?: string;
};

export function DiscoverBreadcrumbs({ items }: { items: DiscoverBreadcrumbItem[] }) {
  const fullItems = [{ label: "Discover", href: "/discover" }, ...items];
  return (
    <nav aria-label="Discover breadcrumbs" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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

export function DiscoverBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="inline-flex items-center text-sm font-medium text-primary hover:underline" href={href}>
      <span aria-hidden="true" className="mr-1">←</span>
      {label}
    </Link>
  );
}
