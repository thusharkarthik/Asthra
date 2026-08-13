"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequestAccessButton } from "@/app/settings/layout";
import {
  SettingsCard,
  SettingsDataTable,
  SettingsEmptyState,
  SettingsLayout,
  SettingsSectionHeader,
} from "@/components/settings/settings-components";
import { usePlatformContext } from "@/context/platformContext";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import type { NavigationRegistryItem, RoleRecord } from "@/types/core";

const NAV_CONFIG_FLAG = "core.navigation_config.enabled";
const NAVIGATION_MODES = [
  { value: "platform", label: "Platform" },
  { value: "organization", label: "Organization" },
  { value: "work", label: "Work" },
  { value: "settings", label: "Settings" },
  { value: "personal", label: "Personal" },
] as const;

function asErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function joinValues(values: string[] | undefined, empty = "None") {
  return values?.length ? values.join(", ") : empty;
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

export default function NavigationSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { can, isLoading: contextLoading, isFetching: contextFetching, featureFlags, isFeatureEnabled } = usePlatformContext();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<(typeof NAVIGATION_MODES)[number]["value"]>("platform");

  const canViewNavigation = can("settings.navigation.view") || can("settings.navigation.manage");
  const navigationConfigEnabled = isFeatureEnabled(NAV_CONFIG_FLAG);

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
        description="Inspect navigation registry items and role-based navigation configuration. Live sidebar application is disabled until the navigation configuration feature flag is enabled."
      />

      <SettingsCard title="Status" description="Step 3 is an inspection layer only. These settings do not affect the live sidebar yet.">
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
            <div className="text-muted-foreground">Feature Flag</div>
            <div className="mt-1 font-semibold">{NAV_CONFIG_FLAG} = {String(featureFlags[NAV_CONFIG_FLAG] ?? navigationConfigEnabled)}</div>
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

      <SettingsCard title="Registry items" description="Grouped by navigation mode and registry group. This table is read-only.">
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

      <SettingsCard title="Role Config Preview" description="Inspect stored role navigation config and backend preview metadata. Saving/editing is deferred to Step 4.">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Role</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedRoleId ?? ""}
              onChange={(event) => setSelectedRoleId(event.target.value ? Number(event.target.value) : null)}
              disabled={rolesQuery.isLoading || !rolesQuery.data?.length}
            >
              <option value="">Select role</option>
              {(rolesQuery.data ?? []).map((role) => (
                <option key={role.id} value={role.id}>{roleLabel(role)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Mode</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedMode}
              onChange={(event) => setSelectedMode(event.target.value as typeof selectedMode)}
            >
              {NAVIGATION_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </label>
        </div>

        {rolesQuery.isError ? (
          <SettingsEmptyState title="Role list unavailable" description={asErrorMessage(rolesQuery.error) ?? "Could not load roles for preview."} />
        ) : !selectedRole ? (
          <SettingsEmptyState title="Select a role" description="Choose a role and navigation mode to inspect stored config and preview metadata." />
        ) : roleConfigQuery.isError || previewQuery.isError ? (
          <SettingsEmptyState
            title="Preview unavailable"
            description={asErrorMessage(roleConfigQuery.error ?? previewQuery.error) ?? "Could not load role navigation preview."}
          />
        ) : previewQuery.isLoading || roleConfigQuery.isLoading ? (
          <SettingsEmptyState title="Loading preview" description="Fetching role navigation config and preview metadata." />
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-medium">{roleLabel(selectedRole)} | {modeLabel(roleConfigQuery.data?.mode ?? selectedMode)}</div>
              <div className="mt-1 text-muted-foreground">
                Stored config items: {roleConfigQuery.data?.items.length ?? 0} | Preview items: {previewQuery.data?.items.length ?? 0}
              </div>
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
    </SettingsLayout>
  );
}
