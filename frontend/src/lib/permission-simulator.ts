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
  isSimulating: boolean;
  simulatedRoleKey: string | null;
  simulatedRoleName: string | null;
  simulatedPermissions: string[];
  simulatedMode: NavigationMode | null;
  startSimulation: (
    roleKey: string,
    roleName: string,
    permissions: string[],
    mode: NavigationMode
  ) => void;
  exitSimulation: () => void;
};

export const useSimulationStore = create<SimulationState>((set) => ({
  isSimulating: false,
  simulatedRoleKey: null,
  simulatedRoleName: null,
  simulatedPermissions: [],
  simulatedMode: null,
  startSimulation: (roleKey, roleName, permissions, mode) =>
    set({
      isSimulating: true,
      simulatedRoleKey: roleKey,
      simulatedRoleName: roleName,
      simulatedPermissions: permissions,
      simulatedMode: mode,
    }),
  exitSimulation: () =>
    set({
      isSimulating: false,
      simulatedRoleKey: null,
      simulatedRoleName: null,
      simulatedPermissions: [],
      simulatedMode: null,
    }),
}));
