"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSimulationStore, roleKeyToNavigationMode } from "@/lib/permission-simulator";
import { settingsApi } from "@/services/api/settings-api";
import type { RoleRecord } from "@/types/core";

interface GodModeActivationProps {
  roles: RoleRecord[];
  onClose: () => void;
}

export function GodModeActivation({ roles, onClose }: GodModeActivationProps) {
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const activateGodMode = useSimulationStore((s) => s.activateGodMode);

  const activeRoles = roles.filter((r): r is RoleRecord & { key: string } =>
    Boolean(r.is_active && r.key)
  );

  async function handleActivate() {
    if (!selectedRoleKey || !accessToken) return;
    setIsActivating(true);
    setError(null);
    try {
      const result = await settingsApi.simulatePermissions(accessToken, { role_key: selectedRoleKey });
      const role = activeRoles.find((r) => r.key === selectedRoleKey);
      const roleName = role?.name ?? selectedRoleKey;
      const roleId = role?.id ?? null;
      const mode = roleKeyToNavigationMode(selectedRoleKey);
      activateGodMode(selectedRoleKey, roleName, roleId, result.permission_codes, mode);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate God Mode.");
      setIsActivating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-purple-700/50 bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="text-3xl leading-none">⚡</span>
          <div>
            <h2 className="text-base font-bold text-foreground">Enter God Mode</h2>
            <p className="text-xs text-muted-foreground">Simulate permissions as a role</p>
          </div>
        </div>

        {/* Role selector */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Select role to simulate
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={selectedRoleKey}
            onChange={(e) => setSelectedRoleKey(e.target.value)}
            disabled={isActivating}
          >
            <option value="">Choose a role…</option>
            {activeRoles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Warning */}
        <div className="mb-5 flex items-start gap-2 rounded-md border border-amber-700/30 bg-amber-950/20 px-3 py-2">
          <span className="mt-0.5 text-sm">⚠️</span>
          <p className="text-[11px] text-amber-300/90">
            API calls still use your real token. Only the UI reflects simulated permissions.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-3 text-xs text-destructive">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isActivating}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleActivate}
            disabled={!selectedRoleKey || isActivating}
            className="flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>⚡</span>
            <span>{isActivating ? "Activating…" : "Enter God Mode"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
