"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Layers, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePlatformContext } from "@/context/platformContext";
import { useAuthStore } from "@/stores/auth-store";
import type { NavigationMode, ModeNavItem } from "@/lib/navigation-mode";
import { navSectionsForMode } from "@/lib/navigation-mode";
import { buildNavSections } from "@/lib/module-nav-registry";
import { useSimulationStore } from "@/lib/permission-simulator";
import { PermissionGate } from "@/components/platform/permission-gate";
import { GodModeActivation } from "@/components/platform/god-mode-activation";
import { settingsApi } from "@/services/api/settings-api";

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
  const { selectedOrganization, selectedWorkspace, can, permissions, availableModules } = usePlatformContext();
  const accessToken = useAuthStore((state) => state.accessToken);

  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const isEditMode = useSimulationStore((state) => state.isEditMode);
  const isGodModeReady = useSimulationStore((state) => state.isGodModeReady);
  const isActivating = useSimulationStore((state) => state.isActivating);
  const isDeactivating = useSimulationStore((state) => state.isDeactivating);

  const [godModeModalOpen, setGodModeModalOpen] = useState(false);

  const canSimulate =
    isSuperuser ||
    Boolean(permissions?.roles?.some((r) => ["platform_owner", "platform_admin"].includes(r.key)));

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles-for-simulate"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && godModeModalOpen && canSimulate),
    staleTime: 5 * 60 * 1000,
  });

  const effectiveMode: NavigationMode = modeOverride ?? navigationMode;
  // Dynamic nav: use when modules loaded for the correct mode.
  // buildNavSections returns [] when modules are cached for a different mode
  // (e.g., platform modules in cache while user needs "org") — fall through to
  // static nav so the sidebar is never empty during mode transitions.
  const dynamicSections = availableModules.length > 0
    ? buildNavSections(availableModules, effectiveMode)
    : [];
  const sections = dynamicSections.length > 0
    ? dynamicSections
    : navSectionsForMode(effectiveMode);

  function shouldShowItem(item: ModeNavItem): boolean {
    if (skippedUser && !SKIPPED_ALLOWED_HREFS.has(item.href)) return false;
    const requiredPermissions = item.permissions?.length ? item.permissions : item.permission ? [item.permission] : [];
    if (requiredPermissions.length > 0) {
      // In edit mode, always show — PermissionGate renders the overlay UI
      if (isEditMode) return true;
      if (permissionsLoading) return true;
      return requiredPermissions.some((permission) => can(permission));
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

      {/* Superuser mode switcher — hidden during simulation */}
      {isSuperuser && !collapsed && !isSimulating && (
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
              const link = (
                <Link
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
              if (item.permission && isEditMode) {
                return (
                  <PermissionGate key={item.href} permission={item.permission} label={`${item.label} (sidebar)`}>
                    {link}
                  </PermissionGate>
                );
              }
              return <Fragment key={item.href}>{link}</Fragment>;
            })}
          </section>
        );
      })}

      {/* God Mode section — superusers and platform owners only */}
      {canSimulate && (
        <div className="mt-auto border-t pt-2">
          {isGodModeReady || isActivating || isDeactivating ? (
            /* God Mode active indicator */
            <div className={cn(
              "rounded-md border px-2.5 py-2",
              isGodModeReady
                ? "border-purple-700/50 bg-purple-950/40"
                : "border-purple-800/30 bg-purple-950/20"
            )}>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-400">
                    {isActivating ? "Entering…" : isDeactivating ? "Exiting…" : "God Mode"}
                  </span>
                </div>
              )}
              {collapsed && (
                <div className="flex w-full items-center justify-center text-purple-400">
                  <span className="text-sm">⚡</span>
                </div>
              )}
            </div>
          ) : (
            /* God Mode button */
            <button
              type="button"
              onClick={() => setGodModeModalOpen(true)}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-purple-950/40 hover:text-purple-300",
                collapsed && "justify-center px-0"
              )}
              title="God Mode — Permission Simulator"
            >
              <span className="shrink-0 text-base leading-none">⚡</span>
              {!collapsed && <span>God Mode</span>}
            </button>
          )}
        </div>
      )}

      {/* God Mode activation modal */}
      {godModeModalOpen && (
        <GodModeActivation
          roles={rolesQuery.data ?? []}
          onClose={() => setGodModeModalOpen(false)}
        />
      )}
    </nav>
  );
}
