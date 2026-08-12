import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Code2,
  FileText,
  KeyRound,
  Lightbulb,
  Plug,
  Settings,
  Shield,
  Ticket,
  Workflow,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const currentFoundation = [
  "Auth, registration, login, and platform setup",
  "Organizations, workspaces, projects, teams, members, invitations",
  "role_assignments as the source of scoped access truth",
  "Permission registry, permission gaps, and generated missing permissions",
  "Feature flags, module registry, navigation registry, and configuration registry",
  "AI context registry, global search registry, and organization templates",
  "Scoped settings/admin flows and RBAC certification work",
];

const differentiators = [
  {
    title: "One connected hierarchy",
    description: "Organizations, workspaces, projects, teams, members, roles, and modules share one Core structure instead of drifting across tools.",
  },
  {
    title: "Permission-aware by design",
    description: "Actions are mapped to backend permission codes, roles are assigned by scope, and UI visibility consumes the same model.",
  },
  {
    title: "Modules plug into Core",
    description: "Feature flags, module registry, navigation registry, and settings metadata let modules join the platform without rebuilding the shell.",
  },
  {
    title: "AI starts with context",
    description: "Asthra is preparing an assistant that understands user, scope, permissions, modules, flags, history, and platform state before it answers.",
  },
];

const modules = [
  {
    name: "Core",
    icon: Settings,
    status: "Active foundation",
    description: "Auth, users, organizations, workspaces, projects, teams, members, roles, permissions, RBAC, settings, audit logs, API keys, feature flags, registries, templates, and navigation.",
  },
  {
    name: "Flow",
    icon: Zap,
    status: "Built, stabilizing after Core",
    description: "Work items, bugs, stories, epics, tasks, backlog, boards, sprints, releases, roadmaps, dependencies, comments, status, and reports.",
  },
  {
    name: "Docs",
    icon: BookOpen,
    status: "Built foundation",
    description: "Spaces, pages, technical documentation, product documentation, decision logs, linked knowledge, and future RAG-ready knowledge flows.",
  },
  {
    name: "Discover",
    icon: Lightbulb,
    status: "Built foundation",
    description: "Ideas, feedback, validation, prioritization, product thinking, opportunity analysis, and roadmap candidates.",
  },
  {
    name: "Desk",
    icon: Ticket,
    status: "Service foundation",
    description: "Tickets, queues, SLAs, escalations, support workflows, and customer or internal service operations.",
  },
  {
    name: "Pulse",
    icon: Activity,
    status: "Operations foundation",
    description: "Incidents, status, health, postmortems, operational timelines, and response coordination.",
  },
  {
    name: "Dev",
    icon: Code2,
    status: "Future delivery layer",
    description: "Repositories, branches, commits, pull requests, reviews, builds, deployments, releases, CI/CD visibility, and engineering health.",
  },
  {
    name: "Forge",
    icon: Workflow,
    status: "Planned AI orchestrator",
    description: "Requirement analysis, PRD/BRD interpretation, repo analysis, architecture proposals, API/database/UI planning, test strategy, backlog generation, and human approval workflows.",
  },
  {
    name: "Assistant",
    icon: Bot,
    status: "Context foundation ready",
    description: "Explain Mode, Assist Mode, and Act Mode for understanding pages, drafting plans, summarizing work, and later performing approved actions.",
  },
  {
    name: "Automation",
    icon: Workflow,
    status: "Module foundation",
    description: "Rules, triggers, actions, workflows, and cross-module automation across Asthra services.",
  },
  {
    name: "Connect",
    icon: Plug,
    status: "Module foundation",
    description: "Integrations with GitHub, GitLab, Azure DevOps, Slack, email, calendar, webhooks, and third-party tools.",
  },
  {
    name: "Guard",
    icon: Shield,
    status: "Governance foundation",
    description: "Security, governance, access review, policies, compliance, audit intelligence, and risk-aware controls.",
  },
  {
    name: "Insights",
    icon: BarChart3,
    status: "Analytics foundation",
    description: "Analytics, reports, dashboards, execution intelligence, and platform-level visibility.",
  },
  {
    name: "Media",
    icon: FileText,
    status: "Storage foundation",
    description: "Uploads, attachments, file previews, media metadata, and shared storage capabilities.",
  },
  {
    name: "Memory",
    icon: Brain,
    status: "Long-term context layer",
    description: "Decisions, architecture context, important events, bugs, sessions, and why product or engineering changes happened.",
  },
];

