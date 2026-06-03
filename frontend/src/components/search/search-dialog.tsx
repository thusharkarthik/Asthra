"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Lightbulb, MessageSquare, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchApi } from "@/services/api/search-api";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { WorkspaceSearchResult } from "@/types/assistant";

const sourceLabels: Record<string, string> = {
  docs_page: "Docs",
  work_item: "Work",
  idea: "Ideas",
  support_ticket: "Tickets",
  incident: "Incidents",
  release: "Releases",
  discussion_thread: "Discussions"
};

function sourceIcon(sourceType: string) {
  if (sourceType === "docs_page") return FileText;
  if (sourceType === "idea") return Lightbulb;
  if (sourceType === "support_ticket" || sourceType === "discussion_thread") return MessageSquare;
  return Search;
}

function groupResults(results: WorkspaceSearchResult[]) {
  return results.reduce<Record<string, WorkspaceSearchResult[]>>((groups, result) => {
    const key = result.source_type || "unknown";
    groups[key] = [...(groups[key] ?? []), result];
    return groups;
  }, {});
}

export function SearchDialog() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["workspace-search", selectedWorkspaceId, debouncedQuery],
    queryFn: () =>
      searchApi.workspaceSearch(accessToken ?? "", {
        workspace_id: selectedWorkspaceId ?? 0,
        query: debouncedQuery,
        top_k: 8
    }),
    enabled: Boolean(accessToken) && Boolean(selectedWorkspaceId) && debouncedQuery.length > 1,
    retry: 0
  });

  const groupedResults = useMemo(() => groupResults(searchQuery.data?.results ?? []), [searchQuery.data?.results]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto mt-24 max-w-2xl rounded-lg border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b p-4">
          <Input
            autoFocus
            placeholder="Search work items, pages, ideas, tickets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button size="icon" variant="ghost" aria-label="Close search" onClick={() => setSearchOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {!selectedWorkspaceId ? (
            <div className="rounded-md p-4 text-sm text-muted-foreground">Select a workspace to search Asthra memory.</div>
          ) : debouncedQuery.length <= 1 ? (
            <div className="rounded-md p-4 text-sm text-muted-foreground">Type at least two characters to search this workspace.</div>
          ) : searchQuery.isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 rounded-md bg-muted" />
              ))}
            </div>
          ) : searchQuery.error ? (
            <div className="space-y-3 rounded-md p-4 text-sm text-destructive">
              <div>Workspace search failed.</div>
              <Button size="sm" variant="outline" onClick={() => searchQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : Object.keys(groupedResults).length === 0 ? (
            <div className="rounded-md p-4 text-sm text-muted-foreground">No results found.</div>
          ) : (
            Object.entries(groupedResults).map(([sourceType, results]) => {
              const Icon = sourceIcon(sourceType);
              return (
                <section key={sourceType} className="mb-3">
                  <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                    {sourceLabels[sourceType] ?? sourceType}
                  </div>
                  {results.map((result, index) => (
                    <div key={`${sourceType}-${result.id ?? index}`} className="flex items-start gap-3 rounded-md p-3 hover:bg-muted">
                      <Icon className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{result.title}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {result.snippet ?? result.chunk ?? "No snippet available."}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {sourceLabels[sourceType] ?? sourceType}
                          {typeof result.score === "number" ? ` · ${result.score.toFixed(2)}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              );
            })
          )}
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
