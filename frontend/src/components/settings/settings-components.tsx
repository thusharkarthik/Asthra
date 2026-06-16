"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityCreateDialog, FormActions, FormField, RequiredFieldLabel } from "@/components/modules/entity-form";

export { FormActions, FormField, RequiredFieldLabel };

export function SettingsLayout({
  breadcrumbs,
  backHref,
  backLabel,
  parentContext,
  children
}: {
  breadcrumbs: Array<{ label: string; href?: string }>;
  backHref?: string | null;
  backLabel?: string | null;
  parentContext?: {
    label: string;
    title: string;
    description?: string;
    meta?: string;
  };
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SettingsBreadcrumbs items={breadcrumbs} />
        {backHref && backLabel ? (
          <SettingsBackLink href={backHref}>{backLabel}</SettingsBackLink>
        ) : null}
      </div>
      {parentContext ? (
        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-medium text-muted-foreground">{parentContext.label}</div>
          <h2 className="mt-1 text-xl font-semibold">{parentContext.title}</h2>
          {parentContext.description ? <p className="mt-1 text-sm text-muted-foreground">{parentContext.description}</p> : null}
          {parentContext.meta ? <p className="mt-2 text-sm text-muted-foreground">{parentContext.meta}</p> : null}
        </section>
      ) : null}
      {children}
    </div>
  );
}

export function SettingsBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function SettingsBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Settings breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {item.href ? (
            <Link className="hover:text-foreground" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
        </span>
      ))}
    </nav>
  );
}

export function SettingsSectionHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function SettingsCard({ title, description, children, actions }: { title: string; description?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsDataTable({
  columns,
  rows,
  emptyMessage
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
  emptyMessage: string;
}) {
  if (!rows.length) {
    return <SettingsEmptyState title={emptyMessage} description="Create or connect records to populate this settings area." />;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SettingsEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-6">
      <h3 className="font-medium">{title}</h3>
      {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SettingsCreateDialog({
  title,
  open,
  onOpenChange,
  onSubmit,
  error,
  children
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <EntityCreateDialog title={title} open={open} onOpenChange={onOpenChange} onSubmit={onSubmit} error={error}>
      {children}
    </EntityCreateDialog>
  );
}

export function QuickCreateButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}

export function SettingsDangerZone({ title = "Danger zone", description }: { title?: string; description: string }) {
  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h2 className="font-semibold text-destructive">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}

export function PlatformSetupSteps({
  hasOrganization,
  hasWorkspace,
  hasProject
}: {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  hasProject: boolean;
}) {
  const steps = [
    { label: "Create organization", complete: hasOrganization, href: "/settings/organizations" },
    { label: "Create workspace", complete: hasWorkspace, href: "/settings/workspaces" },
    { label: "Create project", complete: hasProject, href: "/settings/projects" }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => (
        <Link key={step.label} href={step.href} className="rounded-lg border bg-card p-4 hover:bg-muted/50">
          <div className="text-sm text-muted-foreground">Step {index + 1}</div>
          <div className="mt-1 font-medium">{step.label}</div>
          <div className={`mt-2 text-sm ${step.complete ? "text-emerald-600" : "text-muted-foreground"}`}>
            {step.complete ? "Complete" : "Needs setup"}
          </div>
        </Link>
      ))}
    </div>
  );
}
