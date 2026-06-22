"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  const resetContext = useWorkspaceStore((state) => state.resetContext);

  useEffect(() => {
    if (!hasHydrated || accessToken) return;
    resetContext();
    queryClient.removeQueries({ queryKey: queryKeys.context.all });
    queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser });
    queryClient.removeQueries({ queryKey: queryKeys.settings.all });
  }, [accessToken, hasHydrated, queryClient, resetContext]);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      return;
    }

    loadCurrentUser().catch(() => {
      // The store clears expired sessions and exposes the user-facing error.
    });
  }, [accessToken, hasHydrated, loadCurrentUser]);

  return <>{children}</>;
}
