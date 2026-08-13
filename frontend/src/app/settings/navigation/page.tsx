"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequestAccessButton } from "@/app/settings/layout";
import {
  SettingsCard,
  SettingsDataTable,
  SettingsEmptyState,
  SettingsLayout,
  SettingsSectionHeader,
} from "@/components/settings/settings-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatformContext } from "@/context/platformContext";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import type { NavigationRegistryItem, RoleNavigationVisibility, RoleRecord } from "@/types/core";

const NAV_CONFIG_FLAG = "core.navigation_config.enabled";
const NAVIGATION_MODES = [
  { value: "platform", label: "Platform" },
  { value: "organization", label: "Organization" },
  { value: "work", label: "Work" },
  { value: "settings", label: "Settings" },
  { value: "personal", label: "Personal" },
] as const;
const VISIBILITY_OPTIONS: Array<{ value: RoleNavigationVisibility; label: string }> = [
  { value: "default", label: "Default" },
  { value: "hidden", label: "Hidden" },
  { value: "show_when_allowed", label: "Show when allowed" },
  { value: "show_locked_if_denied", label: "Show locked if denied" },
];

type ModeValue = (typeof NAVIGATION_MODES)[number]["value"];
type EditorItemState = { visibility: RoleNavigationVisibility; orderOverride: string };

function asErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function joinValues(values: string[] | undefined, empty = "None") {
  return values?.length ? values.join(", ") : empty;
}

function normalizeMode(mode: string) {
  return mode === "organization" ? "org" : mode;
}

function groupRegistryItems(items: NavigationRegistryItem[]) {
  return items.reduce<Record<string, Record<string, NavigationRegistryItem[]>>>((groups, item) => {
    const mode = item.mode || "unknown";
    const group = item.group || "Ungrouped";
    groups[mode] ??= {};
    groups[mode][group] ??= [];
    groups[mode][group].push(item);
    return groups;
  }, {});
}

function modeLabel(mode: string) {
  if (mode === "org") return "Organization";
  return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "Unknown";
}

function roleLabel(role: RoleRecord) {
  return `${role.name}${role.scope ? ` (${modeLabel(role.scope)})` : ""}`;
}

function buildDefaultEditorState(items: NavigationRegistryItem[]) {
  return Object.fromEntries(items.map((item) => [item.nav_key, { visibility: "default", orderOverride: "" } satisfies EditorItemState]));
}

function visibilityCounts(items: Array<{ preview_visibility: RoleNavigationVisibility }>) {
  return items.reduce<Record<RoleNavigationVisibility, number>>(
    (counts, item) => {
      counts[item.preview_visibility] += 1;
      return counts;
    },
    { default: 0, hidden: 0, show_when_allowed: 0, show_locked_if_denied: 0 },
  );
}

