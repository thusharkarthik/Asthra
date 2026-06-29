"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatformContext } from "@/context/platformContext";
import type { NavigationMode, ModeNavItem } from "@/lib/navigation-mode";
import { navSectionsForMode } from "@/lib/navigation-mode";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SKIPPED_ALLOWED_HREFS = new Set(["/", "/settings"]);

export function SidebarNav({
  collapsed = false,
  permissionCodes: _permissionCodes,
  permissionsLoading = false,
  skippedUser = false,
  navigationMode = "work",
  isSuperuser = false,
  modeOverride = null,
  onModeOverride,
}: {
  collapsed?: boolean;
  permissionCodes?: string[];
  permissionsLoading?: boolean;
  skippedUser?: boolean;
  navigationMode?: NavigationMode;
  isSuperuser?: boolean;
  modeOverride?: NavigationMode | null;
  onModeOverride?: (mode: NavigationMode | null) => void;
}) {
  const pathname = usePathname();
  const { selectedOrganization, selectedWorkspace, can } = usePlatformContext();

  const effectiveMode: NavigationMode = modeOverride ?? navigationMode;
  const sections = navSectionsForMode(effectiveMode);

  function shouldShowItem(item: ModeNavItem): boolean {
    if (skippedUser && !SKIPPED_ALLOWED_HREFS.has(item.href)) return false;
    if (item.permission) {
      if (permissionsLoading) return true;
      return can(item.permission);
    }
    return true;
  }

  const modeLabel = (() => {
    if (effectiveMode === "platform") return "Platform Mode";
    if (effectiveMode === "org") return selectedOrganization?.name ?? "Organization";
    return selectedWorkspace?.name ?? "Workspace";
  })();

  const ModeIcon =
    effectiveMode === "platform" ? Settings : effectiveMode === "org" ? Building2 : Layers;

  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-4">
      {/* Mode indicator */}
      {!collapsed && (
        <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5">
          <ModeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
            {modeLabel}
          </span>
        </div>
      )}

      {/* Superuser mode switcher */}
      {isSuperuser && !collapsed && (
        <div className="flex flex-col gap-1">
          <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Mode
          </div>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={modeOverride ?? "auto"}
            onChange={(e) => {
              const val = e.target.value;
              onModeOverride?.(val === "auto" ? null : (val as NavigationMode));
            }}
          >
            <option value="auto">Auto ({navigationMode})</option>
            <option value="platform">Platform Mode</option>
            <option value="org">Organization Mode</option>
            <option value="work">Work Mode</option>
          </select>
        </div>
      )}

      {/* Nav sections for current mode */}
      {sections.map((section) => {
        const visibleItems = section.items.filter(shouldShowItem);
        if (visibleItems.length === 0) return null;
        return (
          <section key={section.label} aria-label={section.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.label}
              </div>
            )}
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted font-medium text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </section>
        );
      })}
    </nav>
  );
}
