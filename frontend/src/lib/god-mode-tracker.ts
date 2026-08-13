import { create } from "zustand";

export interface TrackedPermission {
  code: string;
  route: string;
}

interface GodModeTrackerStore {
  tracked: Record<string, TrackedPermission>;
  registerPermissionCheck: (code: string, route: string) => void;
  clearForRoute: (route: string) => void;
  clearAll: () => void;
}

export const useGodModeTracker = create<GodModeTrackerStore>((set) => ({
  tracked: {},

  registerPermissionCheck: (code, route) => {
    set((state) => {
      // Skip update if already registered for this route (avoids re-render churn)
      if (state.tracked[code]?.route === route) return state;
      return { tracked: { ...state.tracked, [code]: { code, route } } };
    });
  },

  clearForRoute: (route) => {
    set((state) => {
      const next: Record<string, TrackedPermission> = {};
      let changed = false;
      for (const [k, v] of Object.entries(state.tracked)) {
        if (v.route !== route) {
          next[k] = v;
        } else {
          changed = true;
        }
      }
      return changed ? { tracked: next } : state;
    });
  },

  clearAll: () => set({ tracked: {} }),
}));
