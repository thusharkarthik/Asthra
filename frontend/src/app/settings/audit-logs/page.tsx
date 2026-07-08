"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformContext } from "@/context/platformContext";
import { useSettingsAuthority } from "@/app/settings/layout";
import { usePagePermissions } from "@/hooks/use-page-permissions";
import { settingsApi } from "@/services/api/settings-api";
import type { ActivityLogRecord } from "@/services/api/settings-api";
import { SettingsLayout, SettingsSectionHeader } from "@/components/settings/settings-components";
import { Button } from "@/components/ui/button";
import { EmptyModuleState, ErrorState } from "@/components/layout/ui-states";

const AUDIT_ACTIONS = [
  { value: "", label: "All actions" },
  { value: "organization.created", label: "Organization created" },
  { value: "organization.updated", label: "Organization updated" },
  { value: "organization.deactivated", label: "Organization deactivated" },
  { value: "organization.reactivated", label: "Organization reactivated" },
  { value: "platform.org_onboarded", label: "Platform onboarded" },
  { value: "workspace.created", label: "Workspace created" },
  { value: "workspace.updated", label: "Workspace updated" },
  { value: "workspace.archived", label: "Workspace archived" },
  { value: "workspace.restored", label: "Workspace restored" },
  { value: "project.created", label: "Project created" },
  { value: "project.updated", label: "Project updated" },
  { value: "project.archived", label: "Project archived" },
  { value: "project.restored", label: "Project restored" },
  { value: "team.created", label: "Team created" },
  { value: "team.updated", label: "Team updated" },
  { value: "team.deleted", label: "Team deleted" },
  { value: "member.invited", label: "Member invited" },
  { value: "member.invitation_accepted", label: "Invitation accepted" },
  { value: "member.invitation_cancelled", label: "Invitation cancelled" },
  { value: "member.invitation_resent", label: "Invitation resent" },
  { value: "member.added", label: "Member added to team" },
  { value: "member.removed", label: "Member removed from team" },
  { value: "role.created", label: "Role created" },
  { value: "role.assigned", label: "Role assigned" },
  { value: "role.updated", label: "Role updated" },
  { value: "role.deleted", label: "Role deleted" },
  { value: "permission.assigned", label: "Permission assigned" },
  { value: "permission.removed", label: "Permission removed" },
  { value: "user.profile_updated", label: "Profile updated" },
  { value: "user.password_changed", label: "Password changed" },
  { value: "user.deactivated", label: "Account deactivated" },
];

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatAbsolute(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function getActionBadgeClass(action: string): string {
  const prefix = action.split(".")[0];
  const map: Record<string, string> = {
    organization: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    platform: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    workspace: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    project: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    team: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    member: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    role: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    permission: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    user: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return map[prefix] ?? "bg-muted text-muted-foreground";
}

function getScopeLabel(
  log: ActivityLogRecord,
  orgMap: Record<number, string>,
  wsMap: Record<number, string>,
  projMap: Record<number, string>,
): string {
  if (log.project_id != null) return `Project: ${projMap[log.project_id] ?? `#${log.project_id}`}`;
  if (log.workspace_id != null) return `Workspace: ${wsMap[log.workspace_id] ?? `#${log.workspace_id}`}`;
  if (log.organization_id != null) return `Org: ${orgMap[log.organization_id] ?? `#${log.organization_id}`}`;
  return "Platform";
}

const PAGE_SIZE = 25;

export default function AuditLogsSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { authorityLevel, orgId } = useSettingsAuthority();
  const { organizations, workspaces, projects, can } = usePlatformContext();
  usePagePermissions();

  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);

  const isGlobal = authorityLevel === "superuser" || authorityLevel === "platform";
  const canViewAudit = isGlobal || authorityLevel === "org" || can("guard.audit.view");
  const scopeOrgId = isGlobal ? undefined : (orgId ?? organizations[0]?.id);

  const logsQuery = useQuery({
    queryKey: ["audit-logs", scopeOrgId, actionFilter, page],
    queryFn: () =>
      settingsApi.listActivityLogs(accessToken ?? "", {
        organization_id: scopeOrgId,
        action: actionFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    enabled: Boolean(accessToken && canViewAudit),
  });

  const usersQuery = useQuery({
    queryKey: ["settings", "users"],
    queryFn: () => settingsApi.listUsers(accessToken ?? ""),
    enabled: Boolean(accessToken && canViewAudit),
    staleTime: 60_000,
  });

  const userMap: Record<number, { name: string | null; email: string }> = Object.fromEntries(
    (usersQuery.data ?? []).map((u) => [u.id, { name: u.full_name ?? null, email: u.email }])
  );

  const orgMap: Record<number, string> = Object.fromEntries(organizations.map((o) => [o.id, o.name]));
  const wsMap: Record<number, string> = Object.fromEntries(workspaces.map((w) => [w.id, w.name]));
  const projMap: Record<number, string> = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "Audit Logs" }];

  if (!canViewAudit) {
    return (
      <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings" backLabel="Back to Settings">
        <SettingsSectionHeader title="Audit Logs" description="Track actions taken across your organization." />
        <EmptyModuleState title="Access Restricted" description="You don't have permission to view audit logs." />
      </SettingsLayout>
    );
  }

  const logs = logsQuery.data ?? [];
  const hasMore = logs.length === PAGE_SIZE;

  function getActorLabel(actorId: number | null): string {
    if (actorId == null) return "System";
    const u = userMap[actorId];
    if (!u) return `User #${actorId}`;
    return u.name || u.email;
  }

  return (
    <SettingsLayout breadcrumbs={breadcrumbs} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="Audit Logs"
        description="Track every important action taken across your organization — who did what, when, and to what."
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          {AUDIT_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        {!isGlobal && scopeOrgId != null && (
          <span className="text-xs text-muted-foreground">
            Showing logs for{" "}
            <span className="font-medium text-foreground">
              {orgMap[scopeOrgId] ?? `Organization #${scopeOrgId}`}
            </span>
          </span>
        )}
        {isGlobal && (
          <span className="text-xs text-muted-foreground">Showing all platform logs</span>
        )}
      </div>

      {/* Table */}
      {logsQuery.isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading audit logs…</div>
      ) : logsQuery.isError ? (
        <ErrorState
          title="Failed to load audit logs"
          description="Check the API gateway and core-service are running."
        />
      ) : logs.length === 0 ? (
        <EmptyModuleState
          title="No audit logs"
          description={actionFilter ? "No logs match the selected action filter." : "No activity has been logged yet."}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">When</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td
                    className="whitespace-nowrap px-3 py-2.5 text-muted-foreground"
                    title={formatAbsolute(log.created_at)}
                  >
                    {formatRelative(log.created_at)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{getActorLabel(log.actor_user_id)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getActionBadgeClass(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="max-w-xs px-3 py-2.5 text-muted-foreground">
                    {log.description ?? <span className="italic text-muted-foreground/60">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                    {getScopeLabel(log, orgMap, wsMap, projMap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(page > 0 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} · {logs.length} entries
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </SettingsLayout>
  );
}
