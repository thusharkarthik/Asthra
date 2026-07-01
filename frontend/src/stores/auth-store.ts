import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi, type LoginPayload, type RegisterPayload } from "@/services/api/auth-api";
import { useContextVersionStore } from "@/stores/context-version-store";
import type { CoreUser } from "@/types/core";

type AuthState = {
  accessToken: string | null;
  currentUser: CoreUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  loadCurrentUser: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const token = await authApi.login(payload);
          useContextVersionStore.getState().clearSnapshot();
          set({
            accessToken: token.access_token,
            currentUser: null,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unable to sign in."
          });
          throw error;
        }
      },
      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(payload);
          const token = await authApi.login({ email: payload.email, password: payload.password });
          useContextVersionStore.getState().clearSnapshot();
          set({
            accessToken: token.access_token,
            currentUser: null,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unable to register."
          });
          throw error;
        }
      },
      logout: () => {
        useContextVersionStore.getState().clearSnapshot();
        set({
          accessToken: null,
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },
      loadCurrentUser: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ currentUser: null, isAuthenticated: false });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.me(token);
          set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            accessToken: null,
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Session expired. Please sign in again."
          });
          useContextVersionStore.getState().clearSnapshot();
          throw error;
        }
      }
    }),
    {
      name: "asthra-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
