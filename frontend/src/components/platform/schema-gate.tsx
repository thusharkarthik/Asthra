"use client";

import { type ReactNode, Fragment } from "react";
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
 * In God Mode edit mode renders an always-visible border + +/- button overlay.
 * Hidden elements show children dimmed at opacity-40 so the user can see what
 * would appear after granting the permission.
 */
export function SchemaGate({ elementKey, children, fallback, className }: SchemaGateProps) {
  const pathname = usePathname();
  const { can } = usePlatformContext();
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const simulatedPermissions = useSimulationStore((s) => s.simulatedPermissions);
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

  const isPendingAddition = pendingAdditions.includes(permission);
  const isPendingRemoval = pendingRemovals.includes(permission);
  const isPending = isPendingAddition || isPendingRemoval;
  const effectivelyVisible =
    (simulatedPermissions.includes(permission) && !isPendingRemoval) || isPendingAddition;

  const borderClass = isPendingAddition
    ? "ring-2 ring-blue-500 bg-blue-500/5"
    : isPendingRemoval
      ? "ring-2 ring-orange-400 bg-orange-400/5"
      : effectivelyVisible
        ? "ring-2 ring-emerald-500/70"
        : "ring-2 ring-rose-500/60 bg-rose-500/5";

  const btnClass = isPendingAddition
    ? "bg-blue-500 hover:bg-blue-600"
    : isPendingRemoval
      ? "bg-orange-500 hover:bg-orange-600"
      : effectivelyVisible
        ? "bg-rose-500 hover:bg-rose-600"
        : "bg-emerald-500 hover:bg-emerald-600";

  const btnSymbol = isPending ? "↩" : effectivelyVisible ? "−" : "+";
  const btnTitle = isPendingAddition
    ? `Undo adding ${displayLabel}`
    : isPendingRemoval
      ? `Undo removing ${displayLabel}`
      : effectivelyVisible
        ? `Remove ${displayLabel} from role`
        : `Add ${displayLabel} to role`;

  return (
    <div
      className={cn("relative rounded-sm", borderClass, className)}
      title={`${displayLabel}\n${permission}`}
    >
      <div className={cn("transition-opacity", effectivelyVisible ? "opacity-100" : "opacity-40")}>
        {children}
      </div>
      <button
        type="button"
        onClick={() =>
          isPending
            ? undoChange(permission)
            : effectivelyVisible
              ? markForRemoval(permission)
              : markForAddition(permission)
        }
        className={cn(
          "absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-colors",
          btnClass,
        )}
        title={btnTitle}
      >
        {btnSymbol}
      </button>
    </div>
  );
}
