import { create } from "zustand";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: "u_1", name: "Thushar", email: "thushar@example.com" },
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token })
}));
