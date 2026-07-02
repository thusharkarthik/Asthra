"use client";

import { type FormEvent, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { usePlatformContext } from "@/context/platformContext";
import { useSettingsAuthority } from "@/app/settings/layout";
import { settingsApi } from "@/services/api/settings-api";
import type { OrgHealthRecord, OrgSettingsRecord } from "@/services/api/settings-api";
import {
  SettingsLayout,
  SettingsCard,
  SettingsDangerZone,
  SettingsEmptyState,
  FormField,
} from "@/components/settings/settings-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyModuleState } from "@/components/layout/ui-states";
import { RequestAccessButton } from "@/app/settings/layout";
import { hasHierarchicalPermission } from "@/lib/settings-permissions";

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

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Media & Entertainment", "Consulting", "Non-profit", "Other",
];

const STATUS_COLORS: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  needs_attention: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

function OrgHealthPanel({ healthQuery }: { healthQuery: UseQueryResult<OrgHealthRecord> }) {
  const { data, isLoading, isError } = healthQuery;

  return (
    <SettingsCard title="Health Score">
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading health score…</p>
      )}
      {isError && (
        <p className="text-sm text-muted-foreground">Unable to load health score.</p>
      )}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{data.score}<span className="text-lg text-muted-foreground">%</span></span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[data.status] ?? ""}`}>
              {STATUS_LABELS[data.status] ?? data.status}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {data.checks.filter((c) => c.passed).length}/{data.checks.length} checks passing
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.checks.map((check) => (
              <div
                key={check.key}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${check.passed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-border bg-muted/30"}`}
              >
                <span className={`mt-0.5 shrink-0 text-base leading-none ${check.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {check.passed ? "✓" : "○"}
                </span>
                <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
              </div>
            ))}
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Last checked: {new Date(data.checked_at).toLocaleString()}
          </p>
        </div>
      )}
    </SettingsCard>
  );
}

function OrgTabs({
  orgId,
  active,
  hiddenTabs = new Set<string>(),
}: {
  orgId: number;
  active: string;
  hiddenTabs?: Set<string>;
}) {
  const tabs = [
    { key: "overview", label: "Overview", href: `/settings/organizations/${orgId}` },
    { key: "members", label: "Members", href: `/settings/organizations/${orgId}/members` },
    { key: "workspaces", label: "Workspaces", href: `/settings/organizations/${orgId}/workspaces` },
    { key: "roles", label: "Roles", href: `/settings/organizations/${orgId}/roles` },
    { key: "permissions", label: "Permissions", href: `/settings/organizations/${orgId}/permissions` },
  ].filter((tab) => !hiddenTabs.has(tab.key));
  return (
    <nav className="flex gap-1 border-b pb-0">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default function OrganizationSettingsPage() {
  const params = useParams<{ id: string }>();
  const orgId = Number(params.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const { organizations, workspaces, permissions, can, isLoading: ctxIsLoading } = usePlatformContext();
  const { authorityLevel } = useSettingsAuthority();

  const isSuperuser = Boolean(currentUser?.is_superuser);
  const isAdminUser = isSuperuser || authorityLevel === "platform" || authorityLevel === "org";
  const canViewOrgPage = isAdminUser || hasHierarchicalPermission(can, "settings.organization.view");
  const isAuthorized =
    isAdminUser ||
    hasHierarchicalPermission(can, "settings.organization.view", "settings.organization.edit");

  const org = organizations.find((o) => o.id === orgId);
  const scopedWorkspaces = workspaces.filter((w) => w.organization_id === orgId);

  const settingsQuery = useQuery({
    queryKey: ["org-settings", orgId],
    queryFn: () => settingsApi.getOrganizationSettings(accessToken ?? "", orgId),
    enabled: Boolean(accessToken && orgId),
  });

  const canViewHealth = Boolean(
    currentUser?.is_superuser ||
      permissions?.roles?.some((r) => ["platform_owner", "platform_admin", "organization_owner", "organization_admin"].includes(r.key))
  );

  const healthQuery = useQuery({
    queryKey: ["org-health", orgId],
    queryFn: () => settingsApi.getOrgHealth(accessToken ?? "", orgId),
    enabled: Boolean(accessToken && orgId && canViewHealth),
    staleTime: 5 * 60 * 1000,
  });

  const s = settingsQuery.data;

  // General form state
  const [orgName, setOrgName] = useState(org?.name ?? "");
  const [orgDesc, setOrgDesc] = useState(org?.description ?? "");

  useEffect(() => {
    if (org) {
      setOrgName(org.name);
      setOrgDesc(org.description ?? "");
    }
  }, [org]);

  // Settings form state
  const [domain, setDomain] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [logoValid, setLogoValid] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);

  useEffect(() => {
    if (s) {
      setDomain(s.domain ?? "");
      setWebsiteUrl(s.website_url ?? "");
      setIndustry(s.industry ?? "");
      setLogoUrl(s.logo_url ?? "");
      setPrimaryColor(s.primary_color ?? "#000000");
      setTimezone(s.default_timezone ?? "UTC");
      setLocale(s.locale ?? "en");
      setDateFormat(s.date_format ?? "YYYY-MM-DD");
      setLogoValid(false);
    }
  }, [s]);

  const updateOrgMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      settingsApi.updateOrganization(accessToken ?? "", orgId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      addToast({ type: "success", title: "Saved", message: "Organization details updated." });
    },
    onError: () => addToast({ type: "error", title: "Save failed", message: "Could not update organization." }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<OrgSettingsRecord>) =>
      settingsApi.updateOrganizationSettings(accessToken ?? "", orgId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["org-settings", orgId] });
      addToast({ type: "success", title: "Saved", message: "Organization settings updated." });
    },
    onError: () => addToast({ type: "error", title: "Save failed", message: "Could not update settings." }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateOrganization(accessToken ?? "", orgId, { is_active: false }),
    onSuccess: async () => {
      setDeactivateConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      addToast({ type: "success", title: "Deactivated", message: "Organization has been deactivated." });
    },
    onError: () => addToast({ type: "error", title: "Failed", message: "Could not deactivate organization." }),
  });

  function handleSaveGeneral(e: FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    updateOrgMutation.mutate({ name: orgName.trim(), description: orgDesc.trim() || undefined });
  }

  function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    updateSettingsMutation.mutate({
      domain: domain.trim() || null,
      website_url: websiteUrl.trim() || null,
      industry: industry || null,
      logo_url: logoUrl.trim() || null,
      primary_color: primaryColor || null,
      default_timezone: timezone,
      locale: locale,
      date_format: dateFormat,
    });
  }

  const breadcrumbs = [
    { label: "Settings", href: "/settings" },
    { label: "Organizations", href: "/settings/organizations" },
    { label: org?.name ?? "Organization" },
  ];

  if (!isAdminUser && ctxIsLoading) return null;

  if (!canViewOrgPage) {
    return (
      <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings/organizations" backLabel="Back to Organizations">
        <SettingsEmptyState
          title="Access Restricted"
          description="You don't have permission to view this organization. Contact your Organization Admin to request access."
          action={<RequestAccessButton page={`/settings/organizations/${orgId}`} />}
        />
      </SettingsLayout>
    );
  }

  if (!org && organizations.length > 0) {
    return (
      <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings/organizations" backLabel="Back to Organizations">
        <EmptyModuleState title="Organization not found" description="This organization was not found or you don't have access." />
      </SettingsLayout>
    );
  }

  const displayOrg = org ?? { id: orgId, name: "Organization", description: null, is_active: true, slug: "" };

  const canViewMembersTab = isAdminUser || hasHierarchicalPermission(can, "settings.organization.view", "settings.member.view");
  const canViewWorkspacesTab = isAdminUser || hasHierarchicalPermission(can, "settings.organization.view", "settings.workspace.view");
  const hiddenTabs = new Set<string>([
    ...(!canViewMembersTab ? ["members"] : []),
    ...(!canViewWorkspacesTab ? ["workspaces"] : []),
  ]);

  return (
    <SettingsLayout
      breadcrumbs={breadcrumbs}
      backHref="/settings/organizations"
      backLabel="Back to Organizations"
      parentContext={{
        label: "Organization",
        title: displayOrg.name,
        description: displayOrg.description ?? undefined,
        meta: `Status: ${displayOrg.is_active === false ? "Inactive" : "Active"}`,
      }}
    >
      <OrgTabs orgId={orgId} active="overview" hiddenTabs={hiddenTabs} />

      {/* Overview card */}
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Slug</dt><dd>{displayOrg.slug ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{displayOrg.is_active === false ? "Inactive" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Workspaces</dt><dd>{scopedWorkspaces.length}</dd></div>
          {s?.domain && <div><dt className="text-muted-foreground">Domain</dt><dd>{s.domain}</dd></div>}
          {s?.website_url && (
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd><a href={s.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{s.website_url}</a></dd>
            </div>
          )}
          {s?.industry && <div><dt className="text-muted-foreground">Industry</dt><dd>{s.industry}</dd></div>}
        </dl>
      </SettingsCard>

      {/* Health Score panel */}
      {canViewHealth && (
        <OrgHealthPanel healthQuery={healthQuery} />
      )}

      {/* General settings */}
      <SettingsCard title="General" description="Name and description shown across Asthra.">
        <form className="space-y-4" onSubmit={handleSaveGeneral}>
          <FormField label="Organization Name" required>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!isAuthorized} />
          </FormField>
          <FormField label="Description">
            <textarea
              value={orgDesc}
              onChange={(e) => setOrgDesc(e.target.value)}
              className={DESCRIPTION_CLASS}
              rows={3}
              disabled={!isAuthorized}
            />
          </FormField>
          {isAuthorized && (
            <div className="flex justify-end">
              <Button type="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? "Saving…" : "Save General"}
              </Button>
            </div>
          )}
        </form>
      </SettingsCard>

      {/* Identity & Contact */}
      <form className="space-y-6" onSubmit={handleSaveSettings}>
        <SettingsCard title="Identity & Contact" description="Domain, website, and industry help identify your organization.">
          <div className="space-y-4">
            <FormField label="Domain" helpText="e.g. mycompany.com — used for identification only">
              <Input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="mycompany.com"
                disabled={!isAuthorized}
              />
            </FormField>
            <FormField label="Website URL">
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mycompany.com"
                disabled={!isAuthorized}
              />
            </FormField>
            <FormField label="Industry">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={SELECT_CLASS}
                disabled={!isAuthorized}
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </FormField>
          </div>
        </SettingsCard>

        <SettingsCard title="Branding" description="Customize how your organization appears.">
          <div className="space-y-4">
            <FormField label="Logo URL" helpText="Paste a public image URL — file upload via Media service is coming soon">
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoValid(false);
                }}
                placeholder="https://cdn.example.com/logo.png"
                disabled={!isAuthorized}
              />
            </FormField>
            {logoUrl && (
              <div className="flex items-center gap-3">
                {logoValid && (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 w-12 rounded object-contain border"
                    onLoad={() => setLogoValid(true)}
                    onError={() => setLogoValid(false)}
                  />
                )}
                {!logoValid && (
                  <img
                    src={logoUrl}
                    alt=""
                    className="hidden"
                    onLoad={() => setLogoValid(true)}
                    onError={() => setLogoValid(false)}
                  />
                )}
                {!logoValid && (
                  <span className="text-xs text-muted-foreground">Enter a valid image URL to see preview</span>
                )}
              </div>
            )}
            <FormField label="Primary Color" helpText="Brand color as hex code">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer disabled:cursor-not-allowed"
                  disabled={!isAuthorized}
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                  className="w-32"
                  disabled={!isAuthorized}
                />
              </div>
            </FormField>
          </div>
        </SettingsCard>

        <SettingsCard title="Localization" description="Default timezone, language, and date format for your organization.">
          <div className="space-y-4">
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
            <FormField label="Date Format">
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className={SELECT_CLASS}
                disabled={!isAuthorized}
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df.value} value={df.value}>{df.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </SettingsCard>

        {isAuthorized && (
          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        )}
      </form>

      {/* Danger Zone */}
      {(isSuperuser || permissions?.roles?.some((r) => r.key === "organization_owner")) && (
        <SettingsDangerZone
          description="Deactivating the organization will suspend access for all members. This can be reversed by a platform admin."
          actions={
            deactivateConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-destructive">Are you sure?</span>
                <Button
                  className="bg-destructive text-destructive-foreground hover:opacity-90"
                  onClick={() => deactivateMutation.mutate()}
                  disabled={deactivateMutation.isPending || displayOrg.is_active === false}
                >
                  {deactivateMutation.isPending ? "Deactivating…" : "Yes, Deactivate"}
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
                disabled={displayOrg.is_active === false}
              >
                {displayOrg.is_active === false ? "Already Inactive" : "Deactivate Organization"}
              </Button>
            )
          }
        />
      )}
    </SettingsLayout>
  );
}
