"use client";

import { usePathname } from "next/navigation";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useGodModeTracker } from "@/lib/god-mode-tracker";
import { usePermissionRegistryStore } from "@/stores/permission-registry-store";
import { getPermissionDefinition } from "@/lib/permission-registry";
import { cn } from "@/lib/utils";

/**
 * Reads the god-mode-tracker and renders a panel listing every permission
 * checked on the current page (via can()). Visible only in God Mode edit mode.
 *
 * No changes needed to page components — every can() call is auto-tracked.
 */
export function GodModeAutoOverlay() {
  const pathname = usePathname();
  const isGodModeReady = useSimulationStore((s) => s.isGodModeReady);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const simulatedPermissions = useSimulationStore((s) => s.simulatedPermissions);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const markForAddition = useSimulationStore((s) => s.markForAddition);
  const markForRemoval = useSimulationStore((s) => s.markForRemoval);
  const undoChange = useSimulationStore((s) => s.undoChange);

  const tracked = useGodModeTracker((s) => s.tracked);
  const getRegistryPermission = usePermissionRegistryStore((s) => s.getPermission);

  if (!isGodModeReady || !isEditMode) return null;

  const currentPerms = Object.values(tracked).filter((p) => p.route === pathname);

  return (
    <div className="fixed right-4 top-20 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-lg border border-purple-700 bg-purple-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-purple-700/60 px-3 py-2">
        <span className="text-xs font-bold tracking-wide text-purple-300">PAGE PERMISSIONS</span>
        <span className="text-xs text-purple-500">
          {currentPerms.length > 0 ? `${currentPerms.length} found` : "none detected"}
        </span>
      </div>

      {currentPerms.length === 0 ? (
        <div className="px-3 py-3">
          <p className="text-xs text-purple-500 leading-relaxed">
            Navigate around this page to trigger permission checks. Any can() call will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {currentPerms.map((perm) => {
            const dynamicDef = getRegistryPermission(perm.code);
            const staticDef = getPermissionDefinition(perm.code);
            const label = dynamicDef?.label ?? staticDef?.label ?? perm.code;

            const isGranted = simulatedPermissions.includes(perm.code);
            const isPendingAdd = pendingAdditions.includes(perm.code);
            const isPendingRemove = pendingRemovals.includes(perm.code);
            const isPending = isPendingAdd || isPendingRemove;

            return (
              <div
                key={perm.code}
                className={cn(
                  "flex items-center justify-between rounded px-2 py-1.5 text-xs",
                  isGranted
                    ? "border border-green-800/30 bg-green-950/50"
                    : "border border-red-800/30 bg-red-950/50",
                  isPendingAdd && "!border-blue-600",
                  isPendingRemove && "!border-orange-600",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn("truncate font-medium", isGranted ? "text-green-300" : "text-red-300")}>
                    {label}
                  </div>
                  <div className="truncate text-[10px] text-purple-500">{perm.code}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isPending) {
                      undoChange(perm.code);
                    } else if (isGranted) {
                      markForRemoval(perm.code);
                    } else {
                      markForAddition(perm.code);
                    }
                  }}
                  className={cn(
                    "ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-colors",
                    isPending
                      ? "bg-yellow-600 hover:bg-yellow-500"
                      : isGranted
                      ? "bg-red-700 hover:bg-red-600"
                      : "bg-green-700 hover:bg-green-600",
                  )}
                  title={
                    isPending
                      ? `Undo change to ${label}`
                      : isGranted
                      ? `Remove ${label} from role`
                      : `Add ${label} to role`
                  }
                >
                  {isPending ? "↩" : isGranted ? "−" : "+"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
