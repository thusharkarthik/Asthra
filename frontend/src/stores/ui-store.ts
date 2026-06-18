import { create } from "zustand";

type UIState = {
  isAssistantOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAssistantOpen: false,
  isSearchOpen: false,
  isCommandPaletteOpen: false,
  setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen })
}));
