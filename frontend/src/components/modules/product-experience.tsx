import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModuleNavItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

export function ModuleHero({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
    </section>
  );
}

export function ModulePrimaryActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function ModuleSubnav({ items, activePath }: { items: ModuleNavItem[]; activePath?: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2" aria-label="Module navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activePath === item.href || Boolean(activePath && item.href !== "/" && activePath.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", active && "bg-primary/10 text-primary")}>
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ModuleSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ModuleEmptyState({ title, description, actionLabel, href }: { title: string; description: string; actionLabel?: string; href?: string }) {
  return (
    <section className="rounded-lg border border-dashed p-6">
      <div className="max-w-2xl">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {actionLabel && href ? <Link className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90" href={href}>{actionLabel}</Link> : null}
      </div>
    </section>
  );
}

export function EntityBadge({ value }: { value: string }) {
  return <span className="inline-flex w-fit rounded bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">{value.replace("_", " ")}</span>;
}

export function EntityLinkCard({ href, title, description, children }: { href: string; title: string; description?: string | null; children?: ReactNode }) {
  return (
    <Link className="block rounded-md border p-3 hover:bg-muted/60" href={href}>
      <div className="font-medium">{title}</div>
      {description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-2 flex flex-wrap gap-2">{children}</div> : null}
    </Link>
  );
}

export function AiPlaceholderPanel({ title = "AI assistance", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export function RelationshipPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed p-3">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function StatusSummaryCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
