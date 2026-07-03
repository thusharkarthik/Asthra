import { create } from "zustand";
import type { NavigationMode } from "@/lib/navigation-mode";

const PLATFORM_KEYS = new Set([
  "platform_owner",
  "platform_admin",
  "platform_support",
  "superuser",
]);
const ORG_KEYS = new Set([
  "organization_owner",
  "organization_admin",
  "organization_auditor",
  "organization_member",
]);

export function roleKeyToNavigationMode(roleKey: string): NavigationMode {
  if (PLATFORM_KEYS.has(roleKey)) return "platform";
  if (ORG_KEYS.has(roleKey)) return "org";
  return "work";
}

type SimulationState = {
  // Core simulation state
  isSimulating: boolean;
  simulatedRoleKey: string | null;
  simulatedRoleName: string | null;
  simulatedRoleId: number | null;
  simulatedPermissions: string[];
  simulatedMode: NavigationMode | null;

  // Edit mode
  isEditMode: boolean;
  originalSimulatedPermissions: string[];
  pendingAdditions: string[];
  pendingRemovals: string[];
  hasUnsavedChanges: boolean;
  pendingChangeCount: number;

  // Core actions
  startSimulation: (
    roleKey: string,
    roleName: string,
    roleId: number | null,
    permissions: string[],
    mode: NavigationMode
  ) => void;
  exitSimulation: () => void;

  // Edit mode actions
  enterEditMode: () => void;
  exitEditMode: () => void;
  markForAddition: (permission: string) => void;
  markForRemoval: (permission: string) => void;
  undoChange: (permission: string) => void;
  clearPendingChanges: () => void;
  commitChanges: () => void;
};

export const useSimulationStore = create<SimulationState>((set) => ({
  isSimulating: false,
  simulatedRoleKey: null,
  simulatedRoleName: null,
  simulatedRoleId: null,
  simulatedPermissions: [],
  simulatedMode: null,
  isEditMode: false,
  originalSimulatedPermissions: [],
  pendingAdditions: [],
  pendingRemovals: [],
  hasUnsavedChanges: false,
  pendingChangeCount: 0,

  startSimulation: (roleKey, roleName, roleId, permissions, mode) =>
    set({
      isSimulating: true,
      simulatedRoleKey: roleKey,
      simulatedRoleName: roleName,
      simulatedRoleId: roleId,
      simulatedPermissions: [...permissions],
      originalSimulatedPermissions: [...permissions],
      simulatedMode: mode,
      isEditMode: false,
      pendingAdditions: [],
      pendingRemovals: [],
      hasUnsavedChanges: false,
      pendingChangeCount: 0,
    }),

  exitSimulation: () =>
    set({
      isSimulating: false,
      simulatedRoleKey: null,
      simulatedRoleName: null,
      simulatedRoleId: null,
      simulatedPermissions: [],
      originalSimulatedPermissions: [],
      simulatedMode: null,
      isEditMode: false,
      pendingAdditions: [],
      pendingRemovals: [],
      hasUnsavedChanges: false,
      pendingChangeCount: 0,
    }),

  enterEditMode: () => set({ isEditMode: true }),

  exitEditMode: () => set({ isEditMode: false }),

  markForAddition: (permission) =>
    set((state) => {
      const pendingAdditions = [
        ...state.pendingAdditions.filter((p) => p !== permission),
        permission,
      ];
      const pendingRemovals = state.pendingRemovals.filter((p) => p !== permission);
      const simulatedPermissions = state.simulatedPermissions.includes(permission)
        ? state.simulatedPermissions
        : [...state.simulatedPermissions, permission];
      return {
        pendingAdditions,
        pendingRemovals,
        simulatedPermissions,
        hasUnsavedChanges: pendingAdditions.length > 0 || pendingRemovals.length > 0,
        pendingChangeCount: pendingAdditions.length + pendingRemovals.length,
      };
    }),

  markForRemoval: (permission) =>
    set((state) => {
      const pendingRemovals = [
        ...state.pendingRemovals.filter((p) => p !== permission),
        permission,
      ];
      const pendingAdditions = state.pendingAdditions.filter((p) => p !== permission);
      const simulatedPermissions = state.simulatedPermissions.filter((p) => p !== permission);
      return {
        pendingAdditions,
        pendingRemovals,
        simulatedPermissions,
        hasUnsavedChanges: pendingAdditions.length > 0 || pendingRemovals.length > 0,
        pendingChangeCount: pendingAdditions.length + pendingRemovals.length,
      };
    }),

  undoChange: (permission) =>
    set((state) => {
      const pendingAdditions = state.pendingAdditions.filter((p) => p !== permission);
      const pendingRemovals = state.pendingRemovals.filter((p) => p !== permission);
      // Restore this permission to its original state
      let simulatedPermissions = [...state.simulatedPermissions];
      if (state.originalSimulatedPermissions.includes(permission)) {
        if (!simulatedPermissions.includes(permission)) {
          simulatedPermissions = [...simulatedPermissions, permission];
        }
      } else {
        simulatedPermissions = simulatedPermissions.filter((p) => p !== permission);
      }
      return {
        pendingAdditions,
        pendingRemovals,
        simulatedPermissions,
        hasUnsavedChanges: pendingAdditions.length > 0 || pendingRemovals.length > 0,
        pendingChangeCount: pendingAdditions.length + pendingRemovals.length,
      };
    }),

  // Discard — revert simulatedPermissions to original state
  clearPendingChanges: () =>
    set((state) => ({
      pendingAdditions: [],
      pendingRemovals: [],
      simulatedPermissions: [...state.originalSimulatedPermissions],
      hasUnsavedChanges: false,
      pendingChangeCount: 0,
    })),

  // Commit — keep simulatedPermissions as new baseline after successful save
  commitChanges: () =>
    set((state) => ({
      pendingAdditions: [],
      pendingRemovals: [],
      originalSimulatedPermissions: [...state.simulatedPermissions],
      hasUnsavedChanges: false,
      pendingChangeCount: 0,
    })),
}));
