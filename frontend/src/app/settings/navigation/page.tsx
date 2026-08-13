"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BarChart3, Bell, BookOpen, Bot, Brain, Building2, Code2, EyeOff, FolderKanban, Home, Key, Layers, Lightbulb, Lock, MessageSquare, MousePointer2, Plug, ScrollText, Settings, Shield, SlidersHorizontal, Ticket, User, Users, UsersRound, Workflow, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { calculateNavigationPreviewItems, countNavigationPreviewStates } from "@/lib/navigation-config-preview";
import type { NavigationPreviewItem, NavigationPreviewState } from "@/lib/navigation-config-preview";
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

const PREVIEW_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  bar_chart3: BarChart3,
  bell: Bell,
  book_open: BookOpen,
  bot: Bot,
  brain: Brain,
  building2: Building2,
  code2: Code2,
  folder_kanban: FolderKanban,
  home: Home,
  key: Key,
  layers: Layers,
  lightbulb: Lightbulb,
  message_square: MessageSquare,
  plug: Plug,
  scroll_text: ScrollText,
  settings: Settings,
  shield: Shield,
  sliders_horizontal: SlidersHorizontal,
  ticket: Ticket,
  user: User,
  users: Users,
  users_round: UsersRound,
  workflow: Workflow,
  zap: Zap,
};

const MODULE_PREVIEW_ICON_MAP: Record<string, LucideIcon> = {
  platform_home: Home,
  organizations: Building2,
  platform_members: Users,
  access_control: Shield,
  audit_logs: ScrollText,
  api_keys: Key,
  platform_health: Activity,
  platform_settings: Settings,
  org_home: Home,
  workspaces: Layers,
  org_members: Users,
  teams: UsersRound,
  roles: Shield,
  org_settings: Building2,
  preferences: SlidersHorizontal,
  profile: User,
  home: Home,
  flow: Zap,
  discover: Lightbulb,
  docs: BookOpen,
  collab: MessageSquare,
  desk: Ticket,
  pulse: Activity,
  automation: Workflow,
  dev: Code2,
  connect: Plug,
  insights: BarChart3,
  memory: Brain,
  assistant: Bot,
  guard: Shield,
};

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

function getPreviewIcon(iconName: string | undefined, moduleKey: string | null | undefined) {
  if (iconName && PREVIEW_ICON_MAP[iconName]) return PREVIEW_ICON_MAP[iconName];
  if (moduleKey && MODULE_PREVIEW_ICON_MAP[moduleKey]) return MODULE_PREVIEW_ICON_MAP[moduleKey];
  return Home;
}

function previewStateBadgeClass(state: NavigationPreviewState) {
  if (state === "allowed") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  if (state === "locked") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300";
}

