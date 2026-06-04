import Link from "next/link";
import { Building2, FolderKanban, PanelsTopLeft } from "lucide-react";

type FlowSetupStateProps = {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  hasProject: boolean;
};

export function FlowSetupState({ hasOrganization, hasWorkspace, hasProject }: FlowSetupStateProps) {
  const step = !hasOrganization
    ? {
        icon: Building2,
        title: "Create an organization before using Flow",
        body: "Flow work items live inside projects, and projects belong to a workspace inside an organization.",
        action: "Create Organization",
        href: "/settings/workspace"
      }
    : !hasWorkspace
      ? {
          icon: PanelsTopLeft,
          title: "Create or select a workspace",
          body: "A workspace gives your team a shared place for projects, work items, docs, incidents, and collaboration.",
          action: "Create Workspace",
          href: "/settings/workspace"
        }
      : !hasProject
        ? {
            icon: FolderKanban,
            title: "Create or select a project",
            body: "Flow needs a project so work items, boards, backlog, and reports stay scoped to the right product or team.",
            action: "Create Project",
            href: "/settings/workspace"
          }
        : null;

  if (!step) return null;
  const Icon = step.icon;

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </div>
          <Link
            href={step.href}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {step.action}
          </Link>
        </div>
      </div>
    </section>
  );
}
