"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { OrganizationsView } from "@/components/settings/settings-admin-views";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformContext } from "@/context/platformContext";
import { useSettingsAuthority, RequestAccessButton } from "@/app/settings/layout";
import { settingsApi } from "@/services/api/settings-api";
import { SettingsEmptyState, SettingsLayout } from "@/components/settings/settings-components";
import { hasHierarchicalPermission } from "@/lib/settings-permissions";
import type { OrgHealthRecord } from "@/services/api/settings-api";
import { usePagePermissions } from "@/hooks/use-page-permissions";

function healthBadge(health: OrgHealthRecord | undefined, loading: boolean) {
  if (loading) return <span className="text-xs text-muted-foreground">Loading…</span>;
  if (!health) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    excellent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    needs_attention: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  const labels: Record<string, string> = {
    excellent: "Excellent",
    good: "Good",
    needs_attention: "Needs Attention",
    critical: "Critical",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colors[health.status] ?? ""}`}>
      {health.score}% · {labels[health.status] ?? health.status}
    </span>
  );
}

function OrgHealthSummary({ canViewHealth }: { canViewHealth: boolean }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { organizations } = usePlatformContext();

  const healthResults = useQueries({
    queries: organizations.map((org) => ({
      queryKey: ["org-health", org.id],
      queryFn: () => settingsApi.getOrgHealth(accessToken ?? "", org.id),
      enabled: Boolean(accessToken && canViewHealth),
      staleTime: 5 * 60 * 1000,
    })),
  });

  if (!canViewHealth || organizations.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Organization Health</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          10-point checklist score per organization. Visible to platform admins and superusers only.
        </p>
      </div>
      <div className="divide-y">
        {organizations.map((org, i) => {
          const q = healthResults[i];
          return (
            <div key={org.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/settings/organizations/${org.id}`}
                  className="truncate text-sm font-medium text-foreground hover:underline"
                >
                  {org.name}
                </Link>
                {q?.data && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {q.data.checks
                      .filter((c) => !c.passed)
                      .map((c) => (
                        <span key={c.key} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {c.label}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <div className="ml-4 shrink-0">{healthBadge(q?.data, q?.isLoading ?? false)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrganizationsSettingsPage() {
  usePagePermissions();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSuperuser = Boolean(currentUser?.is_superuser);
  const { permissions, can, isLoading: ctxIsLoading } = usePlatformContext();
  const { authorityLevel } = useSettingsAuthority();

  // Admin users bypass all hierarchy checks.
  const isAdminUser = isSuperuser || authorityLevel === "platform" || authorityLevel === "org";

  // Level 1: settings.organization.view is the root permission for all org pages.
  const canViewOrganizations = isAdminUser || hasHierarchicalPermission(can, "settings.organization.view");

  const canViewHealth = Boolean(
    isSuperuser ||
      permissions?.roles?.some((r) => ["platform_owner", "platform_admin"].includes(r.key))
  );

  // Hold rendering for non-admin users until platform context settles with org-scoped permissions.
  if (!isAdminUser && ctxIsLoading) return null;

  if (!canViewOrganizations) {
    return (
      <SettingsLayout
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organizations" }]}
        backHref="/settings"
        backLabel="Back to Settings"
      >
        <SettingsEmptyState
          title="Access Restricted"
          description="You don't have permission to view organizations. Contact your Organization Admin to request access."
          action={<RequestAccessButton page="/settings/organizations" />}
        />
      </SettingsLayout>
    );
  }

  return (
    <>
      <OrganizationsView />
      <OrgHealthSummary canViewHealth={canViewHealth} />
    </>
  );
}
