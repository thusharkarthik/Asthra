import { Bell, Menu, UserCircle } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { ProjectSwitcher } from "@/components/navigation/project-switcher";
import { SearchBar } from "@/components/search/search-bar";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { WorkspaceSwitcher } from "@/components/navigation/workspace-switcher";
import { Button } from "@/components/ui/button";

export function AsthraShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
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
          <Button size="icon" variant="ghost" aria-label="User menu">
            <UserCircle className="h-5 w-5" />
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
