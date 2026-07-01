"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bot, Briefcase, FileText, Lightbulb, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { CardSkeleton, ErrorState, EmptyModuleState } from "@/components/layout/ui-states";
import { navSections } from "@/components/navigation/nav-items";
import { PlatformActivityFeed } from "@/components/platform/activity-feed";
import { CrossModuleLinks } from "@/components/platform/cross-module-links";
import { FavoritesList, RecentItemsList } from "@/components/platform/recent-favorites";
import { CreateOrgDialog, PlatformSetupGuide } from "@/components/platform/platform-setup-guide";
import { OrgSetupChecklist } from "@/components/platform/org-setup-checklist";
import { WorkspaceDashboardSummaryCards } from "@/components/platform/workspace-dashboard-summary";
import { Button } from "@/components/ui/button";
import { usePlatformContext } from "@/context/platformContext";
import { getWorkspaceActivity, getWorkspaceDashboardSummary } from "@/services/platform/activity-service";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAuthStore } from "@/stores/auth-store";
import { useRecentItemsStore } from "@/stores/recent-items-store";
import { useUIStore } from "@/stores/ui-store";

const quickLaunch = navSections
  .flatMap((section) => section.items.map((item) => ({ ...item, section: section.label })))
  .filter((item) => item.href && item.href !== "/" && !item.disabled)
  .slice(0, 12);

const recentAssistantConversations = ["Sprint planning questions", "Release risk summary", "Workspace onboarding notes"];
const recentSearchResults = ["Architecture diagram", "API gateway routing", "Open incident timeline"];
const moduleStatus = [
  { title: "Work modules", status: "Ready for demo", description: "Flow, Discover, Docs, Collab" },
  { title: "Operations modules", status: "Ready for demo", description: "Desk, Pulse, Automation" },
  { title: "Platform modules", status: "Shell-ready", description: "Connect, Guard, Insights, Media" }
];

const crossModuleLinks = [
  {
    id: "link-1",
    relation: "Idea to work item",
    from: { source: "discover" as const, entity_type: "idea", entity_id: 17, title: "Customer onboarding idea", href: "/discover/ideas/17" },
    to: { source: "flow" as const, entity_type: "work_item", entity_id: 101, title: "Build onboarding checklist", href: "/flow/work-items/101" }
  },
  {
    id: "link-2",
    relation: "Ticket to incident",
    from: { source: "desk" as const, entity_type: "ticket", entity_id: 12, title: "Login troubleshooting", href: "/desk/tickets/12" },
    to: { source: "pulse" as const, entity_type: "incident", entity_id: 7, title: "API latency", href: "/pulse/incidents/7" }
  }
];

const continueItems = [
  { title: "Review Flow work items", href: "/flow/work-items" },
  { title: "Open Docs pages", href: "/docs/pages" },
  { title: "Check Pulse incidents", href: "/pulse/incidents" }
];

const pinnedModules = [
  { title: "Flow", href: "/flow", description: "Plan and track work" },
  { title: "Docs", href: "/docs", description: "Capture knowledge" },
  { title: "Insights", href: "/insights", description: "Review platform metrics" }
];

const BENEFIT_CARDS = [
  {
    icon: Briefcase,
    title: "Manage Work",
    description: "Plan, track and deliver with Flow — sprints, boards, releases and more."
  },
  {
    icon: FileText,
    title: "Document Everything",
    description: "Create spaces and pages in Docs. Keep your team's knowledge organized."
  },
  {
    icon: Lightbulb,
    title: "Discover Ideas",
    description: "Capture ideas, validate features, and convert them into execution work."
  },
  {
    icon: Users,
    title: "Collaborate",
    description: "Invite your team, assign roles, and work together across projects."
  }
];

