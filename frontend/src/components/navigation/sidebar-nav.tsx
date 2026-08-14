"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Layers, Lock, Send, Settings, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePlatformContext } from "@/context/platformContext";
import { useAuthStore } from "@/stores/auth-store";
import type { NavigationMode, ModeNavItem } from "@/lib/navigation-mode";
import { navSectionsForMode } from "@/lib/navigation-mode";
import { buildNavSections, buildNavSectionsFromNavigation } from "@/lib/module-nav-registry";
import { mergeLiveNavigationCandidateSections, resolveLiveNavigationConfig, selectRoleForNavigationConfig } from "@/lib/navigation-config-live-resolver";
import type { LiveNavigationConfigItem } from "@/lib/navigation-config-live-resolver";
import { useSimulationStore } from "@/lib/permission-simulator";
import { PermissionGate } from "@/components/platform/permission-gate";
import { GodModeActivation } from "@/components/platform/god-mode-activation";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/services/api/settings-api";
import { useToastStore } from "@/stores/toast-store";

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
  const { selectedOrganization, selectedWorkspace, can, permissions, availableModules, navigation, isFeatureEnabled, currentScope } = usePlatformContext();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);

  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const isEditMode = useSimulationStore((state) => state.isEditMode);
  const isGodModeReady = useSimulationStore((state) => state.isGodModeReady);
  const isActivating = useSimulationStore((state) => state.isActivating);
  const isDeactivating = useSimulationStore((state) => state.isDeactivating);

  const [godModeModalOpen, setGodModeModalOpen] = useState(false);
  const [lockedAccessItem, setLockedAccessItem] = useState<LiveNavigationConfigItem | null>(null);

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
  const navConfigEnabled = isFeatureEnabled("core.navigation_config.enabled");
  const liveConfigRole = useMemo(() => {
    if (isSuperuser || !navConfigEnabled || isSimulating || isGodModeReady || isEditMode || isActivating || isDeactivating) return null;
    return selectRoleForNavigationConfig(permissions?.roles ?? [], effectiveMode);
  }, [effectiveMode, isActivating, isDeactivating, isEditMode, isGodModeReady, isSimulating, isSuperuser, navConfigEnabled, permissions?.roles]);

  const liveRoleConfigQuery = useQuery({
    queryKey: ["navigation", "live-role-config", liveConfigRole?.id ?? null, effectiveMode, permissions?.scope?.scope_type ?? "platform", permissions?.scope?.scope_id ?? null],
    queryFn: () => settingsApi.getMyRoleNavigationConfig(accessToken ?? "", liveConfigRole?.id ?? 0, effectiveMode, permissions?.scope ?? {
      scope_type: currentScope.workspaceId ? "workspace" : currentScope.organizationId ? "organization" : "platform",
      scope_id: currentScope.workspaceId ?? currentScope.organizationId ?? null,
    }),
    enabled: Boolean(accessToken && navConfigEnabled && liveConfigRole?.id),
    staleTime: 60_000,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const requestAccessMutation = useMutation({
    mutationFn: (item: LiveNavigationConfigItem) => settingsApi.sendAccessRequest(accessToken ?? "", {
      page: item.href,
      message: [
        `Navigation item: ${item.label}`,
        item.navKey ? `Navigation key: ${item.navKey}` : null,
        `Mode: ${effectiveMode}`,
        liveConfigRole ? `Role: ${liveConfigRole.name} (${liveConfigRole.key})` : null,
        item.navigationConfigMissingPermissions?.length
          ? `Missing permissions: ${item.navigationConfigMissingPermissions.join(", ")}`
          : null,
        "This item is visible because navigation config is set to show locked items, but backend permissions still block access.",
      ].filter(Boolean).join("\n"),
    }),
    onSuccess: () => {
      addToast({ type: "success", title: "Access requested", message: "Your request was sent to an admin." });
      setLockedAccessItem(null);
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Request failed",
        message: error instanceof Error ? error.message : "Could not send access request.",
      });
    },
  });

  // Core Navigation Registry is the primary source when present.
  // Module Registry-derived nav remains the compatibility fallback, and the
  // static nav keeps the shell usable while context is loading or on older APIs.
  const resolvedSections = buildNavSectionsFromNavigation(navigation, effectiveMode);
  const dynamicSections = availableModules.length > 0
    ? buildNavSections(availableModules, effectiveMode)
    : [];
  const staticSections = navSectionsForMode(effectiveMode);
  const sections = resolvedSections.length > 0
    ? resolvedSections
    : dynamicSections.length > 0
    ? dynamicSections
    : staticSections;
  const liveCandidateSections = navConfigEnabled && liveRoleConfigQuery.data
    ? mergeLiveNavigationCandidateSections(sections, staticSections, liveRoleConfigQuery.data)
    : sections;

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

  const liveNavigation = useMemo(() => resolveLiveNavigationConfig({
    sections: liveCandidateSections,
    featureEnabled: Boolean(navConfigEnabled && liveRoleConfigQuery.isSuccess),
    roleConfig: liveRoleConfigQuery.data ?? null,
    canAccessItem: shouldShowItem,
  }), [liveCandidateSections, navConfigEnabled, liveRoleConfigQuery.isSuccess, liveRoleConfigQuery.data, permissionsLoading, skippedUser, isEditMode, can]);
  const renderedSections = liveNavigation.diagnostics.fallbackUsed ? sections : liveNavigation.sections;
  const liveNavigationConfigApplied = !liveNavigation.diagnostics.fallbackUsed;

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
      {renderedSections.map((section) => {
        const visibleItems = liveNavigationConfigApplied ? section.items : section.items.filter(shouldShowItem);
        if (visibleItems.length === 0) return null;
        return (
          <section key={section.label} aria-label={section.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.label}
              </div>
            )}
            {visibleItems.map((item) => {
              const liveItem = item as LiveNavigationConfigItem;
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              const isLocked = liveItem.navigationConfigState === "visible_locked";
              const link = isLocked ? (
                <button
                  type="button"
                  className={cn(
                    "flex h-9 w-full cursor-help items-center gap-3 rounded-md border border-amber-200/70 bg-amber-50/70 px-3 text-sm text-amber-800 transition-colors hover:bg-amber-100/80 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-950/35",
                    collapsed && "justify-center px-0"
                  )}
                  aria-disabled="true"
                  title={liveItem.navigationConfigReason ?? "Access restricted"}
                  onClick={(event) => {
                    event.preventDefault();
                    setLockedAccessItem(liveItem);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Access restricted</span>
                </button>
              ) : (
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

      {lockedAccessItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Access restricted"
          onClick={() => setLockedAccessItem(null)}
        >
          <div
            className="flex w-full max-w-md flex-col overflow-hidden rounded-lg border bg-card shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Access restricted
                </div>
                <p className="text-sm text-muted-foreground">{lockedAccessItem.label}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setLockedAccessItem(null)}
                aria-label="Close access details"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <p className="text-muted-foreground">
                This item is visible because navigation config is set to show locked items, but backend permissions still block access.
              </p>
              <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Route</dt>
                  <dd className="text-right font-mono text-xs text-foreground">{lockedAccessItem.href}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd className="text-right capitalize text-foreground">{effectiveMode}</dd>
                </div>
                {liveConfigRole ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="text-right text-foreground">{liveConfigRole.name}</dd>
                  </div>
                ) : null}
                {lockedAccessItem.navKey ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Nav key</dt>
                    <dd className="text-right font-mono text-xs text-foreground">{lockedAccessItem.navKey}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missing permissions</div>
                {lockedAccessItem.navigationConfigMissingPermissions?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lockedAccessItem.navigationConfigMissingPermissions.map((permission) => (
                      <code key={permission} className="rounded border bg-background px-1.5 py-0.5 text-xs text-foreground">
                        {permission}
                      </code>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific permission metadata was provided for this item.</p>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setLockedAccessItem(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => requestAccessMutation.mutate(lockedAccessItem)}
                  disabled={requestAccessMutation.isPending || !accessToken}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  {requestAccessMutation.isPending ? "Sending..." : "Request access"}
                </Button>
              </div>
            </div>
          </div>
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
