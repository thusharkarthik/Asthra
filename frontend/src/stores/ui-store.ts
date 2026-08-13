import { create } from "zustand";

type UIState = {
  isAssistantOpen: boolean;
  isSearchOpen: boolean;
  isCommandPaletteOpen: boolean;
  authTransition: "login" | "logout" | null;
  setAssistantOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAuthTransition: (transition: "login" | "logout" | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAssistantOpen: false,
  isSearchOpen: false,
  isCommandPaletteOpen: false,
  authTransition: null,
  setAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setAuthTransition: (authTransition) => set({ authTransition })
}));
