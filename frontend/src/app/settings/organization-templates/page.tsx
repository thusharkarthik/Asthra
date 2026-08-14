"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { usePlatformContext } from "@/context/platformContext";
import { can as hasPermission } from "@/lib/permissions";
import { queryKeys } from "@/lib/queryKeys";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import type { Organization, OrganizationTemplateReport } from "@/types/core";

function asErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function templateStats(template: { workspaces: Array<{ projects: unknown[]; teams: unknown[] }> }) {
  const projects = template.workspaces.reduce((count, workspace) => count + workspace.projects.length, 0);
  const teams = template.workspaces.reduce((count, workspace) => count + workspace.teams.length, 0);
  return `${template.workspaces.length} workspaces / ${projects} projects / ${teams} teams`;
}

function ReportSummary({ report }: { report: OrganizationTemplateReport }) {
  const summary = report.summary;
  return (
    <SettingsCard title="Last template report" description={`Result for ${report.template_key}. Existing matching records are skipped by design.`}>
      <div className="grid gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
        <div><div className="text-muted-foreground">Workspaces</div><div className="mt-1 font-semibold">{summary.workspaces_to_create}</div></div>
        <div><div className="text-muted-foreground">Projects</div><div className="mt-1 font-semibold">{summary.projects_to_create}</div></div>
        <div><div className="text-muted-foreground">Teams</div><div className="mt-1 font-semibold">{summary.teams_to_create}</div></div>
        <div><div className="text-muted-foreground">Feature flags</div><div className="mt-1 font-semibold">{summary.feature_flags_to_apply}</div></div>
        <div><div className="text-muted-foreground">Configuration</div><div className="mt-1 font-semibold">{summary.configuration_values_to_apply}</div></div>
        <div><div className="text-muted-foreground">Skipped</div><div className="mt-1 font-semibold">{summary.skipped_existing}</div></div>
      </div>
      {report.warnings.length ? <p className="mt-4 text-sm text-amber-700">{report.warnings.join(" ")}</p> : null}
      <div className="mt-4">
        <SettingsDataTable
          columns={["Action", "Name", "Status", "Scope"]}
          rows={report.actions.slice(0, 12).map((action) => [
            action.action_type,
            <div key={`${action.action_type}-${action.name}`}>
              <div className="font-medium">{action.name}</div>
              {action.detail ? <div className="text-xs text-muted-foreground">{action.detail}</div> : null}
            </div>,
            action.status,
            [action.scope_type, action.scope_id].filter(Boolean).join(" #") || "-",
          ])}
          emptyMessage="No template actions returned"
        />
      </div>
      {report.actions.length > 12 ? <p className="mt-3 text-xs text-muted-foreground">Showing first 12 of {report.actions.length} actions.</p> : null}
    </SettingsCard>
  );
}