const roadmap = [
  "Phase 1: Core foundation, RBAC certification, settings/admin stability",
  "Phase 2: Flow maturity for work execution, planning, releases, and reporting",
  "Phase 3: Docs, knowledge workflows, linked decisions, and RAG-ready context",
  "Phase 4: Forge planning and AI-assisted software delivery orchestration",
  "Phase 5: Dev engineering delivery, repositories, PRs, builds, deployments, and release intelligence",
  "Phase 6: Assistant Explain, Assist, and Act modes with human-approved actions",
  "Phase 7: Automation, Guard, Insights, Connect, and cross-module operating intelligence",
  "Phase 8: Enterprise customization, governance, AI operations, and organization-scale templates",
];

const principles = [
  "Modular: services can evolve independently while Core owns shared platform foundations.",
  "Permission-aware: backend permissions are the access source of truth and frontend gates consume permission codes.",
  "Context-first: scope, navigation, flags, modules, and configuration are unified before features act.",
  "Human-approved AI: future actions should be explainable, reviewable, and reversible where possible.",
  "Audit-friendly: sensitive lifecycle and access changes should leave a clear activity trail.",
  "Enterprise-ready: structure, RBAC, templates, and configuration must scale beyond a single team.",
];

export default function AboutAsthraPage() {
  return (
    <main className="space-y-8">
      <PageHeader
        title="About Asthra"
        description="Asthra is a modular execution operating system for organizations and teams."
        actions={
          <Link href="/settings" className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
            Open Settings
          </Link>
        }
      />

      <section className="rounded-lg border bg-card p-6">
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Product vision
          </div>
          <h2 className="text-3xl font-semibold tracking-normal">
            One connected operating layer for work, knowledge, service, engineering, governance, and AI.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Asthra brings execution, documentation, product discovery, service management, engineering delivery, automation, governance, insights, and AI assistance into one connected platform. It is inspired by tools like Jira, Confluence, ServiceNow, Linear, ClickUp, and Atlassian-style suites, but it is not trying to clone them. The goal is a coherent platform foundation where teams can add modules without rebuilding identity, permissions, navigation, configuration, and context each time.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What Asthra Solves</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Most teams work across disconnected tools: one for tasks, one for docs, one for support, one for incidents, one for engineering, one for automation, one for reporting, and another layer for AI context.
            </p>
            <p>
              Asthra connects those layers through Core: a shared hierarchy, shared permissions, shared feature/module metadata, shared navigation, shared configuration, and a future AI context layer that understands the platform instead of starting blind.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What Asthra Is Not</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Not just a task tracker.</p>
            <p>Not a clone of Jira, Confluence, ServiceNow, Linear, ClickUp, or Atlassian.</p>
            <p>Not a generic AI chatbot pasted onto a product.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Why Asthra</h2>
          <p className="mt-1 text-sm text-muted-foreground">Asthra is designed around connected operations, not isolated feature silos.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {differentiators.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current Foundation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Asthra is currently focused on Core stability and certification. Flow and other modules have meaningful foundations, but Core is being strengthened first so future module work has a reliable platform underneath it.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {currentFoundation.map((item) => (
                <div key={item} className="flex gap-2 rounded-md border bg-muted/20 p-3 text-sm">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Core's Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Core is the platform foundation. It owns identity, organization structure, scoped role assignments, permission codes, registries, feature availability, configuration, search metadata, templates, and navigation.
            </p>
            <p>Work modules build on top of Core. They should not reinvent access control, scope, navigation, or context.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Modules And Services</h2>
          <p className="mt-1 text-sm text-muted-foreground">Existing and planned services share the same platform shell and Core foundation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.name}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle>{module.name}</CardTitle>
                    </div>
                    <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">{module.status}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Future Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roadmap.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-md border bg-muted/20 p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {principles.map((item) => (
                <div key={item} className="flex gap-2 rounded-md border bg-muted/20 p-3 text-sm">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-muted/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">The short version</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Asthra is a permission-aware, AI-ready platform foundation for running work across many connected modules. Core is being certified first so every future feature has stable identity, scope, access, navigation, and context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border bg-background px-2 py-1">Core-first</span>
            <span className="rounded-md border bg-background px-2 py-1">Module-ready</span>
            <span className="rounded-md border bg-background px-2 py-1">AI-context-aware</span>
          </div>
        </div>
      </section>
    </main>
  );
}
