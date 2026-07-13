"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AIContextMetadata, ConfigurationMetadata, ContextVersionSnapshot, CoreUser, CurrentUserPermissions, ModuleRegistryItem, Organization, OrganizationTemplateMetadata, ProjectRecord, SearchMetadata, WorkspaceRecord } from "@/types/core";
import { useContextVersion } from "@/hooks/use-context-version";
import { can as hasPermission } from "@/lib/permissions";
import { detectNavigationMode } from "@/lib/navigation-mode";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePathname } from "next/navigation";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useGodModeTracker } from "@/lib/god-mode-tracker";
import { GOD_MODE_MOCK_ORG, GOD_MODE_MOCK_WORKSPACE, GOD_MODE_MOCK_PROJECT } from "@/lib/god-mode-mock-context";
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

function joinSnapshot<T extends { id?: number }>(items: T[], mapItem: (item: T) => string) {
  return [...items]
    .sort((left, right) => Number(left.id ?? 0) - Number(right.id ?? 0))
    .map(mapItem)
    .join(",");
}

function normalizeId(id: number | null | undefined) {
  return id == null ? "null" : String(id);
}

function normalizeActive(isActive: boolean | null | undefined) {
  return isActive === false ? "0" : "1";
}

export function PlatformContextProvider({ children }: { children: ReactNode }) {
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const cachedCurrentUser = useAuthStore((state) => state.currentUser);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const isGodModeReady = useSimulationStore((state) => state.isGodModeReady);
  const isEditMode = useSimulationStore((state) => state.isEditMode);
  const simulatedPermissions = useSimulationStore((state) => state.simulatedPermissions);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const prevGodModeReady = useRef(false);
  const lastWorkspaceSyncKeyRef = useRef<string | null>(null);
  const lastWorkspaceSyncTokenRef = useRef<string | null>(null);
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

  // Track navigation mode in state so queryKey and queryFn stay in sync.
  // Seed from auth store's is_superuser (persisted — correct on first render without
  // any API call). Roles arrive from the first context response and the effect below
  // updates the mode; for superusers the seed is already "platform" so no extra call.
  const [navigationMode, setNavigationMode] = useState<"platform" | "org" | "work">(() => {
    if (cachedCurrentUser?.is_superuser) return "platform";
    // CoreUser has no cached roles field — safe fallback to "platform".
    // Sidebar uses static nav as fallback when dynamic modules don't match the
    // current mode, so the first-load experience is always non-empty.
    return "platform";
  });

  const contextQuery = useQuery({
    queryKey: [...queryKeys.platformContext.detail(confirmedOrganizationId, confirmedWorkspaceId, confirmedProjectId), navigationMode],
    queryFn: () =>
      coreApi.getPlatformContext(accessToken ?? "", {
        org_id: confirmedOrganizationId,
        workspace_id: confirmedWorkspaceId,
        project_id: confirmedProjectId,
        navigation_mode: navigationMode,
      }),
    enabled: hasAccessToken,
    staleTime: 2 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const workspaceSyncKey = useMemo(() => {
    if (!accessToken || !contextQuery.data) return "";
    const d = contextQuery.data;
    const organizations = (d.organizations ?? []) as Organization[];
    const workspaces = (d.workspaces ?? []) as WorkspaceRecord[];
    const projects = (d.projects ?? []) as ProjectRecord[];
    return [
      normalizeId(d.current_org?.id),
      normalizeId(d.current_workspace?.id),
      normalizeId(d.current_project?.id),
      joinSnapshot(organizations, (organization) =>
        [organization.id, normalizeActive(organization.is_active)].join(":")
      ),
      joinSnapshot(workspaces, (workspace) =>
        [workspace.id, normalizeId(workspace.organization_id)].join(":")
      ),
      joinSnapshot(projects, (project) =>
        [project.id, normalizeId(project.workspace_id)].join(":")
      ),
    ].join("|");
  }, [accessToken, contextQuery.data]);

  const userSyncKey = useMemo(() => {
    if (!accessToken || !contextQuery.data?.user) return "";
    const user = contextQuery.data.user as CoreUser;
    return [user.id, user.email, user.full_name ?? "", user.is_superuser ?? ""].join("|");
  }, [accessToken, contextQuery.data]);

  // Sync unified context data into Zustand workspace store for downstream consumers
  useEffect(() => {
    if (!accessToken || !contextQuery.data || !workspaceSyncKey) return;
    if (lastWorkspaceSyncTokenRef.current !== accessToken) {
      lastWorkspaceSyncTokenRef.current = accessToken;
      lastWorkspaceSyncKeyRef.current = null;
    }
    if (lastWorkspaceSyncKeyRef.current === workspaceSyncKey) return;
    lastWorkspaceSyncKeyRef.current = workspaceSyncKey;
    const d = contextQuery.data;
    setPlatformContext({
      organizations: d.organizations as Organization[],
      workspaces: d.workspaces as WorkspaceRecord[],
      projects: d.projects as ProjectRecord[],
      currentOrganizationId: d.current_org?.id ?? null,
      currentWorkspaceId: d.current_workspace?.id ?? null,
      currentProjectId: d.current_project?.id ?? null,
    });
  }, [accessToken, setPlatformContext, workspaceSyncKey]);

  useEffect(() => {
    if (!accessToken || !contextQuery.data || !userSyncKey) return;
    const d = contextQuery.data;
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
  }, [accessToken, userSyncKey]);

  useEffect(() => {
    if (!accessToken) {
      setLoadedAt(null);
      lastWorkspaceSyncKeyRef.current = null;
      lastWorkspaceSyncTokenRef.current = null;
    }
  }, [accessToken]);

  // Update navigation mode from roles once the first context response arrives.
  // This triggers a queryKey change → context refetches with the correct mode.
  // Superusers: never runs (seed is already "platform"). Work users: no-op (stays "work").
  // Org owners/admins: fires once, changes "work" → "org", causing one extra refetch.
  useEffect(() => {
    if (!contextQuery.data) return;
    const isSuperuser = contextQuery.data.user?.is_superuser ?? false;
    const roles = contextQuery.data.roles ?? [];
    const resolved = detectNavigationMode(isSuperuser, roles);
    setNavigationMode((prev) => (prev === resolved ? prev : resolved));
  }, [contextQuery.data]);

  useEffect(() => {
    const wasReady = prevGodModeReady.current;
    prevGodModeReady.current = isGodModeReady;
    if (wasReady && !isGodModeReady) {
      setSelectedOrganization(null);
      setSelectedWorkspace(null);
      setSelectedProject(null);
      void queryClient.invalidateQueries();
      void contextQuery.refetch();
    }
  }, [isGodModeReady, queryClient, setSelectedOrganization, setSelectedWorkspace, setSelectedProject, contextQuery.refetch]);

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

  // When God Mode is fully active, replace all platform scope data with predictable
  // mock objects so the sandbox shows exactly what the simulated role would see,
  // with no real org/workspace/project names leaking through.
  const effectiveOrganizations = isGodModeReady ? [GOD_MODE_MOCK_ORG] : organizations;
  const effectiveWorkspaces = isGodModeReady ? [GOD_MODE_MOCK_WORKSPACE] : workspaces;
  const effectiveProjects = isGodModeReady ? [GOD_MODE_MOCK_PROJECT] : projects;
  const effectiveSelectedOrg = isGodModeReady ? GOD_MODE_MOCK_ORG : selectedOrganization;
  const effectiveSelectedWorkspace = isGodModeReady ? GOD_MODE_MOCK_WORKSPACE : selectedWorkspace;
  const effectiveSelectedProject = isGodModeReady ? GOD_MODE_MOCK_PROJECT : selectedProject;
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
    organizations: effectiveOrganizations,
    selectedOrganization: effectiveSelectedOrg,
    workspaces: effectiveWorkspaces,
    selectedWorkspace: effectiveSelectedWorkspace,
    projects: effectiveProjects,
    selectedProject: effectiveSelectedProject,
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
      organization: effectiveSelectedOrg,
      workspace: effectiveSelectedWorkspace,
      project: effectiveSelectedProject
    },
    setSelectedOrganization,
    setSelectedWorkspace,
    setSelectedProject,
    can: (permissionCode: string) => {
      const result = isSimulating
        ? simulatedPermissions.includes(permissionCode)
        : hasPermission(permissionCodes, permissionCode);
      // In God Mode edit mode: register this check so GodModeAutoOverlay can surface it.
      // Access via getState() to avoid subscribing the provider to the tracker store.
      if (isGodModeReady && isEditMode) {
        useGodModeTracker.getState().registerPermissionCheck(permissionCode, pathnameRef.current);
      }
      return result;
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
    isGodModeReady,
    isEditMode,
    enabledModules,
    featureFlags,
    confirmedOrganizationId,
    confirmedProjectId,
    confirmedWorkspaceId,
    loadedAt,
    effectiveOrganizations,
    organizationTemplates,
    permissionCodes,
    permissions,
    platformContextScopeSettled,
    effectiveProjects,
    effectiveSelectedOrg,
    selectedOrganizationId,
    effectiveSelectedProject,
    selectedProjectId,
    search,
    effectiveSelectedWorkspace,
    selectedWorkspaceId,
    effectiveWorkspaces,
    setSelectedOrganization,
    setSelectedProject,
    setSelectedWorkspace,
    simulatedPermissions,
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
