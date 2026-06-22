"use client";

import { useSmartContextCache } from "@/hooks/use-smart-context-cache";

export function useWorkspaceContextQueries() {
  const cache = useSmartContextCache();

  return {
    organizationsQuery: cache.organizationsQuery,
    workspacesQuery: cache.workspacesQuery,
    projectsQuery: cache.projectsQuery,
    isLoading: cache.isLoading,
    error: cache.error
  };
}
