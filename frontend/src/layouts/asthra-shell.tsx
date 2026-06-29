"use client";

import { Bell, HelpCircle, LogOut, PanelLeftClose, PanelLeftOpen, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { AsthraLogo } from "@/components/brand/asthra-logo";
import { CommandPalette } from "@/components/navigation/command-palette";
import { OrganizationSwitcher } from "@/components/navigation/organization-switcher";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { ProjectSwitcher } from "@/components/navigation/project-switcher";
import { NotificationCenter } from "@/components/platform/notification-center";
import { SearchBar } from "@/components/search/search-bar";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { WorkspaceSwitcher } from "@/components/navigation/workspace-switcher";
import { Button } from "@/components/ui/button";
import { useWorkspaceContextQueries } from "@/hooks/use-workspace-context";
import { useCurrentPermissions, usePlatformContext } from "@/context/platformContext";
import { OnboardingGate } from "@/components/platform/platform-setup-guide";
import { ContextualHelpModal } from "@/components/platform/contextual-help";
import { useAuthStore } from "@/stores/auth-store";
import { settingsApi } from "@/services/api/settings-api";
import { useNotificationStore } from "@/stores/notification-store";
import { useProgressStore } from "@/stores/progress-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { NavigationMode } from "@/lib/navigation-mode";
import { detectNavigationMode, autoDetectModeFromPath } from "@/lib/navigation-mode";
import { useSimulationStore } from "@/lib/permission-simulator";

const publicPaths = new Set(["/login", "/register"]);
const AUTH_LOGOUT_TRANSITION_MS = 1450;
const AUTH_ROUTE_SWAP_DELAY_MS = 220;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function WorkspaceContextLoader() {
  useWorkspaceContextQueries();
  return null;
}

function PermissionAwareSidebar({
  collapsed,
  skippedUser,
  navigationMode,
  isSuperuser,
  modeOverride,
  onModeOverride,
}: {
  collapsed: boolean;
  skippedUser?: boolean;
  navigationMode: NavigationMode;
  isSuperuser: boolean;
  modeOverride: NavigationMode | null;
  onModeOverride: (mode: NavigationMode | null) => void;
}) {
  const permissions = useCurrentPermissions();
  return (
    <SidebarNav
      collapsed={collapsed}
      permissionCodes={permissions.permissionCodes}
      permissionsLoading={permissions.isLoading}
      skippedUser={skippedUser}
      navigationMode={navigationMode}
      isSuperuser={isSuperuser}
      modeOverride={modeOverride}
      onModeOverride={onModeOverride}
    />
  );
}

export function AsthraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const { organizations, permissions, isLoading: contextLoading } = usePlatformContext();
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setAuthTransition = useUIStore((state) => state.setAuthTransition);
  const zustandUnread = useNotificationStore((state) => state.notifications.filter((item) => item.unread).length);
  const coreNotificationsQuery = useQuery({
    queryKey: ["core", "notifications"],
    queryFn: () => settingsApi.listNotifications(accessToken ?? ""),
    enabled: Boolean(accessToken && isAuthenticated),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const coreUnread = (coreNotificationsQuery.data ?? []).filter((n) => !n.is_read).length;
  const unreadNotifications = zustandUnread + coreUnread;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [skippedOnboarding, setSkippedOnboarding] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [superuserModeOverride, setSuperuserModeOverride] = useState<NavigationMode | null>(null);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const simulatedMode = useSimulationStore((state) => state.simulatedMode);
  const simulatedRoleName = useSimulationStore((state) => state.simulatedRoleName);
  const exitSimulation = useSimulationStore((state) => state.exitSimulation);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const progressActive = useProgressStore((state) => state.active);
  const progressValue = useProgressStore((state) => state.progress);
  const progressFailed = useProgressStore((state) => state.failed);
  const startProgress = useProgressStore((state) => state.startProgress);
  const completeProgress = useProgressStore((state) => state.completeProgress);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const isPublicPath = publicPaths.has(pathname);
  const hasShellLoading = routeLoading || isFetching > 0 || isMutating > 0;
  const showBottomProgress = progressActive || hasShellLoading;
  const hasPlatformRole = (permissions?.roles?.length ?? 0) > 0;
  const needsOnboarding = !isPublicPath && !contextLoading && !currentUser?.is_superuser && !hasPlatformRole && organizations.length === 0;
  const isSkippedUser = needsOnboarding && skippedOnboarding;
  const isSuperuser = Boolean(currentUser?.is_superuser);

  // Detect base navigation mode from roles
  const baseNavigationMode = useMemo((): NavigationMode => {
    return detectNavigationMode(isSuperuser, permissions?.roles ?? []);
  }, [isSuperuser, permissions?.roles]);

  // For superuser, auto-detect mode from current route when no manual override
  const autoDetectedMode = useMemo((): NavigationMode => {
    if (!isSuperuser) return baseNavigationMode;
    return autoDetectModeFromPath(pathname);
  }, [isSuperuser, baseNavigationMode, pathname]);

  // Effective navigation mode: manual override beats auto-detection; simulation overrides both
  const navigationMode: NavigationMode = superuserModeOverride ?? autoDetectedMode;
  const effectiveNavigationMode: NavigationMode = isSimulating && simulatedMode ? simulatedMode : navigationMode;

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isPublicPath) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, isPublicPath, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false);
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [notificationsOpen, userMenuOpen]);

  useEffect(() => {
    if (isPublicPath) return;
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [isPublicPath, pathname]);

  useEffect(() => {
    if (isPublicPath) return;
    if (hasShellLoading) {
      startProgress();
      return;
    }
    if (progressActive) completeProgress();
  }, [completeProgress, hasShellLoading, isPublicPath, progressActive, startProgress]);

  useEffect(() => {
    if (!isSkippedUser) return;
    const allowed = ["/", "/settings", "/settings/profile", "/settings/preferences", "/settings/notifications", "/settings/account"];
    const isAllowed = allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isAllowed) router.replace("/");
  }, [isSkippedUser, pathname, router]);

  if (isPublicPath) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    );
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <AsthraLogo markClassName="h-12 w-12 rounded-2xl" />
          <span>Loading Asthra...</span>
        </div>
      </main>
    );
  }

  if (needsOnboarding && !skippedOnboarding) {
    return <OnboardingGate onSkip={() => setSkippedOnboarding(true)} />;
  }

  const handleLogout = async () => {
    setUserMenuOpen(false);
    startProgress();
    setAuthTransition("logout");
    await wait(AUTH_ROUTE_SWAP_DELAY_MS);
    logout();
    router.replace("/login");
    await wait(AUTH_LOGOUT_TRANSITION_MS - AUTH_ROUTE_SWAP_DELAY_MS + 100);
    completeProgress();
    setAuthTransition(null);
  };

  // Bottom bar scope selectors depend on effective navigation mode
  const showOrgSwitcher = effectiveNavigationMode !== "platform";
  const showWorkspaceSwitcher = effectiveNavigationMode === "work";
  const showProjectSwitcher = effectiveNavigationMode === "work";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WorkspaceContextLoader />
      <div className="flex min-h-0 flex-1 pb-3">
        <aside className={cn("hidden min-h-0 shrink-0 flex-col border-r bg-card transition-[width] md:flex", sidebarCollapsed ? "w-16" : "w-64")}>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <PermissionAwareSidebar
              collapsed={sidebarCollapsed}
              skippedUser={isSkippedUser}
              navigationMode={effectiveNavigationMode}
              isSuperuser={isSuperuser}
              modeOverride={superuserModeOverride}
              onModeOverride={setSuperuserModeOverride}
            />
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {isSimulating && (
            <div className="shrink-0 flex items-center justify-between border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm dark:border-amber-700 dark:bg-amber-950/60">
              <span className="text-amber-800 dark:text-amber-300">
                <span className="mr-1">👁</span>
                <span className="font-semibold">Simulating:</span>{" "}
                <span>{simulatedRoleName}</span>
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                  — API calls still use your real token
                </span>
              </span>
              <button
                type="button"
                onClick={exitSimulation}
                className="rounded px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:text-amber-300 dark:hover:bg-amber-800/50"
              >
                Exit Simulation
              </button>
            </div>
          )}
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
      <footer
        className="relative shrink-0 border-t border-border bg-card px-3 py-2 text-card-foreground shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-white"
        aria-label="Workspace bottom dock"
      >
          <div
            aria-hidden="true"
            data-testid="bottom-dock-progress"
            className={cn(
              "pointer-events-none absolute left-0 top-0 h-0.5 w-full overflow-hidden transition-opacity duration-200",
              showBottomProgress ? "opacity-100" : "opacity-0"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.65)] transition-[width] duration-200 ease-out",
                progressFailed ? "bg-destructive" : "bg-cyan-500"
              )}
              style={{ width: `${showBottomProgress ? Math.max(progressValue, 8) : 0}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <div className="flex shrink-0 items-center gap-2 pr-2">
              <AsthraLogo showWordmark subtitle="Platform" />
              <Button
                size="icon"
                variant="ghost"
                className="hidden md:inline-flex dark:text-white dark:hover:bg-white/10"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 lg:flex-nowrap">
              {showOrgSwitcher && <OrganizationSwitcher />}
              {showWorkspaceSwitcher && <WorkspaceSwitcher />}
              {showProjectSwitcher && <ProjectSwitcher />}
              {effectiveNavigationMode === "platform" && (
                <span className="text-xs text-muted-foreground dark:text-white/50">Platform Mode</span>
              )}
              <div className="min-w-[220px] flex-1 sm:min-w-[280px] lg:max-w-md">
                <SearchBar />
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <div className="relative" ref={notificationsRef}>
                <Button size="icon" variant="ghost" className="dark:text-white dark:hover:bg-white/10" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unreadNotifications}</span> : null}
                </Button>
                <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} placement="bottom" />
              </div>
              <ThemeToggle className="dark:text-white dark:hover:bg-white/10" />
              <Button size="icon" variant="ghost" className="dark:text-white dark:hover:bg-white/10" aria-label="Help" onClick={() => setHelpOpen(true)}>
                <HelpCircle className="h-4 w-4" />
              </Button>
              <div className="hidden min-w-0 max-w-40 text-right text-xs leading-tight text-muted-foreground dark:text-white/60 lg:block">
                <div className="truncate font-medium text-foreground dark:text-white">{currentUser?.full_name ?? currentUser?.email}</div>
                <div className="truncate">{currentUser?.email}</div>
              </div>
              <div className="relative" ref={userMenuRef}>
                <Button size="icon" variant="ghost" className="dark:text-white dark:hover:bg-white/10" aria-label="User menu" title={currentUser?.email ?? "User"} onClick={() => setUserMenuOpen((value) => !value)}>
                  <UserCircle className="h-5 w-5" />
                </Button>
                {userMenuOpen ? (
                  <div className="absolute bottom-11 right-0 w-56 rounded-md border bg-card p-2 text-foreground shadow-lg">
                    <div className="border-b px-2 pb-2 text-xs text-muted-foreground">
                      <div className="truncate font-medium text-foreground">{currentUser?.full_name ?? "Asthra user"}</div>
                      <div className="truncate">{currentUser?.email}</div>
                    </div>
                    <Link className="mt-2 block rounded-md px-2 py-2 text-sm hover:bg-muted" href="/settings/profile" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                    <Link className="block rounded-md px-2 py-2 text-sm hover:bg-muted" href="/settings/preferences" onClick={() => setUserMenuOpen(false)}>Preferences</Link>
                    <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-muted" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
      </footer>
      <AssistantDock />
      <SearchDialog />
      <CommandPalette />
      <ContextualHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} pathname={pathname} />
    </div>
  );
}
