"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clock3, FileSearch, Files, FolderOpen, LayoutDashboard, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/docs", label: "Dashboard", icon: LayoutDashboard },
  { href: "/docs/spaces", label: "Spaces", icon: FolderOpen },
  { href: "/docs/pages", label: "Pages", icon: Files },
  { href: "/docs/favorites", label: "Favorites", icon: Star },
  { href: "/docs/recent", label: "Recent", icon: Clock3 },
  { href: "/docs/search", label: "Search", icon: FileSearch }
];

export function DocsSubnav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto border-b pb-2" aria-label="Docs sections">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/docs" ? pathname === item.href : pathname.startsWith(item.href);
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
      <span className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground lg:inline-flex">
        <BookOpen className="h-4 w-4" />
        Spaces organize pages by domain
      </span>
    </nav>
  );
}
