"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CoreUser, CurrentUserPermissions, Organization, ProjectRecord, WorkspaceRecord } from "@/types/core";
import {
  useCurrentPermissions as useCurrentPermissionsQuery,
  useCurrentUser,
  useOrganizations,
  useProjects,
  useWorkspaces
} from "@/hooks/use-platform-queries";
import { useContextVersion } from "@/hooks/use-context-version";
import { can as hasPermission } from "@/lib/permissions";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSimulationStore } from "@/lib/permission-simulator";
import type { ContextVersionSnapshot } from "@/types/core";

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
  refetchPermissions: () => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformContextProvider({ children }: { children: ReactNode }) {
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const simulatedPermissions = useSimulationStore((state) => state.simulatedPermissions);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const cachedOrganizations = useWorkspaceStore((state) => state.organizations);
  const cachedWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const cachedProjects = useWorkspaceStore((state) => state.projects);
  const setSelectedOrganization = useWorkspaceStore((state) => state.setSelectedOrganization);
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const setSelectedProject = useWorkspaceStore((state) => state.setSelectedProject);

  const currentUserQuery = useCurrentUser();
  const organizationsQuery = useOrganizations();
  const workspacesQuery = useWorkspaces(selectedOrganizationId);
  const projectsQuery = useProjects(selectedWorkspaceId);
  const permissionsQuery = useCurrentPermissionsQuery({
    orgId: selectedOrganizationId,
    workspaceId: selectedWorkspaceId,
    projectId: selectedProjectId
  });
  const contextVersionQuery = useContextVersion({
    organizationId: selectedOrganizationId,
    workspaceId: selectedWorkspaceId,
    projectId: selectedProjectId
  });

  const organizations = organizationsQuery.data ?? cachedOrganizations;
  const workspaces = (workspacesQuery.data ?? cachedWorkspaces).filter((workspace) =>
    selectedOrganizationId ? workspace.organization_id === selectedOrganizationId : true
  );
  const projects = (projectsQuery.data ?? cachedProjects).filter((project) =>
    selectedWorkspaceId ? project.workspace_id === selectedWorkspaceId : true
  );
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const permissionCodes = permissionsQuery.data?.permission_codes ?? [];

  const isLoading = currentUserQuery.isLoading || organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading || permissionsQuery.isLoading;
  const isFetching = currentUserQuery.isFetching || organizationsQuery.isFetching || workspacesQuery.isFetching || projectsQuery.isFetching || permissionsQuery.isFetching;
  const isError = currentUserQuery.isError || organizationsQuery.isError || workspacesQuery.isError || projectsQuery.isError || permissionsQuery.isError;
  const error = currentUserQuery.error ?? organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error ?? permissionsQuery.error;

  useEffect(() => {
    if (!loadedAt && (currentUserQuery.data || organizationsQuery.data || workspacesQuery.data || projectsQuery.data || permissionsQuery.data)) {
      setLoadedAt(Date.now());
    }
  }, [currentUserQuery.data, loadedAt, organizationsQuery.data, permissionsQuery.data, projectsQuery.data, workspacesQuery.data]);

  const value = useMemo<PlatformContextValue>(() => ({
    currentUser: currentUserQuery.data ?? null,
    organizations,
    selectedOrganization,
    workspaces,
    selectedWorkspace,
    projects,
    selectedProject,
    permissions: permissionsQuery.data ?? null,
    permissionCodes,
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
    refetchPermissions: () => {
      void permissionsQuery.refetch();
    }
  }), [
    currentUserQuery.data,
    contextVersionQuery.data,
    contextVersionQuery.snapshot,
    error,
    isError,
    isFetching,
    isLoading,
    isSimulating,
    loadedAt,
    organizations,
    permissionCodes,
    permissionsQuery,
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
    workspaces
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
