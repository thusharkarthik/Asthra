"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useContextVersionStore } from "@/stores/context-version-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSimulationStore } from "@/lib/permission-simulator";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const resetContext = useWorkspaceStore((state) => state.resetContext);
  const clearVersionSnapshot = useContextVersionStore((state) => state.clearSnapshot);
  const exitSimulation = useSimulationStore((state) => state.exitSimulation);

  return useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
    resetContext();
    clearVersionSnapshot();
    exitSimulation();
    logout();
    router.replace("/login");
  }, [clearVersionSnapshot, exitSimulation, logout, queryClient, resetContext, router]);
}
