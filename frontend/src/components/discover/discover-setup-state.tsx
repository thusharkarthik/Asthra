import Link from "next/link";
import { Lightbulb, Map } from "lucide-react";
import { PlatformSetupGuide } from "@/components/platform/platform-setup-guide";

export function DiscoverSetupState({
  hasOrganization,
  hasWorkspace,
  mode = "context"
}: {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  mode?: "context" | "ideas" | "roadmap" | "feature-requests";
}) {
  if (!hasOrganization || !hasWorkspace) {
    return <PlatformSetupGuide moduleName="Discover" hasOrganization={hasOrganization} hasWorkspace={hasWorkspace} />;
  }

  const step = mode === "ideas"
        ? { icon: Lightbulb, title: "Start with an idea.", body: "Create Idea -> Validate -> Approve -> Roadmap -> Create Flow Work Item. Capture the problem, target users, business value, and confidence before execution.", action: "Create First Idea", href: "/discover/ideas" }
        : mode === "roadmap"
          ? { icon: Map, title: "Approved ideas are ready for roadmap planning.", body: "Group approved ideas into Now, Next, or Later, then create roadmap items when the team is ready to commit.", action: "Create Roadmap Item", href: "/discover/roadmap" }
          : mode === "feature-requests"
            ? { icon: Lightbulb, title: "Feature requests turn customer asks into product signals.", body: "Capture the source, requester, and requested outcome so ideas can be prioritized with real demand.", action: "Add Feature Request", href: "/discover/feature-requests" }
            : { icon: Lightbulb, title: "Discover is ready for product planning.", body: "Create Idea -> Validate -> Approve -> Roadmap -> Flow. Use this module to turn raw product signals into planned work.", action: "Browse Ideas", href: "/discover/ideas" };
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
