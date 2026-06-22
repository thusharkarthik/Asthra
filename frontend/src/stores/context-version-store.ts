import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ContextVersionSnapshot } from "@/types/core";

type ContextVersionState = {
  snapshot: ContextVersionSnapshot | null;
  setSnapshot: (snapshot: ContextVersionSnapshot | null) => void;
  clearSnapshot: () => void;
};

export const useContextVersionStore = create<ContextVersionState>()(
  persist(
    (set) => ({
      snapshot: null,
      setSnapshot: (snapshot) => set({ snapshot }),
      clearSnapshot: () => set({ snapshot: null })
    }),
    {
      name: "asthra-context-versions",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
