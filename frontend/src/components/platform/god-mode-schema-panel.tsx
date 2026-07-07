"use client";

import { useState } from "react";
import { Box, FileText, Link2, MousePointer, Shield } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isGodModeReady = useSimulationStore((s) => s.isGodModeReady);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const simulatedPermissions = useSimulationStore((s) => s.simulatedPermissions);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const markForAddition = useSimulationStore((s) => s.markForAddition);
  const markForRemoval = useSimulationStore((s) => s.markForRemoval);
  const undoChange = useSimulationStore((s) => s.undoChange);
  const { schema } = usePagePermissions();

  if (!isGodModeReady || !isEditMode || !schema) return null;

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="fixed right-0 top-24 z-50 flex h-28 w-6 cursor-pointer items-center justify-center rounded-l-md border border-r-0 border-purple-700 bg-purple-950/95 text-purple-300 shadow-lg hover:bg-purple-900/95"
        title="Expand schema panel"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest">SCHEMA ◂</span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-16 z-50 w-64 max-h-[80vh] overflow-y-auto rounded-lg border border-purple-700 bg-purple-950/95 shadow-xl text-purple-100">
      <div className="flex items-center gap-2 border-b border-purple-700/50 px-3 py-2">
        <Shield className="h-3.5 w-3.5 text-purple-400" />
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-purple-300">
          {schema.label}
        </span>
        <span className="ml-auto shrink-0 font-mono text-xs text-purple-500">{schema.elements.length}</span>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-purple-400 hover:bg-purple-800 hover:text-purple-200"
          title="Collapse panel"
        >
          ✕
        </button>
      </div>
      <div className="divide-y divide-purple-800/50">
        {schema.elements.map((el) => {
          const isPendingAddition = el.permission ? pendingAdditions.includes(el.permission) : false;
          const isPendingRemoval = el.permission ? pendingRemovals.includes(el.permission) : false;
          const isPending = isPendingAddition || isPendingRemoval;
          const effectivelyVisible = el.permission
            ? (simulatedPermissions.includes(el.permission) && !isPendingRemoval) || isPendingAddition
            : true;
          const Icon = TYPE_ICON[el.type] ?? Box;

          return (
            <div key={el.key} className="flex items-start gap-2 px-3 py-2">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-purple-100">{el.label}</span>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      effectivelyVisible ? "bg-emerald-500" : "bg-rose-500/60",
                    )}
                  />
                </div>
                {el.permission && (
                  <span className="block font-mono text-[10px] text-purple-500/80">{el.permission}</span>
                )}
                {el.description && (
                  <span className="block text-[10px] italic text-purple-500/60">{el.description}</span>
                )}
              </div>
              {el.permission && (
                <button
                  type="button"
                  onClick={() => {
                    if (isPending) {
                      undoChange(el.permission!);
                    } else if (effectivelyVisible) {
                      markForRemoval(el.permission!);
                    } else {
                      markForAddition(el.permission!);
                    }
                  }}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-colors",
                    isPendingAddition
                      ? "bg-blue-500 hover:bg-blue-600"
                      : isPendingRemoval
                        ? "bg-orange-500 hover:bg-orange-600"
                        : effectivelyVisible
                          ? "bg-rose-500 hover:bg-rose-600"
                          : "bg-emerald-500 hover:bg-emerald-600",
                  )}
                  title={
                    isPendingAddition
                      ? `Undo adding ${el.label}`
                      : isPendingRemoval
                        ? `Undo removing ${el.label}`
                        : effectivelyVisible
                          ? `Remove ${el.label} from role`
                          : `Add ${el.label} to role`
                  }
                >
                  {isPending ? "↩" : effectivelyVisible ? "−" : "+"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
