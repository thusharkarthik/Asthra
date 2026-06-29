"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Eye, Layers, Settings, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePlatformContext } from "@/context/platformContext";
import { useAuthStore } from "@/stores/auth-store";
import type { NavigationMode, ModeNavItem } from "@/lib/navigation-mode";
import { navSectionsForMode } from "@/lib/navigation-mode";
import { useSimulationStore, roleKeyToNavigationMode } from "@/lib/permission-simulator";
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
  const { selectedOrganization, selectedWorkspace, can, permissions } = usePlatformContext();
  const accessToken = useAuthStore((state) => state.accessToken);

  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const simulatedRoleName = useSimulationStore((state) => state.simulatedRoleName);
  const exitSimulation = useSimulationStore((state) => state.exitSimulation);
  const startSimulation = useSimulationStore((state) => state.startSimulation);

  const [viewAsOpen, setViewAsOpen] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const canSimulate =
    isSuperuser ||
    Boolean(permissions?.roles?.some((r) => ["platform_owner", "platform_admin"].includes(r.key)));

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles-for-simulate"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && viewAsOpen && canSimulate),
    staleTime: 5 * 60 * 1000,
  });

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

  async function handleStartSimulation() {
    if (!selectedRoleKey || !accessToken) return;
    setIsStarting(true);
    setStartError(null);
    try {
      const result = await settingsApi.simulatePermissions(accessToken, { role_key: selectedRoleKey });
      const role = rolesQuery.data?.find((r) => r.key === selectedRoleKey);
      const roleName = role?.name ?? selectedRoleKey;
      const mode = roleKeyToNavigationMode(selectedRoleKey);
      startSimulation(selectedRoleKey, roleName, result.permission_codes, mode);
      setViewAsOpen(false);
      setSelectedRoleKey("");
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Failed to start simulation.");
    } finally {
      setIsStarting(false);
    }
  }

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

      {/* View As section — superusers and platform owners only */}
      {canSimulate && (
        <div className="mt-auto border-t pt-2">
          {isSimulating ? (
            /* Active simulation indicator */
            <div className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 dark:border-amber-700 dark:bg-amber-950/40">
              {!collapsed && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Simulating
                    </span>
                    <button
                      type="button"
                      onClick={exitSimulation}
                      className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                      title="Exit simulation"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-amber-800 dark:text-amber-300">
                    {simulatedRoleName}
                  </div>
                </>
              )}
              {collapsed && (
                <button
                  type="button"
                  onClick={exitSimulation}
                  className="flex w-full items-center justify-center text-amber-700 dark:text-amber-400"
                  title={`Exit simulation: ${simulatedRoleName}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : viewAsOpen && !collapsed ? (
            /* View As panel */
            <div className="rounded-md border bg-card p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Permission Simulator</span>
                <button
                  type="button"
                  onClick={() => { setViewAsOpen(false); setStartError(null); setSelectedRoleKey(""); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mb-3 text-[11px] text-muted-foreground">
                See the UI exactly as a role would. API calls still use your real token.
              </p>
              <div className="mb-3">
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                  Simulate by Role
                </label>
                <select
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedRoleKey}
                  onChange={(e) => setSelectedRoleKey(e.target.value)}
                  disabled={rolesQuery.isLoading}
                >
                  <option value="">
                    {rolesQuery.isLoading ? "Loading roles…" : "Select a role…"}
                  </option>
                  {(rolesQuery.data ?? [])
                    .filter((r): r is typeof r & { key: string } => Boolean(r.is_active && r.key))
                    .map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                </select>
              </div>
              {startError && (
                <p className="mb-2 text-[11px] text-destructive">{startError}</p>
              )}
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={!selectedRoleKey || isStarting}
                className="w-full rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? "Starting…" : "Start Simulation"}
              </button>
            </div>
          ) : (
            /* View As button */
            <button
              type="button"
              onClick={() => setViewAsOpen(true)}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
              title="View As — Permission Simulator"
            >
              <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>View As</span>}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
