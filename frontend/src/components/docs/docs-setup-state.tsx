import Link from "next/link";
import { BookOpen, FilePlus2, FolderOpen } from "lucide-react";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";

type DocsSetupStateProps = {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  hasSpaces?: boolean;
  hasPages?: boolean;
  mode?: "context" | "spaces" | "pages";
};

export function DocsSetupState({ hasOrganization, hasWorkspace, hasSpaces = true, hasPages = true, mode = "context" }: DocsSetupStateProps) {
  if (!hasOrganization || !hasWorkspace) {
    return <PlatformSetupGuide moduleName="Docs" hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} />;
  }

  const step = mode === "spaces" && !hasSpaces
        ? {
            icon: FolderOpen,
            title: "Knowledge begins with a Space.",
            body: "Create Space -> Create Page -> Publish -> Link Work. Start with spaces like Engineering, Architecture, Product, or Operations.",
            action: "Create First Space",
            href: "/docs/spaces"
          }
        : mode === "pages" && !hasPages
          ? {
              icon: FilePlus2,
              title: "This space has no pages yet.",
              body: "Create a draft page, publish it when ready, then link it to Flow work when the execution reference exists.",
              action: "Create First Page",
              href: "/docs/pages"
            }
          : mode === "context"
            ? {
                icon: BookOpen,
                title: "Docs is ready for your team knowledge.",
                body: "Create Space -> Create Page -> Publish -> Link Work. Keep knowledge organized so it can support search, decisions, and execution later.",
                action: "Browse Docs",
                href: "/docs/spaces"
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
          <Link href={step.href} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            {step.action}
          </Link>
        </div>
      </div>
    </section>
  );
}
