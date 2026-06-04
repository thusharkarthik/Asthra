"use client";

import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { CommandPalette } from "@/components/navigation/command-palette";
import { OrganizationSwitcher } from "@/components/navigation/organization-switcher";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { ProjectSwitcher } from "@/components/navigation/project-switcher";
import { SearchBar } from "@/components/search/search-bar";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { WorkspaceSwitcher } from "@/components/navigation/workspace-switcher";
import { Button } from "@/components/ui/button";
import { useWorkspaceContextQueries } from "@/hooks/use-workspace-context";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const publicPaths = new Set(["/login", "/register"]);

function WorkspaceContextLoader() {
  useWorkspaceContextQueries();
  return null;
}

export function AsthraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isPublicPath = publicPaths.has(pathname);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isPublicPath) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, isPublicPath, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandPaletteOpen]);

  if (isPublicPath) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    );
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading Asthra...
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceContextLoader />
      <aside className={cn("hidden shrink-0 border-r bg-card transition-[width] md:block", sidebarCollapsed ? "w-16" : "w-64")}>
        <div className={cn("flex h-14 items-center border-b px-4", sidebarCollapsed && "justify-center px-2")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
          {!sidebarCollapsed && <span className="ml-3 text-sm font-semibold">Asthra</span>}
        </div>
        <div className="p-3">
          <SidebarNav collapsed={sidebarCollapsed} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur md:px-4">
          <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="hidden md:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <OrganizationSwitcher />
            <WorkspaceSwitcher />
            <ProjectSwitcher />
          </div>
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>
          <Button size="icon" variant="ghost" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <div className="hidden min-w-0 max-w-40 text-right text-xs leading-tight text-muted-foreground lg:block">
            <div className="truncate font-medium text-foreground">{currentUser?.full_name ?? currentUser?.email}</div>
            <div className="truncate">{currentUser?.email}</div>
          </div>
          <div className="relative">
            <Button size="icon" variant="ghost" aria-label="User menu" title={currentUser?.email ?? "User"} onClick={() => setUserMenuOpen((value) => !value)}>
              <UserCircle className="h-5 w-5" />
            </Button>
            {userMenuOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card p-2 shadow-lg">
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
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          <AssistantDock />
        </div>
        <footer className="border-t px-4 py-2 text-xs text-muted-foreground">Asthra platform shell foundation</footer>
      </div>
      <SearchDialog />
      <CommandPalette />
    </div>
  );
}
