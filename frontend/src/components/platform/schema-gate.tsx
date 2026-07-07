"use client";

import { type ReactNode, Fragment } from "react";
import { Minus, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePlatformContext } from "@/context/platformContext";
import { useSimulationStore } from "@/lib/permission-simulator";
import { findSchemaForRoute } from "@/lib/permission-schema";
import { cn } from "@/lib/utils";

interface SchemaGateProps {
  /** Key of the element in the page schema (e.g. "edit_general", "members_tab"). */
  elementKey: string;
  children: ReactNode;
  /** Fallback when permission is denied in normal mode (default: null). */
  fallback?: ReactNode;
  /** Extra className applied to the wrapper div in edit mode only. */
  className?: string;
}

/**
 * Schema-driven permission gate. Looks up the permission for `elementKey` from
 * PAGE_SCHEMAS (permission-schema.ts) and behaves like PermissionGate.
 *
 * Elements with no permission in the schema always render children unchanged.
 * Unknown keys are treated the same way (safe pass-through).
 *
 * In God Mode edit mode renders the same +/- overlay controls as PermissionGate.
 */
export function SchemaGate({ elementKey, children, fallback, className }: SchemaGateProps) {
  const pathname = usePathname();
  const { can } = usePlatformContext();
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const markForAddition = useSimulationStore((s) => s.markForAddition);
  const markForRemoval = useSimulationStore((s) => s.markForRemoval);
  const undoChange = useSimulationStore((s) => s.undoChange);

  const schema = findSchemaForRoute(pathname);
  const element = schema?.elements.find((e) => e.key === elementKey);

  if (!element?.permission) {
    return <Fragment>{children}</Fragment>;
  }

  const { permission, label: displayLabel } = element;

  if (!isSimulating || !isEditMode) {
    return can(permission) ? <Fragment>{children}</Fragment> : <Fragment>{fallback ?? null}</Fragment>;
  }

  const hasPermission = can(permission);
  const isPendingAddition = pendingAdditions.includes(permission);
  const isPendingRemoval = pendingRemovals.includes(permission);
  const isPending = isPendingAddition || isPendingRemoval;

  if (hasPermission) {
    return (
      <div
        className={cn(
          "relative rounded-sm",
          isPendingAddition ? "ring-1 ring-blue-500/50 bg-blue-500/5" : "ring-1 ring-emerald-500/40",
          className,
        )}
        title={`${displayLabel}\n${permission}`}
      >
        {children}
        <button
          type="button"
          onClick={() => (isPending ? undoChange(permission) : markForRemoval(permission))}
          className={cn(
            "absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm transition-colors",
            isPendingAddition ? "bg-blue-500 hover:bg-blue-600" : "bg-rose-500 hover:bg-rose-600",
          )}
          title={isPendingAddition ? `Undo adding ${displayLabel}` : `Remove ${displayLabel} from role`}
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[28px] items-center gap-1.5 rounded-sm border border-dashed px-2 py-1 text-xs",
        isPendingRemoval
          ? "border-orange-400/50 bg-orange-400/10 text-orange-600 dark:text-orange-400"
          : "border-muted-foreground/25 bg-muted/20 text-muted-foreground",
        className,
      )}
      title={`${displayLabel}\n${permission}`}
    >
      <span className="truncate">{displayLabel}</span>
      <span className="shrink-0 font-mono text-[10px] opacity-50">{permission}</span>
      <button
        type="button"
        onClick={() => (isPending ? undoChange(permission) : markForAddition(permission))}
        className={cn(
          "ml-auto shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm transition-colors",
          isPendingRemoval ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-500 hover:bg-emerald-600",
        )}
        title={isPendingRemoval ? `Undo removing ${displayLabel}` : `Add ${displayLabel} to role`}
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
