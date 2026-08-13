import { create } from "zustand";
import type { PermissionRegistryItem } from "@/types/core";
import { settingsApi } from "@/services/api/settings-api";

export type { PermissionRegistryItem };

export type EnrichedPermissionDefinition = PermissionRegistryItem & {
  label: string;
  category: string;
  affects: string;
  requires?: string[];
  routes?: string[];
  hasUIGate: boolean;
};

interface PermissionRegistryStore {
  permissions: EnrichedPermissionDefinition[];
  byModule: Record<string, EnrichedPermissionDefinition[]>;
  isLoading: boolean;
  isLoaded: boolean;
  hasAttempted: boolean;
  error: string | null;
  lastSyncedAt: Date | null;

  loadRegistry: (token: string) => Promise<void>;
  reset: () => void;
  getPermission: (code: string) => EnrichedPermissionDefinition | undefined;
  getByModule: (module: string) => EnrichedPermissionDefinition[];
  getByRoute: (pathname: string) => EnrichedPermissionDefinition[];
  getCoverageStats: () => { total: number; withUIGate: number; coverage: number };
}

export const usePermissionRegistryStore = create<PermissionRegistryStore>((set, get) => ({
  permissions: [],
  byModule: {},
  isLoading: false,
  isLoaded: false,
  hasAttempted: false,
  error: null,
  lastSyncedAt: null,

  loadRegistry: async (token: string) => {
    const state = get();
    if (state.isLoaded || state.isLoading || state.hasAttempted) return;
    set({ isLoading: true, error: null, hasAttempted: true });
    try {
      const backendPerms = await settingsApi.listPermissionRegistry(token);

      // Dynamic import keeps the static registry out of the initial bundle
      const { PERMISSION_REGISTRY } = await import("@/lib/permission-registry");
      const staticMap = new Map(PERMISSION_REGISTRY.map((s) => [s.code, s]));

      const enriched: EnrichedPermissionDefinition[] = backendPerms.map((bp) => {
        const s = staticMap.get(bp.code);
        return {
          ...bp,
          label: s?.label ?? bp.name,
          category: s?.category ?? bp.module,
          affects: s?.affects ?? `${bp.resource} ${bp.action}`,
          requires: s?.requires,
          routes: s?.routes,
          hasUIGate: Boolean(s),
        };
      });

      const byModule: Record<string, EnrichedPermissionDefinition[]> = {};
      for (const p of enriched) {
        if (!byModule[p.module]) byModule[p.module] = [];
        byModule[p.module].push(p);
      }

      set({ permissions: enriched, byModule, isLoading: false, isLoaded: true, lastSyncedAt: new Date() });
    } catch (err) {
      set({ isLoading: false, error: String(err) });
    }
  },

  reset: () =>
    set({
      permissions: [],
      byModule: {},
      isLoading: false,
      isLoaded: false,
      hasAttempted: false,
      error: null,
      lastSyncedAt: null,
    }),

  getPermission: (code) => get().permissions.find((p) => p.code === code),

  getByModule: (module) => get().byModule[module] ?? [],

  getByRoute: (pathname) =>
    get().permissions.filter((p) =>
      p.routes?.some((route) => {
        if (route === pathname) return true;
        const pattern = route.replace(/\[[\w]+\]/g, "[^/]+");
        return new RegExp(`^${pattern}(/.*)?$`).test(pathname);
      })
    ),

  getCoverageStats: () => {
    const perms = get().permissions;
    if (perms.length === 0) return { total: 0, withUIGate: 0, coverage: 0 };
    const withUIGate = perms.filter((p) => p.hasUIGate).length;
    return { total: perms.length, withUIGate, coverage: Math.round((withUIGate / perms.length) * 100) };
  },
}));
