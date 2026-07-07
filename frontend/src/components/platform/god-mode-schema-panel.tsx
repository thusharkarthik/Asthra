"use client";

import { Box, Eye, EyeOff, FileText, Link2, Minus, MousePointer, Plus, Shield } from "lucide-react";
import type { ComponentType } from "react";
import { usePagePermissions } from "@/hooks/use-page-permissions";
import { useSimulationStore } from "@/lib/permission-simulator";
import type { SchemaElementType } from "@/lib/permission-schema";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<SchemaElementType, ComponentType<{ className?: string }>> = {
  button: MousePointer,
  tab: FileText,
  section: Box,
  field: FileText,
  action: MousePointer,
  link: Link2,
};

export function GodModeSchemaPanel() {
  const isGodModeReady = useSimulationStore((s) => s.isGodModeReady);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const markForAddition = useSimulationStore((s) => s.markForAddition);
  const markForRemoval = useSimulationStore((s) => s.markForRemoval);
  const undoChange = useSimulationStore((s) => s.undoChange);
  const { schema, visible } = usePagePermissions();

  if (!isGodModeReady || !isEditMode || !schema) return null;

  return (
    <div className="fixed right-4 top-16 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-background shadow-xl">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Shield className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Schema Permissions
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{schema.elements.length}</span>
      </div>
      <div className="divide-y">
        {schema.elements.map((el) => {
          const isVisible = visible(el.key);
          const Icon = TYPE_ICON[el.type] ?? Box;
          const isPendingAddition = el.permission ? pendingAdditions.includes(el.permission) : false;
          const isPendingRemoval = el.permission ? pendingRemovals.includes(el.permission) : false;
          const isPending = isPendingAddition || isPendingRemoval;

          return (
            <div key={el.key} className="flex items-start gap-2 px-3 py-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium">{el.label}</span>
                  {isVisible ? (
                    <Eye className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <EyeOff className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  )}
                </div>
                {el.permission && (
                  <span className="block font-mono text-[10px] text-muted-foreground/60">{el.permission}</span>
                )}
                {el.description && (
                  <span className="block text-[10px] italic text-muted-foreground/50">{el.description}</span>
                )}
              </div>
              {el.permission && (
                <button
                  type="button"
                  onClick={() => {
                    if (isPending) {
                      undoChange(el.permission!);
                    } else if (isVisible) {
                      markForRemoval(el.permission!);
                    } else {
                      markForAddition(el.permission!);
                    }
                  }}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors",
                    isPendingAddition
                      ? "bg-blue-500 hover:bg-blue-600"
                      : isPendingRemoval
                        ? "bg-orange-500 hover:bg-orange-600"
                        : isVisible
                          ? "bg-rose-500 hover:bg-rose-600"
                          : "bg-emerald-500 hover:bg-emerald-600",
                  )}
                  title={
                    isPendingAddition
                      ? `Undo adding ${el.label}`
                      : isPendingRemoval
                        ? `Undo removing ${el.label}`
                        : isVisible
                          ? `Remove ${el.label} from role`
                          : `Add ${el.label} to role`
                  }
                >
                  {isVisible ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
