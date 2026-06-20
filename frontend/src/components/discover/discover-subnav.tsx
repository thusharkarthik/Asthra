"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, Compass, GitBranch, Lightbulb, Map, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/discover", label: "Dashboard", icon: Compass },
  { href: "/discover/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/discover/feature-requests", label: "Feature Requests", icon: ClipboardCheck },
  { href: "/discover/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/discover/roadmap", label: "Roadmap", icon: Map },
  { href: "/discover/delivery", label: "Delivery View", icon: GitBranch },
  { href: "/discover/validation", label: "Validation", icon: Sparkles },
  { href: "/discover/prioritization", label: "Prioritization", icon: BarChart3 }
];

export function DiscoverSubnav() {
  const pathname = usePathname();
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto border-b pb-2" aria-label="Discover sections">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/discover" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground", active && "bg-muted text-foreground")}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
