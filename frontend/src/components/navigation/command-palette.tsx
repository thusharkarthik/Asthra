"use client";

import { Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { navItems } from "@/components/navigation/nav-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";

const staticCommands = [
  { label: "Open Assistant", action: "assistant" as const, icon: Sparkles },
  { label: "Search Workspace", action: "search" as const, icon: Search }
];

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen, setAssistantOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");

  const commands = useMemo(() => {
    const routeCommands = navItems
      .filter((item) => item.href && !item.disabled)
      .map((item) => ({ label: `Go to ${item.label}`, href: item.href, icon: item.icon }));
    return [...routeCommands, ...staticCommands];
  }, []);

  const visibleCommands = commands.filter((command) => command.label.toLowerCase().includes(query.trim().toLowerCase()));

  const runCommand = (command: (typeof commands)[number]) => {
    setCommandPaletteOpen(false);
    setQuery("");
    if ("href" in command && command.href) router.push(command.href);
    if ("action" in command && command.action === "assistant") setAssistantOpen(true);
    if ("action" in command && command.action === "search") setSearchOpen(true);
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="mx-auto mt-24 max-w-xl rounded-lg border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b p-3">
          <Input autoFocus placeholder="Run a command or go to a module" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button size="icon" variant="ghost" aria-label="Close command palette" onClick={() => setCommandPaletteOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {visibleCommands.length === 0 ? (
            <div className="rounded-md p-4 text-sm text-muted-foreground">No commands found.</div>
          ) : (
            visibleCommands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => runCommand(command)}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{command.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">Press Ctrl+K or Cmd+K to reopen.</div>
      </div>
    </div>
  );
}
