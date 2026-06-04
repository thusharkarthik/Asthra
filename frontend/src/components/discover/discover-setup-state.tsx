import Link from "next/link";
import { Building2, Lightbulb, Map, PanelsTopLeft } from "lucide-react";

export function DiscoverSetupState({
  hasOrganization,
  hasWorkspace,
  mode = "context"
}: {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  mode?: "context" | "ideas" | "roadmap" | "feature-requests";
}) {
  const step = !hasOrganization
    ? { icon: Building2, title: "Create an organization before capturing product discovery.", body: "Discover is workspace-scoped so ideas, requests, feedback, and roadmap decisions stay connected.", action: "Create Organization", href: "/settings/workspace" }
    : !hasWorkspace
      ? { icon: PanelsTopLeft, title: "Select or create a workspace to start capturing product ideas.", body: "A workspace gives product discovery a shared home for your team.", action: "Create Workspace", href: "/settings/workspace" }
      : mode === "ideas"
        ? { icon: Lightbulb, title: "Start with an idea. Capture a problem, opportunity, or product improvement.", body: "Ideas become validated concepts, MVP plans, and eventually planned work.", action: "Create First Idea", href: "/discover/ideas" }
        : mode === "roadmap"
          ? { icon: Map, title: "Prioritized ideas can become roadmap items.", body: "Use the roadmap to communicate Now, Next, and Later product bets.", action: "Create Roadmap Item", href: "/discover/roadmap" }
          : mode === "feature-requests"
            ? { icon: Lightbulb, title: "Feature requests turn customer asks into product signals.", body: "Capture the source, requester, and requested outcome so ideas can be prioritized with real demand.", action: "Add Feature Request", href: "/discover/feature-requests" }
          : { icon: Lightbulb, title: "Discover is ready for product planning.", body: "Capture ideas, validate them, prioritize impact, and convert the best ones into roadmap items.", action: "Browse Ideas", href: "/discover/ideas" };
  const Icon = step.icon;
  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="space-y-3">
          <div><h2 className="text-lg font-semibold">{step.title}</h2><p className="mt-1 text-sm text-muted-foreground">{step.body}</p></div>
          <Link href={step.href} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">{step.action}</Link>
        </div>
      </div>
    </section>
  );
}
