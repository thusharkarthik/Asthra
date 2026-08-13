"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { coreApi } from "@/services/api/core-api";
import { projectApi } from "@/services/api/project-api";
import { settingsApi } from "@/services/api/settings-api";
import { workspaceApi } from "@/services/api/workspace-api";
import { queryKeys } from "@/lib/queryKeys";
import { can as hasPermission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const CONTEXT_STALE_TIME = 2 * 60_000;

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => coreApi.currentUser(accessToken ?? ""),
    enabled: Boolean(accessToken),
    initialData: currentUser ?? undefined,
    staleTime: CONTEXT_STALE_TIME
  });
}

export function useOrganizations() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const query = useQuery({
    queryKey: queryKeys.organizations.list,
    queryFn: () => coreApi.listOrganizations(accessToken ?? ""),
    enabled: Boolean(accessToken),
    staleTime: CONTEXT_STALE_TIME
  });

  useEffect(() => {
    if (query.data) setOrganizations(query.data);
  }, [query.data, setOrganizations]);

  return query;
}

export function useOrganization(id?: number | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => settingsApi.getOrganization(accessToken ?? "", Number(id)),
    enabled: Boolean(accessToken && id),
    staleTime: CONTEXT_STALE_TIME
  });
}

export function useWorkspaces(orgId?: number | null) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const query = useQuery({
    queryKey: queryKeys.workspaces.list(orgId),
    queryFn: () => workspaceApi.listWorkspaces(accessToken ?? "", orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: CONTEXT_STALE_TIME
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
    queryKey: queryKeys.projects.list(workspaceId),
    queryFn: () => projectApi.listProjects(accessToken ?? "", workspaceId),
    enabled: Boolean(accessToken && workspaceId),
    staleTime: CONTEXT_STALE_TIME
  });

  useEffect(() => {
    if (query.data) setProjects(query.data);
  }, [query.data, setProjects]);

  return query;
}

export function useMembers(scope?: { type?: string | null; id?: number | null }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.members.list(scope?.type, scope?.id),
    queryFn: async () => {
      if (scope?.type === "organization" && scope.id) return settingsApi.listOrganizationMembers(accessToken ?? "", scope.id);
      if (scope?.type === "workspace" && scope.id) return settingsApi.listWorkspaceMembers(accessToken ?? "", scope.id);
      if (scope?.type === "project" && scope.id) return settingsApi.listProjectMembers(accessToken ?? "", scope.id);
      return [];
    },
    enabled: Boolean(accessToken && scope?.type && scope?.id),
    staleTime: CONTEXT_STALE_TIME
  });
}

export function useRoles() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.roles.list,
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken),
    staleTime: CONTEXT_STALE_TIME
  });
}

export function usePermissions() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: queryKeys.permissions.list,
    queryFn: () => settingsApi.listPermissions(accessToken ?? ""),
    enabled: Boolean(accessToken),
    staleTime: CONTEXT_STALE_TIME
  });
}

export function useCurrentPermissions(scopeOverride?: { orgId?: number | null; workspaceId?: number | null; projectId?: number | null }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const orgId = scopeOverride?.orgId ?? selectedOrganizationId ?? undefined;
  const workspaceId = scopeOverride?.workspaceId ?? selectedWorkspaceId ?? undefined;
  const projectId = scopeOverride?.projectId ?? selectedProjectId ?? undefined;

  return useQuery({
    queryKey: queryKeys.permissions.current(orgId, workspaceId, projectId),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {
      org_id: orgId,
      workspace_id: workspaceId,
      project_id: projectId
    }),
    enabled: Boolean(accessToken),
    staleTime: 60_000
  });
}

export function useCan(permissionCode: string) {
  const permissionsQuery = useCurrentPermissions();
  return hasPermission(permissionsQuery.data?.permission_codes ?? [], permissionCode);
}
