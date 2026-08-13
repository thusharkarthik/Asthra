import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Organization, ProjectRecord, WorkspaceRecord } from "@/types/core";

type WorkspaceState = {
  organizations: Organization[];
  workspaces: WorkspaceRecord[];
  projects: ProjectRecord[];
  selectedOrganizationId: number | null;
  selectedWorkspaceId: number | null;
  selectedProjectId: number | null;
  setOrganizations: (organizations: Organization[]) => void;
  setWorkspaces: (workspaces: WorkspaceRecord[]) => void;
  setProjects: (projects: ProjectRecord[]) => void;
  setPlatformContext: (context: {
    organizations: Organization[];
    workspaces: WorkspaceRecord[];
    projects: ProjectRecord[];
    currentOrganizationId?: number | null;
    currentWorkspaceId?: number | null;
    currentProjectId?: number | null;
  }) => void;
  setSelectedOrganization: (organizationId: number | null) => void;
  setSelectedWorkspace: (workspaceId: number | null) => void;
  setSelectedProject: (projectId: number | null) => void;
  resetContext: () => void;
};

function normalizeId(id: number | null | undefined) {
  return id == null ? "null" : String(id);
}

function normalizeActive(isActive: boolean | null | undefined) {
  return isActive === false ? "0" : "1";
}

function snapshotKey<T extends { id: number }>(items: T[], mapItem: (item: T) => string) {
  return [...items]
    .sort((left, right) => left.id - right.id)
    .map(mapItem)
    .join(",");
}

function sameOrganizationSnapshot(left: Organization[], right: Organization[]) {
  return (
    snapshotKey(left, (organization) => [organization.id, normalizeActive(organization.is_active)].join(":")) ===
    snapshotKey(right, (organization) => [organization.id, normalizeActive(organization.is_active)].join(":"))
  );
}

function sameWorkspaceSnapshot(left: WorkspaceRecord[], right: WorkspaceRecord[]) {
  return (
    snapshotKey(left, (workspace) => [workspace.id, normalizeId(workspace.organization_id)].join(":")) ===
    snapshotKey(right, (workspace) => [workspace.id, normalizeId(workspace.organization_id)].join(":"))
  );
}

function sameProjectSnapshot(left: ProjectRecord[], right: ProjectRecord[]) {
  return (
    snapshotKey(left, (project) => [project.id, normalizeId(project.workspace_id)].join(":")) ===
    snapshotKey(right, (project) => [project.id, normalizeId(project.workspace_id)].join(":"))
  );
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      organizations: [],
      workspaces: [],
      projects: [],
      selectedOrganizationId: null,
      selectedWorkspaceId: null,
      selectedProjectId: null,
      setOrganizations: (organizations) => {
        const current = get().selectedOrganizationId;
        const selectedOrganizationId = organizations.some((organization) => organization.id === current)
          ? current
          : organizations[0]?.id ?? null;
        const selectedWorkspace = get().workspaces.find((workspace) => workspace.id === get().selectedWorkspaceId);
        const nextWorkspaceId = selectedWorkspace?.organization_id === selectedOrganizationId ? selectedWorkspace.id : null;
        const selectedProject = get().projects.find((project) => project.id === get().selectedProjectId);
        set({
          organizations,
          selectedOrganizationId,
          selectedWorkspaceId: nextWorkspaceId,
          selectedProjectId: selectedProject?.workspace_id === nextWorkspaceId ? selectedProject.id : null
        });
      },
      setWorkspaces: (workspaces) => {
        const selectedOrganizationId = get().selectedOrganizationId;
        const scopedWorkspaces = selectedOrganizationId ? workspaces.filter((workspace) => workspace.organization_id === selectedOrganizationId) : workspaces;
        const current = get().selectedWorkspaceId;
        const selectedWorkspaceId = scopedWorkspaces.some((workspace) => workspace.id === current)
          ? current
          : scopedWorkspaces[0]?.id ?? null;
        const selectedProject = get().projects.find((project) => project.id === get().selectedProjectId);
        set({
          workspaces,
          selectedWorkspaceId,
          selectedProjectId: selectedProject?.workspace_id === selectedWorkspaceId ? selectedProject.id : null
        });
      },
      setProjects: (projects) => {
        const selectedWorkspaceId = get().selectedWorkspaceId;
        const scopedProjects = selectedWorkspaceId ? projects.filter((project) => project.workspace_id === selectedWorkspaceId) : projects;
        const current = get().selectedProjectId;
        const selectedProjectId = scopedProjects.some((project) => project.id === current) ? current : scopedProjects[0]?.id ?? null;
        set({ projects, selectedProjectId });
      },
      setPlatformContext: ({ organizations, workspaces, projects, currentOrganizationId, currentWorkspaceId, currentProjectId }) => {
        const state = get();
        const currentOrganizationExists = currentOrganizationId != null && organizations.some((organization) => organization.id === currentOrganizationId);
        const selectedOrganizationId = currentOrganizationExists ? currentOrganizationId : (
          organizations.some((organization) => organization.id === state.selectedOrganizationId)
            ? state.selectedOrganizationId
            : organizations[0]?.id ?? null
        );
        const scopedWorkspaces = selectedOrganizationId
          ? workspaces.filter((workspace) => workspace.organization_id === selectedOrganizationId)
          : workspaces;
        const currentWorkspaceExists = currentWorkspaceId != null && scopedWorkspaces.some((workspace) => workspace.id === currentWorkspaceId);
        const selectedWorkspaceId = currentWorkspaceExists ? currentWorkspaceId : (
          scopedWorkspaces.some((workspace) => workspace.id === state.selectedWorkspaceId)
            ? state.selectedWorkspaceId
            : scopedWorkspaces[0]?.id ?? null
        );
        const scopedProjects = selectedWorkspaceId
          ? projects.filter((project) => project.workspace_id === selectedWorkspaceId)
          : projects;
        const currentProjectExists = currentProjectId != null && scopedProjects.some((project) => project.id === currentProjectId);
        const selectedProjectId = currentProjectExists ? currentProjectId : (
          scopedProjects.some((project) => project.id === state.selectedProjectId)
            ? state.selectedProjectId
            : scopedProjects[0]?.id ?? null
        );
        if (
          state.selectedOrganizationId === selectedOrganizationId &&
          state.selectedWorkspaceId === selectedWorkspaceId &&
          state.selectedProjectId === selectedProjectId &&
          sameOrganizationSnapshot(state.organizations, organizations) &&
          sameWorkspaceSnapshot(state.workspaces, workspaces) &&
          sameProjectSnapshot(state.projects, projects)
        ) {
          return;
        }
        set({
          organizations,
          workspaces,
          projects,
          selectedOrganizationId,
          selectedWorkspaceId,
          selectedProjectId
        });
      },
      setSelectedOrganization: (organizationId) =>
        set({ selectedOrganizationId: organizationId, selectedWorkspaceId: null, selectedProjectId: null }),
      setSelectedWorkspace: (workspaceId) => set({ selectedWorkspaceId: workspaceId, selectedProjectId: null }),
      setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
      resetContext: () =>
        set({
          organizations: [],
          workspaces: [],
          projects: [],
          selectedOrganizationId: null,
          selectedWorkspaceId: null,
          selectedProjectId: null
        })
    }),
    {
      name: "asthra-workspace-context",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedOrganizationId: state.selectedOrganizationId,
        selectedWorkspaceId: state.selectedWorkspaceId,
        selectedProjectId: state.selectedProjectId
      })
    }
  )
);
