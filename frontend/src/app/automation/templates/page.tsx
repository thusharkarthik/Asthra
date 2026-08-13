"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { automationNavItems } from "@/components/modules/module-navs";
import { AiPlaceholderPanel, EntityBadge, ModuleSubnav, RelationshipPlaceholder } from "@/components/modules/product-experience";

export default function AutomationTemplatesPage() {
  const pathname = usePathname();
  const templates = ["Ticket routing", "Incident follow-up", "Page update notification", "Release checklist"];
  return <div className="space-y-6"><PageHeader title="Automation Templates" description="Reusable workflow patterns for common Asthra operations." /><ModuleSubnav items={automationNavItems} activePath={pathname} /><div className="grid gap-3 md:grid-cols-2">{templates.map((template) => <div key={template} className="rounded-md border p-3"><div className="font-medium">{template}</div><div className="mt-2"><EntityBadge value="template" /></div><p className="mt-2 text-sm text-muted-foreground">Template placeholder. Future UI will create draft workflows from this pattern.</p></div>)}</div><RelationshipPlaceholder title="Future agent support" description="Templates will later define safe human-approved workflow and agent orchestration patterns." /><AiPlaceholderPanel title="AI workflow suggestions">Future AI can suggest triggers, conditions, and actions from natural language workflow goals.</AiPlaceholderPanel></div>;
}
