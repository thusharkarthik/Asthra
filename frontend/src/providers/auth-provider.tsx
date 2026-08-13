"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const resetContext = useWorkspaceStore((state) => state.resetContext);

  useEffect(() => {
    if (!hasHydrated || accessToken) return;
    resetContext();
    queryClient.clear();
  }, [accessToken, hasHydrated, queryClient, resetContext]);

  return <>{children}</>;
}
