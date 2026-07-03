"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { settingsApi } from "@/services/api/settings-api";
import { Button } from "@/components/ui/button";

/**
 * Floating save bar shown at the bottom of the content area when the
 * user is in edit mode with unsaved permission changes.
 *
 * Renders nothing when there are no pending changes.
 */
export function VisualPermissionEditor() {
  const [isSaving, setIsSaving] = useState(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const simulatedRoleId = useSimulationStore((s) => s.simulatedRoleId);
  const simulatedRoleName = useSimulationStore((s) => s.simulatedRoleName);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const hasUnsavedChanges = useSimulationStore((s) => s.hasUnsavedChanges);
  const clearPendingChanges = useSimulationStore((s) => s.clearPendingChanges);
  const commitChanges = useSimulationStore((s) => s.commitChanges);

  if (!hasUnsavedChanges) return null;

  async function handleSave() {
    if (!simulatedRoleId || !accessToken) {
      addToast({
        type: "error",
        title: "Cannot save",
        message: "No role ID available — restart the simulation and try again.",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Resolve permission codes → database IDs
      const allPermissions = await settingsApi.listPermissions(accessToken);
      const codeToId = new Map(allPermissions.map((p) => [p.code, p.id]));

      const missingCodes: string[] = [];

      for (const code of pendingAdditions) {
        const permId = codeToId.get(code);
        if (permId == null) { missingCodes.push(code); continue; }
        await settingsApi.addRolePermission(accessToken, simulatedRoleId, permId);
      }

      for (const code of pendingRemovals) {
        const permId = codeToId.get(code);
        if (permId == null) { missingCodes.push(code); continue; }
        await settingsApi.removeRolePermission(accessToken, simulatedRoleId, permId);
      }

      const addedCount = pendingAdditions.length - missingCodes.filter((c) => pendingAdditions.includes(c)).length;
      const removedCount = pendingRemovals.length - missingCodes.filter((c) => pendingRemovals.includes(c)).length;

      const parts: string[] = [];
      if (addedCount > 0) parts.push(`+${addedCount} added`);
      if (removedCount > 0) parts.push(`-${removedCount} removed`);

      addToast({
        type: "success",
        title: "Permissions updated",
        message: `${simulatedRoleName}: ${parts.join(", ")}.${missingCodes.length > 0 ? ` (${missingCodes.length} code(s) not found in registry — sync permissions first)` : ""}`,
      });

      // Commit keeps the new simulatedPermissions as the new baseline
      commitChanges();
    } catch {
      addToast({
        type: "error",
        title: "Save failed",
        message: "Could not update role permissions. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3 text-sm">
          {pendingAdditions.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +{pendingAdditions.length}
              </span>
              <span className="text-muted-foreground">
                {pendingAdditions.length === 1 ? "permission" : "permissions"}
              </span>
            </span>
          )}
          {pendingRemovals.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                -{pendingRemovals.length}
              </span>
              <span className="text-muted-foreground">
                {pendingRemovals.length === 1 ? "permission" : "permissions"}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearPendingChanges}
            disabled={isSaving}
          >
            Discard Changes
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !simulatedRoleId}
          >
            {isSaving ? "Saving…" : "Save to Role"}
          </Button>
        </div>
      </div>
    </div>
  );
}
