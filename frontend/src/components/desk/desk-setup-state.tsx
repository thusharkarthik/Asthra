import Link from "next/link";
import { Building2, Gauge, Inbox, PanelsTopLeft, Ticket } from "lucide-react";

export function DeskSetupState({
  hasOrganization,
  hasWorkspace,
  mode = "context"
}: {
  hasOrganization: boolean;
  hasWorkspace: boolean;
  mode?: "context" | "tickets" | "queues" | "slas";
}) {
  const step = !hasOrganization
    ? { icon: Building2, title: "Create an organization before managing support operations.", body: "Desk needs organization and workspace context so tickets, queues, SLAs, and approvals stay scoped.", action: "Create Organization", href: "/settings/workspace" }
    : !hasWorkspace
      ? { icon: PanelsTopLeft, title: "Select or create a workspace to start managing support requests.", body: "A workspace gives your support team a shared place to route tickets and track service commitments.", action: "Create Workspace", href: "/settings/workspace" }
      : mode === "tickets"
        ? { icon: Ticket, title: "Create your first ticket to start tracking service requests.", body: "Tickets capture customer issues, service requests, incidents, approvals, comments, and SLA pressure.", action: "Create Ticket", href: "/desk/tickets" }
        : mode === "queues"
          ? { icon: Inbox, title: "Queues help route support work to the right team.", body: "Use queues for Support, Billing, Operations, Engineering, or any team responsible for service requests.", action: "Create Queue", href: "/desk/queues" }
          : mode === "slas"
            ? { icon: Gauge, title: "SLAs track response and resolution expectations.", body: "Add SLA targets so high priority support work is easy to spot before it becomes a customer issue.", action: "Add SLA", href: "/desk/slas" }
            : { icon: Ticket, title: "Desk is ready for support operations.", body: "Create tickets, route them through queues, monitor SLAs, request approvals, and track operational changes.", action: "Browse Tickets", href: "/desk/tickets" };
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
