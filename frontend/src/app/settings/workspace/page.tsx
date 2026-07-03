"use client";

import { type FormEvent, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePlatformContext } from "@/context/platformContext";
import { useSettingsAuthority, RequestAccessButton } from "@/app/settings/layout";
import { hasHierarchicalPermission } from "@/lib/settings-permissions";
import { settingsApi } from "@/services/api/settings-api";
import type { WorkspaceSettingsRecord } from "@/services/api/settings-api";
import {
  SettingsLayout,
  SettingsSectionHeader,
  SettingsCard,
  SettingsDangerZone,
  SettingsEmptyState,
  FormField,
} from "@/components/settings/settings-components";
import { PermissionGate } from "@/components/platform/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyModuleState } from "@/components/layout/ui-states";

const SELECT_CLASS =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

const DESCRIPTION_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[72px]";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Africa/Cairo", "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney", "Pacific/Auckland",
];

const LOCALES = [
  { value: "en", label: "English" }, { value: "fr", label: "French" },
  { value: "de", label: "German" }, { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" }, { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" }, { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
];

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private — members only" },
  { value: "org", label: "Org-wide — visible to all org members" },
  { value: "public", label: "Public — visible to everyone" },
];

const MODULES: { key: string; label: string; description: string }[] = [
  { key: "flow", label: "Flow", description: "Work management, tasks, sprints" },
  { key: "docs", label: "Docs", description: "Knowledge base and documentation" },
  { key: "discover", label: "Discover", description: "Ideas and product discovery" },
  { key: "desk", label: "Desk", description: "Support tickets and helpdesk" },
  { key: "pulse", label: "Pulse", description: "Operational health and incidents" },
  { key: "collab", label: "Collab", description: "Threads and collaboration" },
  { key: "automation", label: "Automation", description: "Automated workflows" },
];

