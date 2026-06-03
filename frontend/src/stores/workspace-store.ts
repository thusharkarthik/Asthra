import { create } from "zustand";
import type { Project, Workspace } from "@/types/workspace";

type WorkspaceState = {
  workspaces: Workspace[];
  projects: Project[];
  activeWorkspaceId: string;
  activeProjectId: string;
  setActiveWorkspace: (workspaceId: string) => void;
  setActiveProject: (projectId: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [
    { id: "w_1", name: "Asthra Platform" },
    { id: "w_2", name: "Customer Ops" }
  ],
  projects: [
    { id: "p_1", workspaceId: "w_1", name: "Platform MVP" },
    { id: "p_2", workspaceId: "w_1", name: "Phase 2 Integration" }
  ],
  activeWorkspaceId: "w_1",
  activeProjectId: "p_1",
  setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId })
}));
