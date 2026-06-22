"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useCan,
  useCurrentPermissions,
  useCurrentUser,
  useOrganizations,
  useProjects,
  useWorkspaces
} from "@/hooks/use-platform-queries";
import { useContextVersion } from "@/hooks/use-context-version";
import { useContextVersionStore } from "@/stores/context-version-store";

export { useCan, useCurrentPermissions, useCurrentUser, useOrganizations, useProjects, useWorkspaces };

export function useCurrentScope() {
  const organizations = useWorkspaceStore((state) => state.organizations);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const projects = useWorkspaceStore((state) => state.projects);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);

  return useMemo(() => ({
    organizationId: selectedOrganizationId,
    workspaceId: selectedWorkspaceId,
    projectId: selectedProjectId,
    organization: organizations.find((item) => item.id === selectedOrganizationId) ?? null,
    workspace: workspaces.find((item) => item.id === selectedWorkspaceId) ?? null,
    project: projects.find((item) => item.id === selectedProjectId) ?? null
  }), [organizations, projects, selectedOrganizationId, selectedProjectId, selectedWorkspaceId, workspaces]);
}

export function useSmartContextCache() {
  const scope = useCurrentScope();
  const organizationsQuery = useOrganizations();
  const workspacesQuery = useWorkspaces(scope.organizationId);
  const projectsQuery = useProjects(scope.workspaceId);
  const permissionsQuery = useCurrentPermissions();
  const contextVersionQuery = useContextVersion({
    organizationId: scope.organizationId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId
  });

  return {
    scope,
    organizationsQuery,
    workspacesQuery,
    projectsQuery,
    permissionsQuery,
    contextVersionQuery,
    isLoading: organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading || permissionsQuery.isLoading,
    error: organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error ?? permissionsQuery.error ?? contextVersionQuery.error
  };
}

export function useClearContextCache() {
  const queryClient = useQueryClient();
  const resetContext = useWorkspaceStore((state) => state.resetContext);
  const clearVersionSnapshot = useContextVersionStore((state) => state.clearSnapshot);
  return () => {
    resetContext();
    clearVersionSnapshot();
    queryClient.removeQueries({ queryKey: queryKeys.context.all });
    queryClient.removeQueries({ queryKey: queryKeys.organizations.all });
    queryClient.removeQueries({ queryKey: queryKeys.workspaces.all });
    queryClient.removeQueries({ queryKey: queryKeys.projects.all });
    queryClient.removeQueries({ queryKey: queryKeys.permissions.all });
    queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser });
    queryClient.removeQueries({ queryKey: queryKeys.settings.all });
  };
}
