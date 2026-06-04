"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntityDetailLayout({
  header,
  overview,
  metadata,
  activity,
  links,
  dangerZone
}: {
  header: ReactNode;
  overview: ReactNode;
  metadata?: ReactNode;
  activity?: ReactNode;
  links?: ReactNode;
  dangerZone?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {header}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          {overview}
          {activity}
        </div>
        <div className="space-y-4">
          {metadata}
          {links}
          {dangerZone}
        </div>
      </div>
    </div>
  );
}

export function EntityMetadataPanel({ children }: { children: ReactNode }) {
  return <Panel title="Metadata">{children}</Panel>;
}

export function EntityActivityPanel({ children }: { children: ReactNode }) {
  return <Panel title="Activity">{children}</Panel>;
}

export function EntityLinksPanel({ labels }: { labels: string[] }) {
  return (
    <Panel title="Linked Entities">
      <div className="space-y-3 text-sm">
        {labels.map((label) => (
          <div key={label} className="rounded-md border border-dashed p-3">
            <div className="flex items-center gap-2 font-medium">
              <Link2 className="h-4 w-4" /> {label}
            </div>
            <p className="mt-1 text-muted-foreground">Future cross-module references will appear here.</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function EntityDangerZone({ label = "Archive placeholder", description = "Destructive actions are shown here once backend support and confirmation flows are ready." }: { label?: string; description?: string }) {
  return (
    <Panel title="Danger Zone" className="border-destructive/30">
      <div className="flex items-start gap-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{label}</p>
          <p className="mt-1 text-muted-foreground">{description}</p>
          <Button className="mt-3" size="sm" variant="outline" disabled>
            Delete / Archive
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function Panel({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-lg border bg-card p-4", className)}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