function groupNavigationPreviewItems(items: NavigationPreviewItem[]) {
  return items.reduce<Record<string, NavigationPreviewItem[]>>((groups, item) => {
    groups[item.group] ??= [];
    groups[item.group].push(item);
    return groups;
  }, {});
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
  const [showHiddenPreviewItems, setShowHiddenPreviewItems] = useState(false);

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

  const permissionsQuery = useQuery({
    queryKey: ["settings", "navigation", "permissions"],
    queryFn: () => settingsApi.listPermissions(accessToken ?? ""),
    enabled: Boolean(accessToken && canViewNavigation && selectedRoleId),
    staleTime: 60_000,
    retry: false,
  });

  const rolePermissionsQuery = useQuery({
    queryKey: ["settings", "navigation", "role-permissions", selectedRoleId],
    queryFn: () => settingsApi.listRolePermissions(accessToken ?? "", selectedRoleId ?? 0),
    enabled: Boolean(accessToken && canViewNavigation && selectedRoleId),
    staleTime: 60_000,
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
  const permissionCodeById = useMemo(() => new Map((permissionsQuery.data ?? []).map((permission) => [permission.id, permission.code])), [permissionsQuery.data]);
  const selectedRolePermissionCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const rolePermission of rolePermissionsQuery.data ?? []) {
      const code = permissionCodeById.get(rolePermission.permission_id);
      if (code) codes.add(code);
    }
    return codes;
  }, [permissionCodeById, rolePermissionsQuery.data]);
  const permissionEvaluationReady = permissionsQuery.isSuccess && rolePermissionsQuery.isSuccess;
  const permissionEvaluationUnavailable = permissionsQuery.isError || rolePermissionsQuery.isError;
  const sidebarPreviewItems = useMemo<NavigationPreviewItem[]>(() => calculateNavigationPreviewItems({
    previewItems: previewQuery.data?.items,
    modeItems,
    editorState,
    rolePermissionCodes: selectedRolePermissionCodes,
    featureFlags,
    permissionEvaluationReady,
    permissionEvaluationUnavailable,
  }), [editorState, featureFlags, modeItems, permissionEvaluationReady, permissionEvaluationUnavailable, previewQuery.data?.items, selectedRolePermissionCodes]);
  const visibleSidebarPreviewItems = sidebarPreviewItems.filter((item) => item.state !== "hidden");
  const hiddenSidebarPreviewItems = sidebarPreviewItems.filter((item) => item.state === "hidden");
  const sidebarPreviewGroups = useMemo(() => groupNavigationPreviewItems(visibleSidebarPreviewItems), [visibleSidebarPreviewItems]);
  const sidebarPreviewCounts = countNavigationPreviewStates(sidebarPreviewItems);
  const sidebarPreviewLoading = previewQuery.isLoading || roleConfigQuery.isLoading || permissionsQuery.isLoading || rolePermissionsQuery.isLoading;

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

      <SettingsCard title="Sidebar Preview" description="Preview how the selected role and mode may experience navigation. This does not affect the live sidebar.">
        {rolesQuery.isError ? (
          <SettingsEmptyState title="Role list unavailable" description={asErrorMessage(rolesQuery.error) ?? "Could not load roles for preview."} />
        ) : !selectedRole ? (
          <SettingsEmptyState title="Select a role" description="Choose a role and navigation mode to preview simulated sidebar metadata." />
        ) : registryQuery.isLoading || sidebarPreviewLoading ? (
          <SettingsEmptyState title="Loading sidebar preview" description="Fetching registry, saved role navigation config, and role permissions." />
        ) : previewQuery.isError ? (
          <SettingsEmptyState title="Sidebar preview unavailable" description={asErrorMessage(previewQuery.error) ?? "Could not load role navigation preview metadata."} />
        ) : (
          <div className="space-y-4">
            <section className="rounded-lg border border-cyan-300/60 bg-cyan-50 p-3 text-sm text-cyan-950 dark:border-cyan-700/60 dark:bg-cyan-950/30 dark:text-cyan-100">
              <div className="font-semibold">Preview only. The live sidebar is unchanged until `core.navigation_config.enabled` is enabled in a later step.</div>
              <p className="mt-1">This panel simulates saved config plus current editor state for {roleLabel(selectedRole)} in {modeLabel(normalizedSelectedMode)} mode.</p>
              {isDirty ? <span className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">Preview includes unsaved changes</span> : null}
            </section>

            {permissionEvaluationUnavailable ? (
              <section className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                Permission evaluation is approximate; live enforcement still uses backend effective permissions.
              </section>
            ) : null}

            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border bg-muted/20 p-3">Allowed: <span className="font-semibold text-emerald-600">{sidebarPreviewCounts.allowed}</span></div>
              <div className="rounded-md border bg-muted/20 p-3">Locked: <span className="font-semibold text-amber-600">{sidebarPreviewCounts.locked}</span></div>
              <div className="rounded-md border bg-muted/20 p-3">Hidden: <span className="font-semibold text-muted-foreground">{sidebarPreviewCounts.hidden}</span></div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <aside className="rounded-lg border bg-background p-3 shadow-sm">
                <div className="mb-3 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  {modeLabel(normalizedSelectedMode)} Preview
                </div>
                {visibleSidebarPreviewItems.length ? (
                  <nav aria-label="Simulated sidebar preview" className="space-y-4">
                    {Object.entries(sidebarPreviewGroups).map(([group, items]) => (
                      <section key={group} className="space-y-1">
                        <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</div>
                        {items.map((item) => {
                          const Icon = getPreviewIcon(item.icon, item.moduleKey);
                          const isLocked = item.state === "locked";
                          return (
                            <button
                              key={item.navKey}
                              type="button"
                              className={`flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                isLocked
                                  ? "cursor-not-allowed border border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                              onClick={(event) => event.preventDefault()}
                              aria-disabled={isLocked}
                              title={isLocked ? `Restricted: ${item.missingPermissions.join(", ") || item.reason}` : item.route}
                            >
                              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              {isLocked ? <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <MousePointer2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                            </button>
                          );
                        })}
                      </section>
                    ))}
                  </nav>
                ) : (
                  <SettingsEmptyState title="No visible preview items" description="All selected mode items are hidden by role config, permissions, or feature availability." />
                )}
              </aside>

              <div className="space-y-3">
                <SettingsDataTable
                  columns={["Item", "State", "Config", "Route", "Required permissions", "Reason"]}
                  emptyMessage="No preview items"
                  rows={visibleSidebarPreviewItems.map((item) => {
                    const Icon = getPreviewIcon(item.icon, item.moduleKey);
                    return [
                      <span key="item" className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>,
                      <span key="state" className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${previewStateBadgeClass(item.state)}`}>{item.state === "allowed" ? "Allowed" : "Locked"}</span>,
                      item.configSource,
                      <code key="route" className="text-xs">{item.route}</code>,
                      <span key="permissions" className="text-xs">{joinValues(item.requiredPermissions)}</span>,
                      <span key="reason" className="text-xs text-muted-foreground">{item.reason}{item.missingPermissions.length ? ` Missing: ${item.missingPermissions.join(", ")}` : ""}</span>,
                    ];
                  })}
                />

                <div className="rounded-md border bg-muted/20 p-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-sm font-medium"
                    onClick={() => setShowHiddenPreviewItems((value) => !value)}
                  >
                    <span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4" aria-hidden="true" /> Hidden items ({hiddenSidebarPreviewItems.length})</span>
                    <span className="text-xs text-muted-foreground">{showHiddenPreviewItems ? "Hide details" : "Show details"}</span>
                  </button>
                  {showHiddenPreviewItems ? (
                    <div className="mt-3">
                      <SettingsDataTable
                        columns={["Item", "Config", "Route", "Reason"]}
                        emptyMessage="No hidden items"
                        rows={hiddenSidebarPreviewItems.map((item) => [
                          item.label,
                          item.configSource,
                          <code key="route" className="text-xs">{item.route}</code>,
                          <span key="reason" className="text-xs text-muted-foreground">{item.reason}{item.missingPermissions.length ? ` Missing: ${item.missingPermissions.join(", ")}` : ""}</span>,
                        ])}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
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
