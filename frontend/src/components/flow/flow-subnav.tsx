"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bell, CalendarDays, Clock3, Columns3, GitBranch, Inbox, LayoutDashboard, Link2, ListTodo, Map, Rocket, Search, Settings, UserRound, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { flowApi } from "@/services/api/flow-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const items = [
  { href: "/flow", label: "Flow Dashboard", icon: LayoutDashboard },
  { href: "/flow/work-items", label: "Work Items", icon: ListTodo },
  { href: "/flow/search", label: "Search", icon: Search },
  { href: "/flow/hierarchy", label: "Hierarchy", icon: GitBranch },
  { href: "/flow/dependencies", label: "Dependencies", icon: Link2 },
  { href: "/flow/boards", label: "Boards", icon: Columns3 },
  { href: "/flow/sprints", label: "Sprints", icon: CalendarDays },
  { href: "/flow/releases", label: "Releases", icon: Rocket },
  { href: "/flow/roadmap", label: "Roadmap", icon: Map },
  { href: "/flow/capacity", label: "Capacity", icon: Clock3 },
  { href: "/flow/activity", label: "Activity", icon: BarChart3 },
  { href: "/flow/automation", label: "Automation", icon: Workflow },
  { href: "/flow/notifications", label: "Notifications", icon: Bell, showUnread: true },
  { href: "/flow/my-work", label: "My Work", icon: UserRound },
  { href: "/flow/backlog", label: "Backlog", icon: Inbox },
  { href: "/flow/reports", label: "Reports", icon: BarChart3 },
  { href: "/flow/settings/workflows", label: "Workflows", icon: Settings },
  { href: "/flow/settings/custom-fields", label: "Custom Fields", icon: Settings }
];

export function FlowSubnav() {
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const unreadQuery = useQuery({
    queryKey: ["flow", "notifications", "unread-count", selectedProjectId],
    queryFn: () => flowApi.listNotifications(accessToken ?? "", { project_id: selectedProjectId, unread_only: true, limit: 100 }),
    enabled: Boolean(accessToken && selectedProjectId),
    retry: 1
  });
  const unreadCount = unreadQuery.data?.length ?? 0;

  return (
    <nav className="mb-5 flex flex-wrap gap-2 border-b pb-2" aria-label="Flow sections">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/flow" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {"showUnread" in item && item.showUnread && unreadCount > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{unreadCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
