"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "@/components/navigation/nav-items";
import { canAny } from "@/lib/permissions";
import { useUIStore } from "@/stores/ui-store";

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasNavigationAccess(
  requiredPermissions: string[] | undefined,
  permissionCodes: string[] | undefined,
  permissionsLoading: boolean
) {
  if (!requiredPermissions?.length) return true;
  if (permissionsLoading) return true;
  if (!permissionCodes) return true;
  return canAny(permissionCodes, requiredPermissions);
}

export function SidebarNav({
  collapsed = false,
  permissionCodes,
  permissionsLoading = false
}: {
  collapsed?: boolean;
  permissionCodes?: string[];
  permissionsLoading?: boolean;
}) {
  const pathname = usePathname();
  const setAssistantOpen = useUIStore((state) => state.setAssistantOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);

  const runAction = (action?: "search" | "assistant") => {
    if (action === "search") setSearchOpen(true);
    if (action === "assistant") setAssistantOpen(true);
  };

  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-4">
      {navSections.map((section) => (
        <section key={section.label} aria-label={section.label} className="space-y-1">
          {!collapsed && <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</div>}
          {section.items.filter((item) => hasNavigationAccess(item.requiredPermissions, permissionCodes, permissionsLoading)).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const className = cn(
              "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted font-medium text-foreground",
              item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
              collapsed && "justify-center px-0"
            );

            if (item.href && !item.disabled) {
              return (
                <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined} title={item.label}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            }

            return (
              <button key={`${section.label}-${item.label}`} type="button" className={className} onClick={() => runAction(item.action)} disabled={item.disabled} title={item.label}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </section>
      ))}
      <div className={cn("rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground", collapsed && "sr-only")}>
        Compact mode placeholder
      </div>
    </nav>
  );
}
