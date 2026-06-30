"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ContextVersionSnapshot, CoreUser, CurrentUserPermissions, Organization, ProjectRecord, WorkspaceRecord } from "@/types/core";
import { useContextVersion } from "@/hooks/use-context-version";
import { can as hasPermission } from "@/lib/permissions";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useAuthStore } from "@/stores/auth-store";
import { coreApi } from "@/services/api/core-api";
import { queryKeys } from "@/lib/queryKeys";

type CurrentScope = {
  organizationId: number | null;
  workspaceId: number | null;
  projectId: number | null;
  organization: Organization | null;
  workspace: WorkspaceRecord | null;
  project: ProjectRecord | null;
};

type PlatformContextValue = {
  currentUser: CoreUser | null;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  workspaces: WorkspaceRecord[];
  selectedWorkspace: WorkspaceRecord | null;
  projects: ProjectRecord[];
  selectedProject: ProjectRecord | null;
  permissions: CurrentUserPermissions | null;
  permissionCodes: string[];
  featureFlags: Record<string, boolean>;
  enabledModules: string[];
  contextVersions: ContextVersionSnapshot | null;
  loadedAt: number | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  currentScope: CurrentScope;
  setSelectedOrganization: (organizationId: number | null) => void;
  setSelectedWorkspace: (workspaceId: number | null) => void;
  setSelectedProject: (projectId: number | null) => void;
  can: (permissionCode: string) => boolean;
  isFeatureEnabled: (flagKey: string) => boolean;
  refetchPermissions: () => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformContextProvider({ children }: { children: ReactNode }) {
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const simulatedPermissions = useSimulationStore((state) => state.simulatedPermissions);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const cachedOrganizations = useWorkspaceStore((state) => state.organizations);
  const cachedWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const cachedProjects = useWorkspaceStore((state) => state.projects);
  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setProjects = useWorkspaceStore((state) => state.setProjects);
  const setSelectedOrganization = useWorkspaceStore((state) => state.setSelectedOrganization);
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const setSelectedProject = useWorkspaceStore((state) => state.setSelectedProject);

  const contextQuery = useQuery({
    queryKey: queryKeys.platformContext.detail(selectedOrganizationId, selectedWorkspaceId, selectedProjectId),
    queryFn: () =>
      coreApi.getPlatformContext(accessToken ?? "", {
        org_id: selectedOrganizationId,
        workspace_id: selectedWorkspaceId,
        project_id: selectedProjectId,
      }),
    enabled: Boolean(accessToken),
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
  });

  const contextVersionQuery = useContextVersion({
    organizationId: selectedOrganizationId,
    workspaceId: selectedWorkspaceId,
    projectId: selectedProjectId
  });

  // Sync unified context data into Zustand workspace store for downstream consumers
  useEffect(() => {
    if (!contextQuery.data) return;
    const d = contextQuery.data;
    if (d.organizations.length) setOrganizations(d.organizations as Organization[]);
    if (d.workspaces.length) setWorkspaces(d.workspaces as WorkspaceRecord[]);
    if (d.projects.length) setProjects(d.projects as ProjectRecord[]);
  }, [contextQuery.data, setOrganizations, setWorkspaces, setProjects]);

  const organizations: Organization[] = (contextQuery.data?.organizations as Organization[] | undefined) ?? cachedOrganizations;
  const workspaces: WorkspaceRecord[] = ((contextQuery.data?.workspaces as WorkspaceRecord[] | undefined) ?? cachedWorkspaces).filter(
    (w) => (selectedOrganizationId ? w.organization_id === selectedOrganizationId : true)
  );
  const projects: ProjectRecord[] = ((contextQuery.data?.projects as ProjectRecord[] | undefined) ?? cachedProjects).filter(
    (p) => (selectedWorkspaceId ? p.workspace_id === selectedWorkspaceId : true)
  );
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const permissionCodes = permissionsQuery.data?.permission_codes ?? [];
  const featureFlags = permissionsQuery.data?.feature_flags ?? {};
  const enabledModules = permissionsQuery.data?.enabled_modules ?? [];

  const selectedOrganization = organizations.find((o) => o.id === selectedOrganizationId) ?? null;
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) ?? null;
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const currentUser: CoreUser | null = (contextQuery.data?.user as CoreUser | undefined) ?? null;
  const permissionCodes: string[] = contextQuery.data?.permissions ?? [];
  const permissions: CurrentUserPermissions | null = contextQuery.data
    ? {
        permission_codes: contextQuery.data.permissions,
        roles: contextQuery.data.roles,
        scope: {
          scope_type: selectedWorkspaceId ? "workspace" : selectedOrganizationId ? "organization" : "platform",
          scope_id: selectedWorkspaceId ?? selectedOrganizationId ?? null,
        },
      }
    : null;

  const isLoading = contextQuery.isLoading;
  const isFetching = contextQuery.isFetching;
  const isError = contextQuery.isError;
  const error = contextQuery.error;

  useEffect(() => {
    if (!loadedAt && contextQuery.data) setLoadedAt(Date.now());
  }, [contextQuery.data, loadedAt]);

  const value = useMemo<PlatformContextValue>(() => ({
    currentUser,
    organizations,
    selectedOrganization,
    workspaces,
    selectedWorkspace,
    projects,
    selectedProject,
    permissions,
    permissionCodes,
    featureFlags,
    enabledModules,
    contextVersions: contextVersionQuery.data ?? contextVersionQuery.snapshot ?? null,
    loadedAt,
    isLoading,
    isFetching,
    isError,
    error,
    currentScope: {
      organizationId: selectedOrganizationId,
      workspaceId: selectedWorkspaceId,
      projectId: selectedProjectId,
      organization: selectedOrganization,
      workspace: selectedWorkspace,
      project: selectedProject
    },
    setSelectedOrganization,
    setSelectedWorkspace,
    setSelectedProject,
    can: (permissionCode: string) => {
      if (isSimulating) return simulatedPermissions.includes(permissionCode);
      return hasPermission(permissionCodes, permissionCode);
    },
    isFeatureEnabled: (flagKey: string) => Boolean(featureFlags[flagKey]),
    refetchPermissions: () => {
      void contextQuery.refetch();
    }
  }), [
    currentUser,
    contextVersionQuery.data,
    contextVersionQuery.snapshot,
    error,
    isError,
    isFetching,
    isLoading,
    isSimulating,
    enabledModules,
    featureFlags,
    loadedAt,
    organizations,
    permissionCodes,
    permissions,
    projects,
    selectedOrganization,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
    selectedWorkspace,
    selectedWorkspaceId,
    setSelectedOrganization,
    setSelectedProject,
    setSelectedWorkspace,
    simulatedPermissions,
    workspaces,
    contextQuery,
  ]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatformContext() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatformContext must be used within PlatformContextProvider");
  return value;
}

export function useCurrentScope() {
  return usePlatformContext().currentScope;
}

export function useSelectedOrganization() {
  return usePlatformContext().selectedOrganization;
}

export function useSelectedWorkspace() {
  return usePlatformContext().selectedWorkspace;
}

export function useSelectedProject() {
  return usePlatformContext().selectedProject;
}

export function useCurrentPermissions() {
  const context = usePlatformContext();
  return {
    permissions: context.permissions,
    permissionCodes: context.permissionCodes,
    isLoading: context.isLoading,
    isFetching: context.isFetching,
    isError: context.isError,
    error: context.error,
    refetch: context.refetchPermissions
  };
}

export function useCan(permissionCode: string) {
  return usePlatformContext().can(permissionCode);
}
