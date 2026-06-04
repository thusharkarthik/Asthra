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
  setSelectedOrganization: (organizationId: number | null) => void;
  setSelectedWorkspace: (workspaceId: number | null) => void;
  setSelectedProject: (projectId: number | null) => void;
  resetContext: () => void;
};

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
        set({ organizations, selectedOrganizationId });
      },
      setWorkspaces: (workspaces) => {
        const current = get().selectedWorkspaceId;
        const selectedWorkspaceId = workspaces.some((workspace) => workspace.id === current)
          ? current
          : workspaces[0]?.id ?? null;
        set({ workspaces, selectedWorkspaceId });
      },
      setProjects: (projects) => {
        const current = get().selectedProjectId;
        const selectedProjectId = projects.some((project) => project.id === current) ? current : projects[0]?.id ?? null;
        set({ projects, selectedProjectId });
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
