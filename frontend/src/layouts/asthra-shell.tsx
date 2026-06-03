"use client";

import { Bell, LogOut, Menu, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { AssistantDock } from "@/components/assistant/assistant-dock";
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
  const isPublicPath = publicPaths.has(pathname);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated && !isPublicPath) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, isPublicPath, router]);

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
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            A
          </div>
          <span className="ml-3 text-sm font-semibold">Asthra</span>
        </div>
        <div className="p-3">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur md:px-4">
          <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open navigation">
            <Menu className="h-4 w-4" />
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
          <Button size="icon" variant="ghost" aria-label="User menu" title={currentUser?.email ?? "User"}>
            <UserCircle className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Log out" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          <AssistantDock />
        </div>
        <footer className="border-t px-4 py-2 text-xs text-muted-foreground">Asthra platform shell foundation</footer>
      </div>
      <SearchDialog />
    </div>
  );
}
