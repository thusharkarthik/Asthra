"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AIContextMetadata, ConfigurationMetadata, ContextVersionSnapshot, CoreUser, CurrentUserPermissions, ModuleRegistryItem, Organization, OrganizationTemplateMetadata, ProjectRecord, SearchMetadata, WorkspaceRecord } from "@/types/core";
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
  availableModules: ModuleRegistryItem[];
  aiContext: AIContextMetadata;
  configuration: ConfigurationMetadata;
  search: SearchMetadata;
  organizationTemplates: OrganizationTemplateMetadata;
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
  hasModule: (moduleKey: string) => boolean;
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
  const setPlatformContext = useWorkspaceStore((state) => state.setPlatformContext);
  const setSelectedOrganization = useWorkspaceStore((state) => state.setSelectedOrganization);
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const setSelectedProject = useWorkspaceStore((state) => state.setSelectedProject);
  const hasAccessToken = Boolean(accessToken);
  const confirmedOrganizationId =
    selectedOrganizationId && cachedOrganizations.some((organization) => organization.id === selectedOrganizationId)
      ? selectedOrganizationId
      : null;
  const confirmedWorkspaceId =
    confirmedOrganizationId &&
    selectedWorkspaceId &&
    cachedWorkspaces.some((workspace) => workspace.id === selectedWorkspaceId && workspace.organization_id === confirmedOrganizationId)
      ? selectedWorkspaceId
      : null;
  const confirmedProjectId =
    confirmedWorkspaceId &&
    selectedProjectId &&
    cachedProjects.some((project) => project.id === selectedProjectId && project.workspace_id === confirmedWorkspaceId)
      ? selectedProjectId
      : null;

  const contextQuery = useQuery({
    queryKey: queryKeys.platformContext.detail(confirmedOrganizationId, confirmedWorkspaceId, confirmedProjectId),
    queryFn: () =>
      coreApi.getPlatformContext(accessToken ?? "", {
        org_id: confirmedOrganizationId,
        workspace_id: confirmedWorkspaceId,
        project_id: confirmedProjectId,
      }),
    enabled: hasAccessToken,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Sync unified context data into Zustand workspace store for downstream consumers
  useEffect(() => {
    if (!accessToken || !contextQuery.data) return;
    const d = contextQuery.data;
    setPlatformContext({
      organizations: d.organizations as Organization[],
      workspaces: d.workspaces as WorkspaceRecord[],
      projects: d.projects as ProjectRecord[],
      currentOrganizationId: d.current_org?.id ?? null,
      currentWorkspaceId: d.current_workspace?.id ?? null,
      currentProjectId: d.current_project?.id ?? null,
    });
    useAuthStore.setState((state) => {
      const nextUser = d.user as CoreUser;
      if (
        state.currentUser?.id === nextUser.id &&
        state.currentUser?.email === nextUser.email &&
        state.currentUser?.full_name === nextUser.full_name &&
        state.currentUser?.is_superuser === nextUser.is_superuser
      ) {
        return state;
      }
      return { ...state, currentUser: nextUser, isAuthenticated: true };
    });
  }, [accessToken, contextQuery.data, setPlatformContext]);

  useEffect(() => {
    if (!accessToken) setLoadedAt(null);
  }, [accessToken]);

  const organizations: Organization[] = hasAccessToken ? (contextQuery.data?.organizations as Organization[] | undefined) ?? cachedOrganizations : [];
  const workspaces: WorkspaceRecord[] = (hasAccessToken ? (contextQuery.data?.workspaces as WorkspaceRecord[] | undefined) ?? cachedWorkspaces : []).filter(
    (w) => (selectedOrganizationId ? w.organization_id === selectedOrganizationId : true)
  );
  const projects: ProjectRecord[] = (hasAccessToken ? (contextQuery.data?.projects as ProjectRecord[] | undefined) ?? cachedProjects : []).filter(
    (p) => (selectedWorkspaceId ? p.workspace_id === selectedWorkspaceId : true)
  );
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const workspaceScopeLoaded = !confirmedWorkspaceId || contextQuery.data?.current_workspace?.id === confirmedWorkspaceId;
  const projectScopeSettled = !confirmedWorkspaceId || Boolean(confirmedProjectId) || (workspaceScopeLoaded && projects.length === 0);
  const hasOrganizationContext = organizations.length > 0;
  const platformContextScopeSettled = !contextQuery.data || (
    (contextQuery.data.current_org?.id ?? null) === confirmedOrganizationId &&
    (contextQuery.data.current_workspace?.id ?? null) === confirmedWorkspaceId &&
    (contextQuery.data.current_project?.id ?? null) === confirmedProjectId
  );

  const contextVersionQuery = useContextVersion({
    organizationId: confirmedOrganizationId,
    workspaceId: confirmedWorkspaceId,
    projectId: confirmedProjectId
  }, {
    enabled: Boolean(hasAccessToken && loadedAt && hasOrganizationContext && workspaceScopeLoaded && projectScopeSettled && platformContextScopeSettled)
  });

  const currentUser: CoreUser | null = hasAccessToken ? (contextQuery.data?.user as CoreUser | undefined) ?? null : null;
  const permissionCodes: string[] = hasAccessToken ? contextQuery.data?.permissions ?? [] : [];
  const featureFlags: Record<string, boolean> = hasAccessToken ? contextQuery.data?.feature_flags ?? {} : {};
  const enabledModules: string[] = hasAccessToken ? contextQuery.data?.enabled_modules ?? [] : [];
  const availableModules: ModuleRegistryItem[] = hasAccessToken ? contextQuery.data?.modules ?? [] : [];
  const aiContext: AIContextMetadata = hasAccessToken && contextQuery.data?.ai_context ? contextQuery.data.ai_context : {
    available: false,
    endpoint: "/api/v1/ai/context",
    block_count: 0,
    categories: [],
    source_modules: [],
  };
  const configuration: ConfigurationMetadata = hasAccessToken && contextQuery.data?.configuration ? contextQuery.data.configuration : {
    available: false,
    endpoint: "/api/v1/configuration/effective",
    definition_count: 0,
    categories: [],
    source_modules: [],
    scope_inheritance: [],
  };
  const search: SearchMetadata = hasAccessToken && contextQuery.data?.search ? contextQuery.data.search : {
    available: false,
    endpoint: "/api/v1/search",
    registry_endpoint: "/api/v1/search/registry",
    categories: [],
    entity_types: [],
    shortcut: "CMD+K",
  };
  const organizationTemplates: OrganizationTemplateMetadata = hasAccessToken && contextQuery.data?.organization_templates ? contextQuery.data.organization_templates : {
    available: false,
    endpoint: "/api/v1/organization-templates",
    template_count: 0,
    categories: [],
  };
  const permissions: CurrentUserPermissions | null = hasAccessToken && contextQuery.data
    ? {
        permission_codes: contextQuery.data.permissions,
        roles: contextQuery.data.roles,
        scope: {
          scope_type: confirmedWorkspaceId ? "workspace" : confirmedOrganizationId ? "organization" : "platform",
          scope_id: confirmedWorkspaceId ?? confirmedOrganizationId ?? null,
        },
        feature_flags: featureFlags,
        enabled_modules: enabledModules,
      }
    : null;

  const isLoading = contextQuery.isLoading;
  const isFetching = contextQuery.isFetching;
  const isError = contextQuery.isError;
  const error = contextQuery.error;

  useEffect(() => {
    if (hasAccessToken && !loadedAt && contextQuery.data) setLoadedAt(Date.now());
  }, [contextQuery.data, hasAccessToken, loadedAt]);

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
    availableModules,
    aiContext,
    configuration,
    search,
    organizationTemplates,
    contextVersions: contextVersionQuery.data ?? contextVersionQuery.snapshot ?? null,
    loadedAt,
    isLoading,
    isFetching,
    isError,
    error,
    currentScope: {
      organizationId: confirmedOrganizationId,
      workspaceId: confirmedWorkspaceId,
      projectId: confirmedProjectId,
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
    hasModule: (moduleKey: string) => availableModules.some((module) => module.module_key === moduleKey && module.visible),
    refetchPermissions: () => {
      void contextQuery.refetch();
    }
  }), [
    availableModules,
    aiContext,
    configuration,
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
    confirmedOrganizationId,
    confirmedProjectId,
    confirmedWorkspaceId,
    loadedAt,
    organizations,
    organizationTemplates,
    permissionCodes,
    permissions,
    platformContextScopeSettled,
    projects,
    selectedOrganization,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
    search,
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
