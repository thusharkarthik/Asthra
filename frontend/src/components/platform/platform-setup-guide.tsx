"use client";

import Link from "next/link";
import { Building2, FolderKanban, PanelsTopLeft } from "lucide-react";

type PlatformSetupGuideProps = {
  hasOrganization?: boolean;
  hasWorkspace?: boolean;
  hasProject?: boolean;
  moduleName?: string;
  requiresProject?: boolean;
  title?: string;
  description?: string;
};

export function PlatformSetupGuide({
  hasOrganization = true,
  hasWorkspace = true,
  hasProject = true,
  moduleName = "Asthra",
  requiresProject = false,
  title,
  description
}: PlatformSetupGuideProps) {
  const step = !hasOrganization
    ? {
        icon: Building2,
        title: title ?? "Create an organization to start using Asthra",
        description: description ?? "Organizations are the top-level home for users, workspaces, projects, and platform settings.",
        action: "Create Organization"
      }
    : !hasWorkspace
      ? {
          icon: PanelsTopLeft,
          title: title ?? `Create or select a workspace for ${moduleName}`,
          description: description ?? "A workspace connects teams, projects, content, operations, and AI-ready context.",
          action: "Create Workspace"
        }
      : requiresProject && !hasProject
        ? {
            icon: FolderKanban,
            title: title ?? `Create or select a project for ${moduleName}`,
            description: description ?? "Projects scope work, docs, ideas, tickets, and module-specific activity to the right team or product.",
            action: "Create Project"
          }
        : null;

  if (!step) return null;

  const Icon = step.icon;

  return (
    <section className="rounded-lg border bg-card p-6" aria-label={`${moduleName} setup guide`}>
      <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings/workspace" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              {step.action}
            </Link>
            <Link href="/settings" className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted">
              Open Settings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
