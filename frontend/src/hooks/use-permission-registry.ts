import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { usePermissionRegistryStore } from "@/stores/permission-registry-store";
import type { EnrichedPermissionDefinition } from "@/stores/permission-registry-store";

export type { EnrichedPermissionDefinition };

export function usePermissionRegistry() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoaded = usePermissionRegistryStore((s) => s.isLoaded);
  const isLoading = usePermissionRegistryStore((s) => s.isLoading);
  const loadRegistry = usePermissionRegistryStore((s) => s.loadRegistry);

  useEffect(() => {
    if (accessToken && !isLoaded && !isLoading) {
      void loadRegistry(accessToken);
    }
  }, [accessToken, isLoaded, isLoading, loadRegistry]);

  return usePermissionRegistryStore();
}

export function usePermissionDefinition(code: string): EnrichedPermissionDefinition | undefined {
  const getPermission = usePermissionRegistryStore((s) => s.getPermission);
  return getPermission(code);
}
