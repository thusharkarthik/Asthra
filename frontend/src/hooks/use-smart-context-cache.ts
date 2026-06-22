"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coreApi } from "@/services/api/core-api";
import { projectApi } from "@/services/api/project-api";
import { settingsApi } from "@/services/api/settings-api";
import { workspaceApi } from "@/services/api/workspace-api";
import { queryKeys } from "@/lib/queryKeys";
import { can as hasPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => coreApi.currentUser(accessToken ?? ""),
    enabled: Boolean(accessToken),
    initialData: currentUser ?? undefined,
    staleTime: 2 * 60_000
  });
}

export function useOrganizations() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const query = useQuery({
    queryKey: queryKeys.context.organizations,
    queryFn: () => coreApi.listOrganizations(accessToken ?? ""),
    enabled: Boolean(accessToken),
    staleTime: 2 * 60_000
  });

  useEffect(() => {
    if (query.data) setOrganizations(query.data);
  }, [query.data, setOrganizations]);

  return query;
}

export function useWorkspaces(organizationId?: number | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const query = useQuery({
    queryKey: queryKeys.context.workspaces(organizationId),
    queryFn: () => workspaceApi.listWorkspaces(accessToken ?? "", organizationId),
    enabled: Boolean(accessToken && organizationId),
    staleTime: 2 * 60_000
  });

  useEffect(() => {
    if (query.data) setWorkspaces(query.data);
  }, [query.data, setWorkspaces]);

  return query;
}

export function useProjects(workspaceId?: number | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setProjects = useWorkspaceStore((state) => state.setProjects);
  const query = useQuery({
    queryKey: queryKeys.context.projects(workspaceId),
    queryFn: () => projectApi.listProjects(accessToken ?? "", workspaceId),
    enabled: Boolean(accessToken && workspaceId),
    staleTime: 2 * 60_000
  });

  useEffect(() => {
    if (query.data) setProjects(query.data);
  }, [query.data, setProjects]);

  return query;
}

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

export function useCurrentPermissions() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const scope = useCurrentScope();
  return useQuery({
    queryKey: queryKeys.context.permissions(scope.organizationId, scope.workspaceId, scope.projectId),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {
      org_id: scope.organizationId,
      workspace_id: scope.workspaceId,
      project_id: scope.projectId
    }),
    enabled: Boolean(accessToken),
    staleTime: 60_000
  });
}

export function useCan(permissionCode: string) {
  const permissionsQuery = useCurrentPermissions();
  return hasPermission(permissionsQuery.data?.permission_codes ?? [], permissionCode);
}

export function useSmartContextCache() {
  const scope = useCurrentScope();
  const organizationsQuery = useOrganizations();
  const workspacesQuery = useWorkspaces(scope.organizationId);
  const projectsQuery = useProjects(scope.workspaceId);
  const permissionsQuery = useCurrentPermissions();

  return {
    scope,
    organizationsQuery,
    workspacesQuery,
    projectsQuery,
    permissionsQuery,
    isLoading: organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading || permissionsQuery.isLoading,
    error: organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error ?? permissionsQuery.error
  };
}

export function useClearContextCache() {
  const queryClient = useQueryClient();
  const resetContext = useWorkspaceStore((state) => state.resetContext);
  return () => {
    resetContext();
    queryClient.removeQueries({ queryKey: queryKeys.context.all });
    queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser });
    queryClient.removeQueries({ queryKey: queryKeys.settings.all });
  };
}