export default function NavigationSettingsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const { can, isLoading: contextLoading, isFetching: contextFetching, featureFlags, isFeatureEnabled } = usePlatformContext();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeValue>("platform");
  const [roleSearch, setRoleSearch] = useState("");
  const [editorState, setEditorState] = useState<Record<string, EditorItemState>>({});
  const [isDirty, setIsDirty] = useState(false);

  const canViewNavigation = can("settings.navigation.view") || can("settings.navigation.manage");
  const canManageNavigation = can("settings.navigation.manage");
  const navigationConfigEnabled = isFeatureEnabled(NAV_CONFIG_FLAG);
  const normalizedSelectedMode = normalizeMode(selectedMode);

  const registryQuery = useQuery({
    queryKey: ["settings", "navigation", "registry"],
    queryFn: () => settingsApi.getNavigationRegistry(accessToken ?? ""),
    enabled: Boolean(accessToken && canViewNavigation),
    staleTime: 60_000,
    retry: false,
  });

  const rolesQuery = useQuery({
    queryKey: ["settings", "navigation", "roles"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && canViewNavigation),
    staleTime: 60_000,
    retry: false,
  });

  const selectedRole = useMemo(
    () => (rolesQuery.data ?? []).find((role) => role.id === selectedRoleId) ?? null,
    [rolesQuery.data, selectedRoleId],
  );
  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    const roles = rolesQuery.data ?? [];
    if (!query) return roles;
    return roles.filter((role) => [role.name, role.key ?? "", role.scope].join(" ").toLowerCase().includes(query));
  }, [roleSearch, rolesQuery.data]);

  useEffect(() => {
    if (selectedRoleId != null) return;
    const firstRole = rolesQuery.data?.[0];
    if (firstRole) setSelectedRoleId(firstRole.id);
  }, [rolesQuery.data, selectedRoleId]);

  const roleConfigQuery = useQuery({
    queryKey: ["settings", "navigation", "role-config", selectedRoleId, selectedMode],
    queryFn: () => settingsApi.getRoleNavigationConfig(accessToken ?? "", selectedRoleId ?? 0, selectedMode),
    enabled: Boolean(accessToken && canViewNavigation && selectedRoleId),
    staleTime: 30_000,
    retry: false,
  });

  const previewQuery = useQuery({
    queryKey: ["settings", "navigation", "role-config-preview", selectedRoleId, selectedMode],
    queryFn: () => settingsApi.getRoleNavigationConfigPreview(accessToken ?? "", selectedRoleId ?? 0, selectedMode),
    enabled: Boolean(accessToken && canViewNavigation && selectedRoleId),
    staleTime: 30_000,
    retry: false,
  });

  const registryItems = registryQuery.data?.items ?? [];
  const registryGroups = useMemo(() => groupRegistryItems(registryItems), [registryItems]);
  const modeItems = useMemo(
    () => registryItems.filter((item) => item.mode === normalizedSelectedMode).sort((left, right) => left.order - right.order || left.label.localeCompare(right.label)),
    [normalizedSelectedMode, registryItems],
  );
  const modeEditorGroups = useMemo(() => groupRegistryItems(modeItems), [modeItems]);
  const itemsByMode = useMemo(
    () => registryItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.mode] = (counts[item.mode] ?? 0) + 1;
      return counts;
    }, {}),
    [registryItems],
  );
  const itemsByGroup = useMemo(
    () => registryItems.reduce<Record<string, number>>((counts, item) => {
      counts[item.group] = (counts[item.group] ?? 0) + 1;
      return counts;
    }, {}),
    [registryItems],
  );
  const permissionRequiredCount = registryItems.filter((item) => item.required_any_permissions.length > 0).length;
  const customizableCount = registryItems.filter((item) => item.is_customizable).length;
  const previewCounts = visibilityCounts(previewQuery.data?.items ?? []);

  useEffect(() => {
    const configsByKey = new Map((roleConfigQuery.data?.items ?? []).map((item) => [item.nav_key, item]));
    const nextState = Object.fromEntries(
      modeItems.map((item) => {
        const config = configsByKey.get(item.nav_key);
        return [
          item.nav_key,
          {
            visibility: config?.visibility ?? "default",
            orderOverride: config?.order_override != null ? String(config.order_override) : "",
          } satisfies EditorItemState,
        ];
      }),
    );
    setEditorState(nextState);
    setIsDirty(false);
  }, [modeItems, roleConfigQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!accessToken || !selectedRoleId) throw new Error("Select a role before saving navigation config.");
      return settingsApi.updateRoleNavigationConfig(accessToken, {
        role_id: selectedRoleId,
        mode: selectedMode,
        items: modeItems.map((item) => {
          const state = editorState[item.nav_key] ?? { visibility: "default", orderOverride: "" };
          const trimmedOrder = state.orderOverride.trim();
          const orderOverride = trimmedOrder ? Number(trimmedOrder) : null;
          return {
            nav_key: item.nav_key,
            visibility: state.visibility,
            order_override: orderOverride != null && Number.isFinite(orderOverride) ? orderOverride : null,
            label_override: null,
            group_override: null,
            is_active: true,
          };
        }),
      });
    },
    onSuccess: async () => {
      addToast({ type: "success", title: "Navigation config saved", message: "Saved config metadata. Live sidebar behavior is unchanged." });
      setIsDirty(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings", "navigation", "role-config", selectedRoleId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "navigation", "role-config-preview", selectedRoleId, selectedMode] }),
      ]);
    },
    onError: (error) => {
      addToast({ type: "error", title: "Navigation config save failed", message: asErrorMessage(error) ?? "Unable to save navigation configuration." });
    },
  });

  function updateEditorItem(navKey: string, patch: Partial<EditorItemState>) {
    setEditorState((state) => ({
      ...state,
      [navKey]: {
        visibility: state[navKey]?.visibility ?? "default",
        orderOverride: state[navKey]?.orderOverride ?? "",
        ...patch,
      },
    }));
    setIsDirty(true);
  }

  function resetCurrentMode() {
    setEditorState(buildDefaultEditorState(modeItems));
    setIsDirty(true);
  }

  const editorDisabled = !canManageNavigation || saveMutation.isPending;

  if (contextLoading || contextFetching) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Navigation" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Navigation" description="Checking navigation administration access." />
        <SettingsEmptyState title="Loading navigation settings" description="Resolving your platform permissions before loading registry data." />
      </SettingsLayout>
    );
  }

  if (!canViewNavigation) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Navigation" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Navigation" description="Inspect navigation registry and role navigation configuration metadata." />
        <SettingsEmptyState
          title="Access restricted"
          description="You need settings.navigation.view or settings.navigation.manage to inspect navigation configuration."
          action={<RequestAccessButton page="/settings/navigation" />}
        />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Navigation" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="Navigation"
        description="Inspect and configure role-based navigation metadata. This setup page does not change the live sidebar."
      />

      <section className="rounded-lg border border-cyan-300/60 bg-cyan-50 p-4 text-sm text-cyan-950 dark:border-cyan-700/60 dark:bg-cyan-950/30 dark:text-cyan-100">
        <div className="font-semibold">Navigation configuration is in setup mode.</div>
        <p className="mt-1">
          These settings are saved for future sidebar customization, but they do not affect the live sidebar yet. The live sidebar still uses the existing navigation baseline.
        </p>
        <p className="mt-2 font-medium">{NAV_CONFIG_FLAG}: {String(featureFlags[NAV_CONFIG_FLAG] ?? navigationConfigEnabled)}</p>
      </section>

      <SettingsCard title="Status" description="Role navigation config is stored and previewed only. Live application remains disabled.">
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-muted-foreground">Navigation Registry</div>
            <div className="mt-1 font-semibold text-emerald-600">Active</div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-muted-foreground">Role Navigation Config Foundation</div>
            <div className="mt-1 font-semibold text-emerald-600">Active</div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-muted-foreground">Live Sidebar Config</div>
            <div className="mt-1 font-semibold text-muted-foreground">Disabled</div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="text-muted-foreground">Editing</div>
            <div className="mt-1 font-semibold">{canManageNavigation ? "Enabled for your permissions" : "Read-only"}</div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Registry overview" description="Code-owned navigation metadata from Core. Visibility still depends on feature flags and backend permissions.">
        {registryQuery.isError ? (
          <SettingsEmptyState title="Navigation registry unavailable" description={asErrorMessage(registryQuery.error) ?? "Could not load navigation registry."} />
        ) : (
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="text-muted-foreground">Total Items</div>
              <div className="mt-1 text-2xl font-semibold">{registryItems.length}</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="text-muted-foreground">Modes</div>
              <div className="mt-1 font-medium">{Object.entries(itemsByMode).map(([mode, count]) => `${modeLabel(mode)} ${count}`).join(" | ") || "None"}</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="text-muted-foreground">Groups</div>
              <div className="mt-1 font-medium">{Object.entries(itemsByGroup).map(([group, count]) => `${group} ${count}`).join(" | ") || "None"}</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="text-muted-foreground">Permission / Customizable</div>
              <div className="mt-1 font-medium">{permissionRequiredCount} gated | {customizableCount} customizable</div>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Role and mode" description="Choose the role and navigation mode whose saved config metadata you want to edit.">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px]">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Search roles</span>
            <Input value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search by role, key, or scope" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Role</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedRoleId ?? ""}
              onChange={(event) => setSelectedRoleId(event.target.value ? Number(event.target.value) : null)}
              disabled={rolesQuery.isLoading || !filteredRoles.length}
            >
              <option value="">Select role</option>
              {filteredRoles.map((role) => (
                <option key={role.id} value={role.id}>{roleLabel(role)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Mode</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedMode}
              onChange={(event) => setSelectedMode(event.target.value as ModeValue)}
            >
              {NAVIGATION_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </label>
        </div>
        {!canManageNavigation ? <p className="mt-3 text-sm text-muted-foreground">You have view access only. Save controls are disabled because `settings.navigation.manage` is required.</p> : null}
      </SettingsCard>

      <SettingsCard
        title="Role Navigation Config Editor"
        description="Set visibility metadata per nav item. Saving writes config data only; it does not affect the live sidebar."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={resetCurrentMode} disabled={editorDisabled || !modeItems.length}>Reset mode to Default</Button>
            <Button type="button" variant="outline" onClick={() => { void roleConfigQuery.refetch(); void previewQuery.refetch(); }} disabled={roleConfigQuery.isFetching || previewQuery.isFetching}>Reload</Button>
            <Button type="button" onClick={() => saveMutation.mutate()} disabled={editorDisabled || !selectedRole || !isDirty}>{saveMutation.isPending ? "Saving..." : "Save config"}</Button>
          </div>
        }
      >
        {rolesQuery.isError ? (
          <SettingsEmptyState title="Role list unavailable" description={asErrorMessage(rolesQuery.error) ?? "Could not load roles for editing."} />
        ) : !selectedRole ? (
          <SettingsEmptyState title="Select a role" description="Choose a role and mode to edit navigation config metadata." />
        ) : registryQuery.isLoading || roleConfigQuery.isLoading ? (
          <SettingsEmptyState title="Loading editor" description="Fetching registry items and saved role navigation config." />
        ) : roleConfigQuery.isError ? (
          <SettingsEmptyState title="Config unavailable" description={asErrorMessage(roleConfigQuery.error) ?? "Could not load saved role navigation config."} />
        ) : modeItems.length ? (
          <div className="space-y-5">
            {Object.entries(modeEditorGroups).map(([mode, groups]) => (
              <section key={mode} className="space-y-3">
                <h2 className="text-sm font-semibold">{modeLabel(mode)}</h2>
                {Object.entries(groups).map(([group, items]) => (
                  <div key={`${mode}-${group}`} className="space-y-2">
                    <h3 className="text-xs font-medium uppercase text-muted-foreground">{group}</h3>
                    <SettingsDataTable
                      columns={["Nav key", "Label", "Route", "Permissions", "Module / Flag", "Visibility", "Order override"]}
                      emptyMessage="No navigation items"
                      rows={items.map((item) => {
                        const state = editorState[item.nav_key] ?? { visibility: "default", orderOverride: "" };
                        return [
                          <code key="key" className="text-xs">{item.nav_key}</code>,
                          item.label,
                          <code key="route" className="text-xs">{item.route}</code>,
                          <span key="permissions" className="text-xs">{joinValues(item.required_any_permissions)}</span>,
                          <span key="module" className="text-xs">{[item.module_key, item.required_feature_flag].filter(Boolean).join(" / ") || "None"}</span>,
                          <select
                            key="visibility"
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={state.visibility}
                            onChange={(event) => updateEditorItem(item.nav_key, { visibility: event.target.value as RoleNavigationVisibility })}
                            disabled={editorDisabled}
                          >
                            {VISIBILITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>,
                          <Input
                            key="order"
                            type="number"
                            className="h-8 w-24 text-xs"
                            value={state.orderOverride}
                            onChange={(event) => updateEditorItem(item.nav_key, { orderOverride: event.target.value })}
                            placeholder={String(item.order)}
                            disabled={editorDisabled}
                          />,
                        ];
                      })}
                    />
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <SettingsEmptyState title="No registry items for this mode" description="Choose another mode or add items to the Core Navigation Registry." />
        )}
      </SettingsCard>

      <SettingsCard title="Role Config Preview" description="Config preview metadata from the backend. This is not the live sidebar.">
        {rolesQuery.isError ? (
          <SettingsEmptyState title="Role list unavailable" description={asErrorMessage(rolesQuery.error) ?? "Could not load roles for preview."} />
        ) : !selectedRole ? (
          <SettingsEmptyState title="Select a role" description="Choose a role and navigation mode to inspect stored config and preview metadata." />
        ) : previewQuery.isError ? (
          <SettingsEmptyState title="Preview unavailable" description={asErrorMessage(previewQuery.error) ?? "Could not load role navigation preview."} />
        ) : previewQuery.isLoading || roleConfigQuery.isLoading ? (
          <SettingsEmptyState title="Loading preview" description="Fetching role navigation config and preview metadata." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-md border bg-muted/20 p-3 xl:col-span-2">
                <div className="font-medium">{roleLabel(selectedRole)} | {modeLabel(roleConfigQuery.data?.mode ?? selectedMode)}</div>
                <div className="mt-1 text-muted-foreground">Stored config items: {roleConfigQuery.data?.items.length ?? 0} | Preview items: {previewQuery.data?.items.length ?? 0}</div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">Default: {previewCounts.default}</div>
              <div className="rounded-md border bg-muted/20 p-3">Hidden: {previewCounts.hidden}</div>
              <div className="rounded-md border bg-muted/20 p-3">Locked: {previewCounts.show_locked_if_denied}</div>
            </div>
            <SettingsDataTable
              columns={["Nav key", "Preview label", "Group", "Order", "Visibility", "Config override"]}
              emptyMessage="No preview items"
              rows={(previewQuery.data?.items ?? []).map((item) => [
                <code key="key" className="text-xs">{item.nav_key}</code>,
                item.preview_label,
                item.preview_group,
                item.preview_order,
                item.preview_visibility,
                item.config
                  ? [
                      item.config.label_override ? `label: ${item.config.label_override}` : null,
                      item.config.group_override ? `group: ${item.config.group_override}` : null,
                      item.config.order_override != null ? `order: ${item.config.order_override}` : null,
                    ].filter(Boolean).join(" | ") || "Visibility only"
                  : "Default registry behavior",
              ])}
            />
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Full Registry Items" description="Read-only registry inventory grouped by mode and group.">
        {registryQuery.isLoading ? (
          <SettingsEmptyState title="Loading registry" description="Fetching navigation registry items from Core." />
        ) : registryItems.length ? (
          <div className="space-y-5">
            {Object.entries(registryGroups).map(([mode, groups]) => (
              <section key={mode} className="space-y-3">
                <h2 className="text-sm font-semibold">{modeLabel(mode)}</h2>
                {Object.entries(groups).map(([group, items]) => (
                  <div key={`${mode}-${group}`} className="space-y-2">
                    <h3 className="text-xs font-medium uppercase text-muted-foreground">{group}</h3>
                    <SettingsDataTable
                      columns={["Nav key", "Label", "Route", "Order", "Module", "Feature flag", "Permissions", "Default", "Custom"]}
                      emptyMessage="No navigation items"
                      rows={items.map((item) => [
                        <code key="key" className="text-xs">{item.nav_key}</code>,
                        item.label,
                        <code key="route" className="text-xs">{item.route}</code>,
                        item.order,
                        item.module_key ?? "None",
                        item.required_feature_flag ?? "None",
                        <span key="permissions" className="text-xs">{joinValues(item.required_any_permissions)}</span>,
                        item.default_visible ? "Visible" : "Hidden",
                        item.is_customizable ? "Yes" : "No",
                      ])}
                    />
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <SettingsEmptyState title="No registry items" description="Core returned an empty navigation registry." />
        )}
      </SettingsCard>
    </SettingsLayout>
  );
}