export default function OrganizationTemplatesSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const { can, isLoading: contextLoading, isFetching: contextFetching } = usePlatformContext();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [lastReport, setLastReport] = useState<OrganizationTemplateReport | null>(null);

  const canViewPlatformTemplates = can("settings.organization_templates.view");

  const organizationsQuery = useQuery({
    queryKey: [...queryKeys.organizations.list, "organization-templates"],
    queryFn: () => settingsApi.listOrganizations(accessToken ?? "", { include_inactive: true }),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const organizations = useMemo(
    () => (organizationsQuery.data ?? []).filter((organization: Organization) => organization.is_active !== false),
    [organizationsQuery.data],
  );

  useEffect(() => {
    if (selectedOrganizationId || !organizations.length) return;
    setSelectedOrganizationId(organizations[0].id);
  }, [organizations, selectedOrganizationId]);

  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;

  const scopedPermissionsQuery = useQuery({
    queryKey: queryKeys.permissions.current(selectedOrganizationId, null, null),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", { org_id: selectedOrganizationId }),
    enabled: Boolean(accessToken && selectedOrganizationId),
    staleTime: 30_000,
  });

  const scopedPermissionCodes = scopedPermissionsQuery.data?.permission_codes ?? [];
  const canViewSelectedOrganizationTemplates = hasPermission(scopedPermissionCodes, "settings.organization_templates.view") || hasPermission(scopedPermissionCodes, "settings.organization_templates.apply");
  const canApplySelectedOrganizationTemplates = hasPermission(scopedPermissionCodes, "settings.organization_templates.apply");
  const canLoadCatalog = canViewPlatformTemplates || canViewSelectedOrganizationTemplates;
  const catalogOrganizationId = selectedOrganizationId ?? null;

  const catalogQuery = useQuery({
    queryKey: ["settings", "organization-templates", catalogOrganizationId ?? "platform"],
    queryFn: () => settingsApi.listOrganizationTemplates(accessToken ?? "", catalogOrganizationId),
    enabled: Boolean(accessToken && canLoadCatalog && (catalogOrganizationId || canViewPlatformTemplates)),
    staleTime: 60_000,
    retry: false,
  });

  const previewMutation = useMutation({
    mutationFn: (templateKey: string) => {
      if (!selectedOrganizationId) throw new Error("Select an organization before previewing a template.");
      return settingsApi.previewOrganizationTemplate(accessToken ?? "", templateKey, selectedOrganizationId);
    },
    onSuccess: (report) => {
      setLastReport(report);
      addToast({ type: "success", title: "Template preview ready", message: "Preview completed without changing organization records." });
    },
    onError: (error) => addToast({ type: "error", title: "Template preview failed", message: asErrorMessage(error) ?? "Unable to preview organization template." }),
  });

  const applyMutation = useMutation({
    mutationFn: (templateKey: string) => {
      if (!selectedOrganizationId) throw new Error("Select an organization before applying a template.");
      return settingsApi.applyOrganizationTemplate(accessToken ?? "", templateKey, selectedOrganizationId);
    },
    onSuccess: async (report) => {
      setLastReport(report);
      addToast({
        type: "success",
        title: "Organization template applied",
        message: `${report.summary.workspaces_to_create} workspaces, ${report.summary.projects_to_create} projects, and ${report.summary.teams_to_create} teams were processed.`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings", "organization-templates", selectedOrganizationId ?? "platform"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot }),
      ]);
    },
    onError: (error) => addToast({ type: "error", title: "Template apply failed", message: asErrorMessage(error) ?? "Unable to apply organization template." }),
  });

  if (contextLoading || contextFetching || organizationsQuery.isLoading || scopedPermissionsQuery.isLoading) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organization Templates" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Organization Templates" description="Checking organization template access." />
        <SettingsEmptyState title="Loading organization template access" description="Resolving your platform and organization permissions before loading templates." />
      </SettingsLayout>
    );
  }

  if (!canLoadCatalog) {
    return (
      <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organization Templates" }]} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Organization Templates" description="Preview and apply Core-owned organization setup templates." />
        <SettingsEmptyState
          title="Organization template access required"
          description="You need settings.organization_templates.view for platform scope or for one of your organizations."
          action={<RequestAccessButton page="/settings/organization-templates" />}
        />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organization Templates" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="Organization Templates"
        description="Inspect and apply Core-owned setup templates. Templates create Core workspaces, projects, teams, feature flag overrides, and configuration values only."
      />

      <SettingsCard title="Template target" description="Choose the organization that preview/apply actions should target. Organization-scoped catalog requests include this organization id.">
        {organizations.length ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Organization</span>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={selectedOrganizationId ?? ""}
                onChange={(event) => {
                  setLastReport(null);
                  setSelectedOrganizationId(Number(event.target.value));
                }}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            </label>
            {selectedOrganization ? <Link className="text-sm text-primary hover:underline" href={`/settings/organizations/${selectedOrganization.id}`}>Open organization detail</Link> : null}
          </div>
        ) : (
          <SettingsEmptyState title="No organizations available" description="Create an organization before previewing or applying templates." action={<Link className="text-primary hover:underline" href="/settings/organizations">Open Organizations</Link>} />
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          {selectedOrganization
            ? canApplySelectedOrganizationTemplates ? "You can preview and apply templates for this organization." : "You can inspect templates for this organization. Applying requires settings.organization_templates.apply."
            : canViewPlatformTemplates ? "Platform catalog access is available. Select an organization before previewing or applying." : "Select an organization to resolve organization-scoped template permissions."}
        </div>
      </SettingsCard>

      <SettingsCard title="Template catalog" description="Preview is read-only. Apply is conservative and skips existing matching records.">
        {catalogQuery.error ? (
          <SettingsEmptyState title="Organization templates unavailable" description={asErrorMessage(catalogQuery.error) ?? "Could not load organization templates."} />
        ) : catalogQuery.isLoading ? (
          <SettingsEmptyState title="Loading organization templates" description="Fetching template catalog for the selected scope." />
        ) : (
          <SettingsDataTable
            columns={["Template", "Recommended for", "Creates", "Actions"]}
            rows={(catalogQuery.data?.templates ?? []).map((template) => [
              <div key={`${template.template_key}-name`} className="max-w-lg">
                <div className="font-medium">{template.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{template.description}</div>
                <div className="mt-2 font-mono text-xs text-muted-foreground">{template.template_key}</div>
              </div>,
              <div key={`${template.template_key}-recommended`} className="text-sm text-muted-foreground">{template.recommended_for.join(", ") || template.category}</div>,
              templateStats(template),
              <div key={`${template.template_key}-actions`} className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={!selectedOrganizationId || previewMutation.isPending} onClick={() => previewMutation.mutate(template.template_key)}>
                  {previewMutation.isPending ? "Previewing..." : "Preview"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedOrganizationId || !canApplySelectedOrganizationTemplates || applyMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Apply the ${template.name} template to ${selectedOrganization?.name ?? "this organization"}? Existing matching records will be skipped.`)) {
                      applyMutation.mutate(template.template_key);
                    }
                  }}
                >
                  {applyMutation.isPending ? "Applying..." : "Apply"}
                </Button>
              </div>,
            ])}
            emptyMessage="No organization templates available"
          />
        )}
      </SettingsCard>

      {lastReport ? <ReportSummary report={lastReport} /> : null}
    </SettingsLayout>
  );
}
