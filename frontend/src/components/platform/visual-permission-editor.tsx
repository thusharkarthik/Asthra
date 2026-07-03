"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/permission-simulator";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { usePermissionRegistryStore } from "@/stores/permission-registry-store";
import { settingsApi } from "@/services/api/settings-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Rendered during God Mode (simulation active).
 * Contains two pieces:
 *   1. Floating bottom bar — coverage stats button + save bar (edit mode only)
 *   2. Coverage side panel — all backend permissions organized by module
 */
export function VisualPermissionEditor() {
  const [isSaving, setIsSaving] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["settings"]));

  const accessToken = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const simulatedRoleId = useSimulationStore((s) => s.simulatedRoleId);
  const simulatedRoleName = useSimulationStore((s) => s.simulatedRoleName);
  const isEditMode = useSimulationStore((s) => s.isEditMode);
  const pendingAdditions = useSimulationStore((s) => s.pendingAdditions);
  const pendingRemovals = useSimulationStore((s) => s.pendingRemovals);
  const hasUnsavedChanges = useSimulationStore((s) => s.hasUnsavedChanges);
  const clearPendingChanges = useSimulationStore((s) => s.clearPendingChanges);
  const commitChanges = useSimulationStore((s) => s.commitChanges);

  const byModule = usePermissionRegistryStore((s) => s.byModule);
  const isLoaded = usePermissionRegistryStore((s) => s.isLoaded);
  const isLoading = usePermissionRegistryStore((s) => s.isLoading);
  const getCoverageStats = usePermissionRegistryStore((s) => s.getCoverageStats);

  const stats = isLoaded ? getCoverageStats() : null;
  const sortedModules = Object.keys(byModule).sort();

  function toggleModule(mod: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

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
        message: `${simulatedRoleName}: ${parts.join(", ")}.${missingCodes.length > 0 ? ` (${missingCodes.length} code(s) not found — sync permissions first)` : ""}`,
      });
      commitChanges();
    } catch {
      addToast({ type: "error", title: "Save failed", message: "Could not update role permissions. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* ── Coverage side panel ─────────────────────────────────────────── */}
      {coverageOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-card shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold">Permission Coverage</div>
              {stats ? (
                <div className="text-xs text-muted-foreground">
                  {stats.withUIGate}/{stats.total} permissions gated ({stats.coverage}%)
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {isLoading ? "Loading registry…" : "Registry not loaded"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCoverageOpen(false)}
              className="ml-2 shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                Loading backend permissions…
              </div>
            )}
            {!isLoaded && !isLoading && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                Registry unavailable.
              </div>
            )}
            {sortedModules.map((mod) => {
              const perms = byModule[mod];
              const gated = perms.filter((p) => p.hasUIGate).length;
              const isExpanded = expandedModules.has(mod);
              return (
                <div key={mod} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleModule(mod)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50"
                  >
                    <span className="text-xs font-medium capitalize">{mod}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn(gated === perms.length ? "text-emerald-600 dark:text-emerald-400" : "")}>
                        {gated}/{perms.length}
                      </span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y">
                      {perms.map((p) => (
                        <div key={p.code} className="flex items-start gap-2 px-3 py-1.5">
                          <span
                            className={cn(
                              "mt-0.5 shrink-0 text-xs",
                              p.hasUIGate
                                ? "text-emerald-500"
                                : "text-muted-foreground/40"
                            )}
                          >
                            {p.hasUIGate ? "✓" : "○"}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-mono text-[10px] text-muted-foreground">
                              {p.code}
                            </div>
                            <div className="text-xs text-foreground">{p.label}</div>
                            {p.hasUIGate && p.affects && (
                              <div className="text-[10px] text-muted-foreground">{p.affects}</div>
                            )}
                          </div>
                          {p.risk_level === "high" && (
                            <span className="ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                              high
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating bottom bar ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-xl">
          {/* Coverage toggle button */}
          <button
            type="button"
            onClick={() => setCoverageOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
              coverageOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Permission coverage"
          >
            <span>📊</span>
            {stats ? (
              <span>
                {stats.withUIGate}/{stats.total}
                <span className="ml-1 text-[10px] opacity-70">{stats.coverage}%</span>
              </span>
            ) : isLoading ? (
              <span>Loading…</span>
            ) : (
              <span>Coverage</span>
            )}
          </button>

          {/* Save bar — only shown in edit mode with pending changes */}
          {isEditMode && hasUnsavedChanges && (
            <>
              <div className="h-4 w-px bg-border" />
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
                <Button variant="outline" size="sm" onClick={clearPendingChanges} disabled={isSaving}>
                  Discard Changes
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || !simulatedRoleId}>
                  {isSaving ? "Saving…" : "Save to Role"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
