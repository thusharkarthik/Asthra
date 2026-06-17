"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Clock3, Columns3, GitBranch, Inbox, LayoutDashboard, Link2, ListTodo, Map, Rocket, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/flow", label: "Flow Dashboard", icon: LayoutDashboard },
  { href: "/flow/work-items", label: "Work Items", icon: ListTodo },
  { href: "/flow/hierarchy", label: "Hierarchy", icon: GitBranch },
  { href: "/flow/dependencies", label: "Dependencies", icon: Link2 },
  { href: "/flow/boards", label: "Boards", icon: Columns3 },
  { href: "/flow/sprints", label: "Sprints", icon: CalendarDays },
  { href: "/flow/releases", label: "Releases", icon: Rocket },
  { href: "/flow/roadmap", label: "Roadmap", icon: Map },
  { href: "/flow/capacity", label: "Capacity", icon: Clock3 },
  { href: "/flow/my-work", label: "My Work", icon: UserRound },
  { href: "/flow/backlog", label: "Backlog", icon: Inbox },
  { href: "/flow/reports", label: "Reports", icon: BarChart3 },
  { href: "/flow/settings/workflows", label: "Workflows", icon: Settings },
  { href: "/flow/settings/custom-fields", label: "Custom Fields", icon: Settings }
];

export function FlowSubnav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto border-b pb-2" aria-label="Flow sections">
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
          </Link>
        );
      })}
    </nav>
  );
}
