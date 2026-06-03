import { create } from "zustand";

type UIState = {
  isAssistantOpen: boolean;
  isSearchOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAssistantOpen: true,
  isSearchOpen: false,
  setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen })
}));