export default function WorkspaceSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const { workspaces, can, isLoading: ctxIsLoading } = usePlatformContext();
  const { authorityLevel } = useSettingsAuthority();

  const isSuperuser = Boolean(currentUser?.is_superuser);
  const isAdminUser = isSuperuser || authorityLevel === "platform" || authorityLevel === "org";
  const canViewWorkspace =
    isAdminUser ||
    hasHierarchicalPermission(can, "settings.organization.view", "settings.workspace.view");
  const isAuthorized =
    isAdminUser ||
    hasHierarchicalPermission(
      can,
      "settings.organization.view",
      "settings.workspace.view",
      "settings.workspace.edit"
    );

  const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const wsId = workspace?.id;

  const [wsName, setWsName] = useState(workspace?.name ?? "");
  const [wsDesc, setWsDesc] = useState(workspace?.description ?? "");

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name);
      setWsDesc(workspace.description ?? "");
    }
  }, [workspace]);

  const [visibility, setVisibility] = useState("private");
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en");
  const [enabledModules, setEnabledModules] = useState<string[]>(MODULES.map((m) => m.key));
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["workspace-settings", wsId],
    queryFn: () => settingsApi.getWorkspaceSettings(accessToken ?? "", wsId!),
    enabled: Boolean(accessToken && wsId),
  });

  useEffect(() => {
    const s = settingsQuery.data;
    if (s) {
      setVisibility(s.visibility ?? "private");
      setTimezone(s.default_timezone ?? "UTC");
      setLocale(s.locale ?? "en");
      setEnabledModules(s.enabled_modules ?? MODULES.map((m) => m.key));
    }
  }, [settingsQuery.data]);

  const updateWsMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      settingsApi.updateWorkspace(accessToken ?? "", wsId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      addToast({ type: "success", title: "Saved", message: "Workspace details updated." });
    },
    onError: () => addToast({ type: "error", title: "Save failed", message: "Could not update workspace." }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<WorkspaceSettingsRecord>) =>
      settingsApi.updateWorkspaceSettings(accessToken ?? "", wsId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace-settings", wsId] });
      addToast({ type: "success", title: "Saved", message: "Workspace settings updated." });
    },
    onError: () => addToast({ type: "error", title: "Save failed", message: "Could not update settings." }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => settingsApi.updateWorkspace(accessToken ?? "", wsId!, { is_active: false }),
    onSuccess: async () => {
      setDeactivateConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      addToast({ type: "success", title: "Archived", message: "Workspace has been archived." });
    },
    onError: () => addToast({ type: "error", title: "Failed", message: "Could not archive workspace." }),
  });

  function handleSaveGeneral(e: FormEvent) {
    e.preventDefault();
    if (!wsName.trim() || !wsId) return;
    updateWsMutation.mutate({ name: wsName.trim(), description: wsDesc.trim() || undefined });
  }

  function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!wsId) return;
    updateSettingsMutation.mutate({ visibility, default_timezone: timezone, locale, enabled_modules: enabledModules });
  }

  function toggleModule(key: string) {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "Workspace" }];

  if (!isAdminUser && ctxIsLoading) return null;

  if (!canViewWorkspace) {
    return (
      <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings" backLabel="Back to Settings">
        <SettingsEmptyState
          title="Access Restricted"
          description="You need organization view and workspace view permissions to see this page. Contact your Organization Admin to request access."
          action={<RequestAccessButton page="/settings/workspace" />}
        />
      </SettingsLayout>
    );
  }

  if (!selectedWorkspaceId || !workspace) {
    return (
      <SettingsLayout breadcrumbs={breadcrumbs}>
        <SettingsSectionHeader title="Workspace Settings" description="Configure the selected workspace." />
        <EmptyModuleState
          title="No workspace selected"
          description="Select a workspace from the sidebar to configure its settings."
        />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      breadcrumbs={breadcrumbs}
      parentContext={{
        label: "Workspace",
        title: workspace.name,
        description: workspace.description ?? undefined,
        meta: `Status: ${workspace.is_active === false ? "Archived" : "Active"}`,
      }}
    >
      <SettingsSectionHeader
        title="Workspace Settings"
        description="Manage this workspace's configuration, visibility, and enabled modules."
      />

      {/* General */}
      <SettingsCard title="General" description="Name and description shown across Asthra.">
        <form className="space-y-4" onSubmit={handleSaveGeneral}>
          <FormField label="Workspace Name" required>
            <Input value={wsName} onChange={(e) => setWsName(e.target.value)} disabled={!isAuthorized} />
          </FormField>
          <FormField label="Description">
            <textarea
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              className={DESCRIPTION_CLASS}
              rows={3}
              disabled={!isAuthorized}
            />
          </FormField>
          <PermissionGate permission="settings.workspace.edit">
            <div className="flex justify-end">
              <Button type="submit" disabled={updateWsMutation.isPending}>
                {updateWsMutation.isPending ? "Saving…" : "Save General"}
              </Button>
            </div>
          </PermissionGate>
        </form>
      </SettingsCard>

      <form className="space-y-6" onSubmit={handleSaveSettings}>
        <SettingsCard title="Access & Localization" description="Control who can see this workspace and set regional defaults.">
          <div className="space-y-4">
            <FormField label="Visibility">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className={SELECT_CLASS}
                disabled={!isAuthorized}
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Timezone">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={SELECT_CLASS}
                disabled={!isAuthorized}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Language / Locale">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className={SELECT_CLASS}
                disabled={!isAuthorized}
              >
                {LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </SettingsCard>

        <SettingsCard title="Module Visibility" description="Choose which modules are available in this workspace.">
          <div className="space-y-3">
            {MODULES.map((mod) => (
              <label
                key={mod.key}
                className={`flex items-start gap-3 ${isAuthorized ? "cursor-pointer" : "cursor-default opacity-70"}`}
              >
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.key)}
                  onChange={() => isAuthorized && toggleModule(mod.key)}
                  className="mt-0.5 h-4 w-4 rounded"
                  disabled={!isAuthorized}
                />
                <div>
                  <div className="text-sm font-medium">{mod.label}</div>
                  <div className="text-xs text-muted-foreground">{mod.description}</div>
                </div>
              </label>
            ))}
          </div>
        </SettingsCard>

        <PermissionGate permission="settings.workspace.edit">
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </PermissionGate>
      </form>

      <PermissionGate permission="settings.workspace.edit">
        <SettingsDangerZone
          description="Archiving the workspace suspends access for all members. Projects and data are preserved. This can be reversed by an org admin."
          actions={
            deactivateConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-destructive">Archive this workspace?</span>
                <Button
                  className="bg-destructive text-destructive-foreground hover:opacity-90"
                  onClick={() => deactivateMutation.mutate()}
                  disabled={deactivateMutation.isPending || workspace.is_active === false}
                >
                  {deactivateMutation.isPending ? "Archiving…" : "Yes, Archive"}
                </Button>
                <Button variant="outline" onClick={() => setDeactivateConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setDeactivateConfirm(true)}
                disabled={workspace.is_active === false}
              >
                {workspace.is_active === false ? "Already Archived" : "Archive Workspace"}
              </Button>
            )
          }
        />
      </PermissionGate>
    </SettingsLayout>
  );
}
