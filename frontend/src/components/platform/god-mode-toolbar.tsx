"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSimulationStore, roleKeyToNavigationMode } from "@/lib/permission-simulator";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { usePermissionRegistryStore } from "@/stores/permission-registry-store";
import { getPermissionsForRoute } from "@/lib/permission-registry";
import { settingsApi } from "@/services/api/settings-api";
import { cn } from "@/lib/utils";
import type { RoleRecord } from "@/types/core";

export function GodModeToolbar() {
  const pathname = usePathname();
  const [hintsOpen, setHintsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<(RoleRecord & { key: string })[]>([]);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  const isGodModeReady = useSimulationStore((s) => s.isGodModeReady);
  const simulatedRoleKey = useSimulationStore((s) => s.simulatedRoleKey);
  const simulatedRoleName = useSimulationStore((s) => s.simulatedRoleName);
  const simulatedRoleId = useSimulationStore((s) => s.simulatedRoleId);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const pendingChangeCount = useSimulationStore((s) => s.pendingChangeCount);
  const hasUnsavedChanges = useSimulationStore((s) => s.hasUnsavedChanges);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const enterEditMode = useSimulationStore((s) => s.enterEditMode);
  const exitEditMode = useSimulationStore((s) => s.exitEditMode);
  const deactivateGodMode = useSimulationStore((s) => s.deactivateGodMode);
  const commitChanges = useSimulationStore((s) => s.commitChanges);
  const startSimulation = useSimulationStore((s) => s.startSimulation);

  const accessToken = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const registryIsLoaded = usePermissionRegistryStore((s) => s.isLoaded);
  const registryGetByRoute = usePermissionRegistryStore((s) => s.getByRoute);

  const routePerms = registryIsLoaded
    ? registryGetByRoute(pathname)
    : getPermissionsForRoute(pathname);

  useEffect(() => {
    if (!accessToken) return;
    settingsApi.listRoles(accessToken).then((roles) => {
      setAvailableRoles(
        roles.filter((r): r is RoleRecord & { key: string } =>
          Boolean(r.is_active && r.key && r.key !== "superuser")
        )
      );
    }).catch(() => {
      // Silently fail — role name shows as static text
    });
  }, [accessToken]);

  if (!isGodModeReady) return null;

  async function handleRoleSwitch(roleKey: string) {
    if (!accessToken || !roleKey || roleKey === simulatedRoleKey) return;
    const role = availableRoles.find((r) => r.key === roleKey);
    if (!role) return;
    setIsRoleSwitching(true);
    try {
      const result = await settingsApi.simulatePermissions(accessToken, { role_key: roleKey });
      const mode = roleKeyToNavigationMode(roleKey);
      startSimulation(roleKey, role.name, role.id, result.permission_codes, mode);
    } catch {
      addToast({ type: "error", title: "Role switch failed", message: "Could not switch roles. Please try again." });
    } finally {
      setIsRoleSwitching(false);
    }
  }

  async function handleSave() {
    if (!simulatedRoleId || !accessToken) {
      addToast({
        type: "error",
        title: "Cannot save",
        message: "No role ID available — restart God Mode and try again.",
      });
      return;
    }
    setIsSaving(true);
    try {
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
        message: `${simulatedRoleName}: ${parts.join(", ")}.${missingCodes.length > 0 ? ` (${missingCodes.length} code(s) not found)` : ""}`,
      });
      commitChanges();
    } catch {
      addToast({ type: "error", title: "Save failed", message: "Could not update role permissions. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-purple-500/40 bg-purple-950 px-4 py-2 text-sm">
      {/* God Mode label */}
      <div className="flex items-center gap-2 font-bold tracking-wider text-purple-300">
        <span>⚡</span>
        <span>GOD MODE</span>
      </div>

      <div className="h-4 w-px bg-purple-700/60" />

      {/* Role switcher */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-purple-400">Role:</span>
        {availableRoles.length > 0 ? (
          <select
            value={simulatedRoleKey ?? ""}
            onChange={(e) => handleRoleSwitch(e.target.value)}
            disabled={isRoleSwitching}
            className="cursor-pointer rounded border border-purple-700 bg-purple-900 px-2 py-0.5 text-xs text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Show current role if excluded from list (e.g. superuser) */}
            {simulatedRoleKey && !availableRoles.some((r) => r.key === simulatedRoleKey) && (
              <option value={simulatedRoleKey}>{simulatedRoleName ?? simulatedRoleKey}</option>
            )}
            {availableRoles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-medium text-white">{simulatedRoleName}</span>
        )}
        {isRoleSwitching && (
          <span className="text-xs text-purple-400">Switching…</span>
        )}
      </div>

      <div className="h-4 w-px bg-purple-700/60" />

      {/* View / Edit toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-purple-900/70 p-0.5">
        <button
          type="button"
          onClick={exitEditMode}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            !isEditMode
              ? "bg-purple-600 text-white shadow-sm"
              : "text-purple-300 hover:text-white"
          )}
        >
          👁 View
        </button>
        <button
          type="button"
          onClick={enterEditMode}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            isEditMode
              ? "bg-purple-600 text-white shadow-sm"
              : "text-purple-300 hover:text-white"
          )}
        >
          ✏️ Edit
        </button>
      </div>

      {/* Pending changes badge */}
      {pendingChangeCount > 0 && (
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
          {pendingChangeCount} {pendingChangeCount === 1 ? "change" : "changes"}
        </span>
      )}

      {/* Save to Role */}
      {hasUnsavedChanges && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "💾 Save to Role"}
        </button>
      )}

      <div className="flex-1" />

      {/* Route permission hints */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setHintsOpen((v) => !v)}
          className="flex h-6 w-6 items-center justify-center rounded text-purple-400 transition-colors hover:bg-purple-800/50 hover:text-purple-200"
          title="Permissions on this page"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
        {hintsOpen && (
          <div className="absolute right-0 top-8 z-50 w-80 rounded-md border border-purple-700/50 bg-card p-3 text-foreground shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold">Permissions on this page</span>
                {registryIsLoaded && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    ({routePerms.length} from backend)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHintsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {routePerms.length === 0 ? (
              <p className="text-xs text-muted-foreground">No registered permissions for this route.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {routePerms.map((def) => (
                  <li key={def.code} className="text-xs">
                    <div className="font-mono text-[10px] text-muted-foreground">{def.code}</div>
                    <div className="font-medium">{def.label}</div>
                    <div className="text-muted-foreground">{def.affects}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Exit God Mode */}
      <button
        type="button"
        onClick={deactivateGodMode}
        className="rounded border border-red-700/50 bg-red-900/40 px-4 py-1.5 text-xs font-medium text-red-300 transition-all hover:border-red-600 hover:bg-red-800/60 hover:text-red-200"
      >
        Exit God Mode
      </button>
    </div>
  );
}
