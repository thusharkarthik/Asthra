"use client";

import { useMemo, useState } from "react";
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
import { queryKeys } from "@/lib/queryKeys";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import type { FeatureFlagOverrideRecord, FeatureFlagRecord } from "@/types/core";

const NAV_CONFIG_FLAG = "core.navigation_config.enabled";
const PLATFORM_SCOPE = { scope_type: "platform", scope_id: null as number | null };

function asErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function statusBadgeClass(enabled: boolean) {
  return enabled
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300";
}

function categoryBadgeClass(category: string) {
  if (category === "core") return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300";
  if (category === "module") return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
}

function FlagBadge({ enabled }: { enabled: boolean }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(enabled)}`}>{enabled ? "Enabled" : "Disabled"}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(category)}`}>{category || "general"}</span>;
}

function findPlatformOverride(overrides: FeatureFlagOverrideRecord[], flagKey: string) {
  return overrides.find((override) => override.flag_key === flagKey && override.scope_type === "platform" && override.scope_id == null) ?? null;
}

function sortFeatureFlags(flags: FeatureFlagRecord[]) {
  return [...flags].sort((a, b) => {
    if (a.flag_key === NAV_CONFIG_FLAG) return -1;
    if (b.flag_key === NAV_CONFIG_FLAG) return 1;
    return `${a.category}:${a.flag_key}`.localeCompare(`${b.category}:${b.flag_key}`);
  });
}

export default function FeatureFlagsSettingsPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const { can, isLoading: contextLoading, isFetching: contextFetching } = usePlatformContext();
  const [search, setSearch] = useState("");

  const canViewFeatureFlags = can("settings.feature_flags.view") || can("settings.feature_flags.manage");
  const canManageFeatureFlags = can("settings.feature_flags.manage");

  const catalogQuery = useQuery({
    queryKey: ["settings", "feature-flags", "catalog"],
    queryFn: () => settingsApi.listFeatureFlags(accessToken ?? ""),
    enabled: Boolean(accessToken && canViewFeatureFlags),
    staleTime: 60_000,
    retry: false,
  });

  const effectiveQuery = useQuery({
    queryKey: ["settings", "feature-flags", "effective", PLATFORM_SCOPE.scope_type, PLATFORM_SCOPE.scope_id],
    queryFn: () => settingsApi.getEffectiveFeatureFlags(accessToken ?? "", PLATFORM_SCOPE),
    enabled: Boolean(accessToken && canViewFeatureFlags),
    staleTime: 30_000,
    retry: false,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ flagKey, enabled }: { flagKey: string; enabled: boolean }) => {
      if (!accessToken) throw new Error("You must be signed in to update feature flags.");
      return settingsApi.updateFeatureFlagOverride(accessToken, {
        flag_key: flagKey,
        scope_type: PLATFORM_SCOPE.scope_type,
        scope_id: PLATFORM_SCOPE.scope_id,
        enabled,
        reason: "Updated from Settings -> Feature Flags",
      });
    },
    onSuccess: async (_, variables) => {
      addToast({
        type: "success",
        title: "Feature flag updated",
        message: `${variables.flagKey} is now ${variables.enabled ? "enabled" : "disabled"} for platform scope.`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings", "feature-flags"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot }),
      ]);
    },
    onError: (error) => {
      addToast({ type: "error", title: "Feature flag update failed", message: asErrorMessage(error) ?? "Unable to update feature flag override." });
    },
  });

  const filteredFlags = useMemo(() => {
    const query = search.trim().toLowerCase();
    const flags = sortFeatureFlags(catalogQuery.data?.flags ?? []);
    if (!query) return flags;
    return flags.filter((flag) => [flag.flag_key, flag.name, flag.description ?? "", flag.category].join(" ").toLowerCase().includes(query));
  }, [catalogQuery.data?.flags, search]);

  if (contextLoading || contextFetching) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Feature Flags" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Feature Flags" description="Checking feature flag administration access." />
        <SettingsEmptyState title="Loading feature flag access" description="Resolving your platform permissions before loading feature flags." />
      </SettingsLayout>
    );
  }

  if (!canViewFeatureFlags) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Feature Flags" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Feature Flags" description="Inspect and manage Core feature flag overrides." />
        <SettingsEmptyState
          title="Feature flag access required"
          description="You need settings.feature_flags.view or settings.feature_flags.manage to inspect feature flags."
          action={<RequestAccessButton page="/settings/feature-flags" />}
        />
      </SettingsLayout>
    );
  }

  const catalog = catalogQuery.data;
  const effectiveFlags = effectiveQuery.data?.feature_flags ?? {};
  const platformOverrides = catalog?.overrides ?? [];
  const navFlag = catalog?.flags.find((flag) => flag.flag_key === NAV_CONFIG_FLAG) ?? null;
  const navFlagEffective = Boolean(effectiveFlags[NAV_CONFIG_FLAG] ?? navFlag?.default_enabled ?? false);

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Feature Flags" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="Feature Flags"
        description="Inspect Core feature availability and set platform-scope overrides. RBAC permissions still decide who can use enabled features."
      />

      <SettingsCard title="Navigation config QA flag" description="Use this flag for controlled Navigation Step 6 QA. It remains disabled by default and does not change seed data.">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Flag key</div>
            <div className="mt-1 font-mono text-xs font-semibold">{NAV_CONFIG_FLAG}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Default</div>
            <div className="mt-1"><FlagBadge enabled={Boolean(navFlag?.default_enabled)} /></div>
          </div>
          <div>
            <div className="text-muted-foreground">Effective</div>
            <div className="mt-1"><FlagBadge enabled={navFlagEffective} /></div>
          </div>
          <div>
            <div className="text-muted-foreground">Management</div>
            <div className="mt-1 font-semibold">{canManageFeatureFlags ? "Enabled for your permissions" : "Read-only"}</div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Feature flag catalog"
        description="Existing Core feature flags and platform override state. View-only users can inspect values but cannot toggle overrides."
        actions={<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search flags" className="w-64" />}
      >
        {catalogQuery.error ? (
          <SettingsEmptyState title="Feature flags unavailable" description={asErrorMessage(catalogQuery.error) ?? "Could not load feature flags."} />
        ) : catalogQuery.isLoading || effectiveQuery.isLoading ? (
          <SettingsEmptyState title="Loading feature flags" description="Fetching feature flag catalog and effective platform values." />
        ) : (
          <SettingsDataTable
            columns={["Flag", "Category", "Default", "Effective", "Platform override", "Action"]}
            emptyMessage="No feature flags"
            rows={filteredFlags.map((flag) => {
              const effective = Boolean(effectiveFlags[flag.flag_key] ?? flag.default_enabled);
              const override = findPlatformOverride(platformOverrides, flag.flag_key);
              const nextEnabled = !effective;
              const disabled = !flag.is_active || !canManageFeatureFlags || toggleMutation.isPending;
              return [
                <div key="flag" className="max-w-lg">
                  <div className="font-mono text-xs font-semibold">{flag.flag_key}</div>
                  <div className="mt-1 font-medium">{flag.name}</div>
                  {flag.description ? <div className="mt-1 text-xs text-muted-foreground">{flag.description}</div> : null}
                  {!flag.is_active ? <div className="mt-1 text-xs text-destructive">Inactive flags resolve disabled.</div> : null}
                </div>,
                <CategoryBadge key="category" category={flag.category} />,
                <FlagBadge key="default" enabled={flag.default_enabled} />,
                <FlagBadge key="effective" enabled={effective} />,
                <div key="override" className="text-sm">
                  {override ? (
                    <div>
                      <FlagBadge enabled={override.enabled} />
                      <div className="mt-1 text-xs text-muted-foreground">Platform override</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Default inherited</span>
                  )}
                </div>,
                <Button
                  key="action"
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => toggleMutation.mutate({ flagKey: flag.flag_key, enabled: nextEnabled })}
                  title={!canManageFeatureFlags ? "settings.feature_flags.manage is required" : undefined}
                >
                  {canManageFeatureFlags ? (nextEnabled ? "Enable" : "Disable") : "Read-only"}
                </Button>,
              ];
            })}
          />
        )}
      </SettingsCard>
    </SettingsLayout>
  );
}
