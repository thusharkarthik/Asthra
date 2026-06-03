"use client";

import { FileText, Lightbulb, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";

const mockResults = [
  { type: "Work Item", title: "Platform service map", icon: Search },
  { type: "Page", title: "Workspace memory plan", icon: FileText },
  { type: "Idea", title: "AI assistant shell", icon: Lightbulb },
  { type: "Ticket", title: "Docker compose readiness", icon: MessageSquare }
];

export function SearchDialog() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto mt-24 max-w-2xl rounded-lg border bg-card shadow-lg">
        <div className="border-b p-4">
          <Input autoFocus placeholder="Search work items, pages, ideas, tickets" />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {mockResults.map((result) => {
            const Icon = result.icon;
            return (
              <div key={`${result.type}-${result.title}`} className="flex items-center gap-3 rounded-md p-3 hover:bg-muted">
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">{result.title}</div>
                  <div className="text-xs text-muted-foreground">{result.type}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end border-t p-3">
          <Button variant="ghost" onClick={() => setSearchOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
