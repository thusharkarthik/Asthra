"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/services/api/core-api";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth-store";
import { useContextVersionStore } from "@/stores/context-version-store";
import type { ContextVersionSnapshot } from "@/types/core";

const VERSION_CHECK_INTERVAL_MS = 60_000;

function versionsMatch(previous: ContextVersionSnapshot | null, next: ContextVersionSnapshot | undefined) {
  if (!previous || !next) return false;
  return (
    previous.user_id === next.user_id &&
    previous.organization_id === next.organization_id &&
    previous.organization_version === next.organization_version &&
    previous.workspace_id === next.workspace_id &&
    previous.workspace_version === next.workspace_version &&
    previous.project_id === next.project_id &&
    previous.project_version === next.project_version &&
    previous.access_version === next.access_version
  );
}

export function useContextVersion(scope: { organizationId?: number | null; workspaceId?: number | null; projectId?: number | null }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const snapshot = useContextVersionStore((state) => state.snapshot);
  const setSnapshot = useContextVersionStore((state) => state.setSnapshot);

  const query = useQuery({
    queryKey: queryKeys.context.version(scope.organizationId, scope.workspaceId, scope.projectId),
    queryFn: () =>
      coreApi.getContextVersion(accessToken ?? "", {
        organization_id: scope.organizationId,
        workspace_id: scope.workspaceId,
        project_id: scope.projectId
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchInterval: VERSION_CHECK_INTERVAL_MS,
    refetchOnWindowFocus: true,
    retry: 1
  });

  useEffect(() => {
    if (accessToken) void query.refetch();
    // Route changes are a cheap point to revalidate the version snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, pathname]);

  useEffect(() => {
    const next = query.data;
    if (!next) return;
    if (versionsMatch(snapshot, next)) return;

    if (snapshot && snapshot.user_id !== next.user_id) {
      queryClient.removeQueries({ queryKey: queryKeys.context.all });
      queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser });
      queryClient.removeQueries({ queryKey: queryKeys.organizations.all });
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.removeQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({ queryKey: queryKeys.permissions.all });
      queryClient.removeQueries({ queryKey: queryKeys.platformContext.all });
      setSnapshot(next);
      return;
    }

    if (snapshot && snapshot.organization_version !== next.organization_version) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list(next.organization_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all });
    }
    if (snapshot && snapshot.workspace_version !== next.workspace_version) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list(next.organization_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(next.workspace_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(next.workspace_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all });
    }
    if (snapshot && snapshot.project_version !== next.project_version) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(next.workspace_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(next.project_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all });
    }
    if (snapshot && snapshot.access_version !== next.access_version) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.permissions.current(next.organization_id, next.workspace_id, next.project_id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all });
    }

    setSnapshot(next);
  }, [query.data, queryClient, setSnapshot, snapshot]);

  return {
    ...query,
    snapshot,
    versionsMatch: versionsMatch(snapshot, query.data)
  };
}
