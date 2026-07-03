"use client";

import { type ReactNode, Fragment } from "react";
import { Minus, Plus } from "lucide-react";
import { usePlatformContext } from "@/context/platformContext";
import { useSimulationStore } from "@/lib/permission-simulator";
import { getPermissionDefinition } from "@/lib/permission-registry";
import { usePermissionRegistryStore } from "@/stores/permission-registry-store";
import { cn } from "@/lib/utils";

interface PermissionGateProps {
  /** Permission code that controls this element. */
  permission: string;
  /** Human-readable label. Auto-resolved from PERMISSION_REGISTRY if omitted. */
  label?: string;
  /** Content to show when permission is granted. */
  children: ReactNode;
  /** Optional content when hidden in normal mode (default: null). */
  fallback?: ReactNode;
  /** Extra className applied to the wrapper div in edit mode only. */
  className?: string;
}

/**
 * Wraps a permission-gated UI element.
 *
 * Normal / View mode  → behaves exactly like `can(permission) ? children : fallback`
 * Edit mode (simulate + edit) → shows overlay with +/- controls for live editing
 */
export function PermissionGate({
  permission,
  label,
  children,
  fallback,
  className,
}: PermissionGateProps) {
  const { can } = usePlatformContext();
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const markForAddition = useSimulationStore((s) => s.markForAddition);
  const markForRemoval = useSimulationStore((s) => s.markForRemoval);
  const undoChange = useSimulationStore((s) => s.undoChange);

  const getRegistryPermission = usePermissionRegistryStore((s) => s.getPermission);
  const dynamicDef = getRegistryPermission(permission);
  const staticDef = getPermissionDefinition(permission);

  const displayLabel = label ?? dynamicDef?.label ?? staticDef?.label ?? permission;
  const displayAffects = dynamicDef?.affects ?? staticDef?.affects;
  const riskLevel = dynamicDef?.risk_level;
  const tooltip = [
    displayLabel,
    permission,
    displayAffects ? `Affects: ${displayAffects}` : null,
    riskLevel ? `Risk: ${riskLevel}` : null,
  ].filter(Boolean).join("\n");

  // Normal / View mode — simple pass-through
  if (!isSimulating || !isEditMode) {
    return can(permission) ? <Fragment>{children}</Fragment> : <Fragment>{fallback ?? null}</Fragment>;
  }

  // Edit mode — can() already accounts for pending changes (simulatedPermissions is updated immediately)
  const hasPermission = can(permission);
  const isPendingAddition = pendingAdditions.includes(permission);
  const isPendingRemoval = pendingRemovals.includes(permission);
  const isPending = isPendingAddition || isPendingRemoval;

  if (hasPermission) {
    return (
      <div
        className={cn(
          "relative rounded-sm",
          isPendingAddition
            ? "ring-1 ring-blue-500/50 bg-blue-500/5"
            : "ring-1 ring-emerald-500/40",
          className
        )}
        title={tooltip}
      >
        {children}
        <button
          type="button"
          onClick={() => (isPending ? undoChange(permission) : markForRemoval(permission))}
          className={cn(
            "absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm transition-colors",
            isPendingAddition
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-rose-500 hover:bg-rose-600"
          )}
          title={isPendingAddition ? `Undo adding ${displayLabel}` : `Remove ${displayLabel} from role`}
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  }

  // Hidden — ghost placeholder with plus button
  return (
    <div
      className={cn(
        "relative flex min-h-[28px] items-center gap-1.5 rounded-sm border border-dashed px-2 py-1 text-xs",
        isPendingRemoval
          ? "border-orange-400/50 bg-orange-400/10 text-orange-600 dark:text-orange-400"
          : "border-muted-foreground/25 bg-muted/20 text-muted-foreground",
        className
      )}
      title={tooltip}
    >
      <span className="truncate">{displayLabel}</span>
      <span className="shrink-0 font-mono text-[10px] opacity-50">{permission}</span>
      <button
        type="button"
        onClick={() => (isPending ? undoChange(permission) : markForAddition(permission))}
        className={cn(
          "ml-auto shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm transition-colors",
          isPendingRemoval
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        )}
        title={isPendingRemoval ? `Undo removing ${displayLabel}` : `Add ${displayLabel} to role`}
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
