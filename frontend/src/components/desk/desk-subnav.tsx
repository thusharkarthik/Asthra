"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ClipboardCheck, Gauge, Inbox, LayoutDashboard, ListChecks, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/desk", label: "Dashboard", icon: LayoutDashboard },
  { href: "/desk/tickets", label: "Tickets", icon: Ticket },
  { href: "/desk/queues", label: "Queues", icon: Inbox },
  { href: "/desk/slas", label: "SLAs", icon: Gauge },
  { href: "/desk/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/desk/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/desk/change-requests", label: "Change Requests", icon: ListChecks }
];

export function DeskSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2" aria-label="Desk navigation">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/desk" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", active && "bg-primary/10 text-primary")}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
