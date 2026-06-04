import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformActivityFeed } from "@/components/platform/activity-feed";
import { CrossModuleLinks } from "@/components/platform/cross-module-links";
import { FavoritesList, RecentItemsList } from "@/components/platform/recent-favorites";
import { WorkspaceDashboardSummaryCards } from "@/components/platform/workspace-dashboard-summary";
import type { ActivityItem, CrossModuleLink, FavoriteItem, RecentItem, WorkspaceDashboardSummary } from "@/types/platform";

const activity: ActivityItem[] = [
  { id: "1", source: "flow", actor: "Maya", action: "updated", entity: { source: "flow", entity_type: "work_item", entity_id: 1, title: "Task", href: "/flow/work-items/1" }, timestamp: "2026-06-04T10:00:00.000Z" }
];

const favorite: FavoriteItem = { source: "docs", entity_type: "docs_page", entity_id: 2, title: "Guide", href: "/docs/pages/2", favorited_at: "2026-06-04T10:00:00.000Z" };
const recent: RecentItem = { source: "desk", entity_type: "ticket", entity_id: 3, title: "Ticket", href: "/desk/tickets/3", viewed_at: "2026-06-04T10:00:00.000Z" };
const link: CrossModuleLink = { id: "l1", relation: "Ticket to incident", from: recent, to: { source: "pulse", entity_type: "incident", entity_id: 4, title: "Incident", href: "/pulse/incidents/4" } };
const summary: WorkspaceDashboardSummary = {
  work: { label: "Open work items", value: 8, href: "/flow/work-items" },
  docs: { label: "Recent pages", value: 12, href: "/docs/pages" },
  incidents: { label: "Active incidents", value: 1, href: "/pulse/incidents" },
  engineering: { label: "Deployments", value: 4, href: "/dev/deployments" },
  ai: { label: "Assistant sessions", value: 3, href: "/" }
};

describe("platform integration components", () => {
  it("renders activity feed", () => {
    render(<PlatformActivityFeed items={activity} />);
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("renders favorites and recent items", () => {
    render(<><FavoritesList items={[favorite]} /><RecentItemsList title="Recently viewed" items={[recent]} /></>);
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getAllByText("Ticket").length).toBeGreaterThan(0);
  });

  it("renders cross-module links", () => {
    render(<CrossModuleLinks links={[link]} />);
    expect(screen.getByText("Ticket to incident")).toBeInTheDocument();
    expect(screen.getAllByText("Incident").length).toBeGreaterThan(0);
  });

  it("renders workspace dashboard summary cards", () => {
    render(<WorkspaceDashboardSummaryCards summary={summary} />);
    expect(screen.getByText("Open work items")).toBeInTheDocument();
    expect(screen.getByText("Assistant sessions")).toBeInTheDocument();
  });
});