export default function HomePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { currentUser, organizations, workspaces, projects, isLoading, error } = usePlatformContext();
  const activityQuery = useQuery({ queryKey: ["platform", "activity"], queryFn: () => getWorkspaceActivity(accessToken), retry: 0 });
  const summaryQuery = useQuery({ queryKey: ["platform", "dashboard-summary"], queryFn: () => getWorkspaceDashboardSummary(accessToken), retry: 0 });
  const favorites = useFavoritesStore((state) => state.favorites);
  const viewed = useRecentItemsStore((state) => state.viewed);
  const modified = useRecentItemsStore((state) => state.modified);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const setAssistantOpen = useUIStore((state) => state.setAssistantOpen);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const isNoOrgUser = organizations.length === 0 && !currentUser?.is_superuser;

  if (isNoOrgUser) {
    return (
      <>
        <PageHeader title="Home" description="Welcome to Asthra." />
        <div className="mx-auto max-w-2xl space-y-8 py-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">You're one step away from unlocking everything</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create your organization to access Flow, Docs, Discover, and everything else Asthra has to offer.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFIT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{card.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateOrgOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Create Your Organization
            </button>
            <p className="text-xs text-muted-foreground">
              You can also access your{" "}
              <Link href="/settings/profile" className="underline underline-offset-2">Profile</Link>
              {" "}and{" "}
              <Link href="/settings/preferences" className="underline underline-offset-2">Preferences</Link>
              {" "}while you set up your organization.
            </p>
          </div>
        </div>
        <CreateOrgDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      </>
    );
  }

  const countCards = [
    { title: "Organizations", value: organizations.length, description: "Available core organizations" },
    { title: "Workspaces", value: workspaces.length, description: "Workspaces in the selected organization" },
    { title: "Projects", value: projects.length, description: "Projects in the selected workspace" }
  ];

  return (
    <>
      <PageHeader title="Home" description="One connected workspace for work, knowledge, operations, engineering, and intelligence." />
      {error && <div className="mb-4"><ErrorState title="Workspace context failed to load" description="The shell is still available. Check the API Gateway and core-service if counts look empty." /></div>}
      <OrgSetupChecklist />
      {(organizations.length === 0 || workspaces.length === 0 || projects.length === 0) ? (
        <div className="mb-4">
          <PlatformSetupGuide moduleName="Home" hasOrganization={organizations.length > 0} hasWorkspace={workspaces.length > 0} hasProject={projects.length > 0} requiresProject />
        </div>
      ) : null}
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        {isLoading ? [1, 2, 3].map((item) => <CardSkeleton key={item} />) : countCards.map((card) => (
            <DashboardCard key={card.title} title={card.title}>
              <div className="text-3xl font-semibold">{card.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            </DashboardCard>
          ))}
      </section>
      {summaryQuery.data ? (
        <section className="mb-4">
          <WorkspaceDashboardSummaryCards summary={summaryQuery.data} />
        </section>
      ) : null}
      <section className="mb-4 grid gap-4 lg:grid-cols-4">
        <DashboardCard title="Ask Asthra">
          <Sparkles className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-3 text-sm text-muted-foreground">Ask workspace-aware questions from the assistant panel.</p>
          <Button size="sm" onClick={() => setAssistantOpen(true)}>Open assistant</Button>
        </DashboardCard>
        <DashboardCard title="Search Workspace">
          <Search className="mb-3 h-5 w-5 text-primary" />
          <p className="mb-3 text-sm text-muted-foreground">Search docs, work, ideas, tickets, incidents, releases, and discussions.</p>
          <Button size="sm" variant="outline" onClick={() => setSearchOpen(true)}>Open search</Button>
        </DashboardCard>
        <DashboardCard title="System Status">
          <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">Local service health appears here once platform aggregation is wired into the frontend.</p>
        </DashboardCard>
        <DashboardCard title="Favorites">
          <Bot className="mb-3 h-5 w-5 text-primary" />
          <FavoritesList items={favorites.slice(0, 3)} />
        </DashboardCard>
      </section>
      <section className="mb-4">
        <DashboardCard title="Module Quick Launch">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickLaunch.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href ?? "/"} className="rounded-md border p-3 hover:bg-muted">
                  <div className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{item.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.section}</div>
                </Link>
              );
            })}
          </div>
        </DashboardCard>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard title="Continue where you left off">
          <div className="space-y-2">
            {continueItems.map((item) => <Link key={item.href} href={item.href} className="block rounded-md bg-muted px-3 py-2 text-sm hover:bg-muted/70">{item.title}</Link>)}
          </div>
        </DashboardCard>
        <DashboardCard title="Recently Viewed">
          <RecentItemsList title="Viewed across modules" items={viewed.slice(0, 3)} />
        </DashboardCard>
        <DashboardCard title="Recently Modified">
          <RecentItemsList title="Modified across modules" items={modified.slice(0, 3)} />
        </DashboardCard>
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <DashboardCard title="Global Activity Feed">
          <PlatformActivityFeed items={activityQuery.data ?? []} />
        </DashboardCard>
        <DashboardCard title="Workspace Memory">
          {workspaces.length > 0 ? (
            <p className="text-sm text-muted-foreground">Memory search is ready for the selected workspace. Indexing depth depends on backend content ingestion.</p>
          ) : (
            <EmptyModuleState title="No workspace selected" description="Select a workspace to enable assistant context and workspace search." />
          )}
        </DashboardCard>
        <DashboardCard title="Recent AI Conversations">
          <ul className="space-y-2 text-sm">{recentAssistantConversations.map((item) => <li key={item} className="rounded-md bg-muted px-3 py-2">{item}</li>)}</ul>
        </DashboardCard>
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <DashboardCard title="Recent Search Results">
          <ul className="space-y-2 text-sm">{recentSearchResults.map((item) => <li key={item} className="rounded-md bg-muted px-3 py-2">{item}</li>)}</ul>
        </DashboardCard>
        <DashboardCard title="Module Status">
          <div className="space-y-2">
            {moduleStatus.map((item) => (
              <div key={item.title} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium">{item.title}</span><span className="text-xs text-primary">{item.status}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="Pinned Modules">
          <div className="space-y-2">
            {pinnedModules.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-md bg-muted px-3 py-2 text-sm hover:bg-muted/70">
                <span className="font-medium">{item.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
              </Link>
            ))}
          </div>
        </DashboardCard>
      </section>
      <section className="mt-4">
        <DashboardCard title="Cross-Module Links">
          <CrossModuleLinks links={crossModuleLinks} />
        </DashboardCard>
      </section>
    </>
  );
}
