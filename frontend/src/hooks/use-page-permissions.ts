"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { usePlatformContext } from "@/context/platformContext";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useGodModeTracker } from "@/lib/god-mode-tracker";
import { findSchemaForRoute } from "@/lib/permission-schema";

export function usePagePermissions() {
  const pathname = usePathname();
  const { can } = usePlatformContext();
  const isGodModeReady = useSimulationStore((s) => s.isGodModeReady);
  const isEditMode = useSimulationStore((s) => s.isEditMode);

  const schema = useMemo(() => findSchemaForRoute(pathname), [pathname]);

  // Proactively register ALL schema permissions in God Mode edit mode so
  // GodModeSchemaPanel can surface elements that were never rendered due to
  // hidden status — not just can()-detected ones.
  useEffect(() => {
    if (!isGodModeReady || !isEditMode || !schema) return;
    const register = useGodModeTracker.getState().registerPermissionCheck;
    for (const el of schema.elements) {
      if (el.permission) {
        register(el.permission, pathname);
      }
    }
  }, [isGodModeReady, isEditMode, schema, pathname]);

  const visible = useMemo(
    () =>
      (key: string): boolean => {
        const el = schema?.elements.find((e) => e.key === key);
        if (!el) return true;
        if (!el.permission) return true;
        return can(el.permission);
      },
    [schema, can],
  );

  return { schema, visible };
}
