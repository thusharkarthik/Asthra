"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTION_REGISTRY, type ActionDefinition } from "@/access/actionRegistry";
import {
  SettingsCard,
  SettingsDataTable,
  SettingsEmptyState,
  SettingsLayout,
  SettingsSectionHeader
} from "@/components/settings/settings-components";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { CoreUser, EffectiveAccessDebugRecord, RoleRecord } from "@/types/core";

const CERTIFICATION_ROLES = [
  ["platform_owner", "Platform Owner"],
  ["organization_owner", "Organization Owner"],
  ["organization_admin", "Organization Admin"],
  ["organization_auditor", "Organization Auditor"],
  ["workspace_admin", "Workspace Admin"],
  ["workspace_manager", "Workspace Manager"],
  ["workspace_member", "Workspace Member"],
  ["workspace_viewer", "Workspace Viewer"],
  ["project_admin", "Project Admin"],
  ["project_manager", "Project Manager"],
  ["project_contributor", "Project Contributor"],
  ["project_viewer", "Project Viewer"],
  ["team_lead", "Team Lead"],
  ["team_member", "Team Member"],
  ["team_observer", "Team Observer"]
] as const;

const ACTION_CHECK_KEYS = [
  "settings.organization.edit",
  "settings.workspace.create",
  "settings.workspace.edit",
  "settings.project.create",
  "settings.project.edit",
  "settings.project.archive",
  "settings.project.restore",
  "settings.team.create",
  "settings.team.edit",
  "settings.team.delete",
  "settings.member.invite",
  "settings.member.remove",
  "settings.member.role.assign"
] as const;

const CERTIFICATION_COLUMNS = [
  ["view", "Can View"],
  ["create", "Can Create"],
  ["edit", "Can Edit"],
  ["archive", "Can Archive"],
  ["restore", "Can Restore"],
  ["invite", "Can Invite"],
  ["assignRole", "Can Assign Role"],
  ["manageSettings", "Can Manage Settings"],
  ["flow", "Can Access Flow"],
  ["docs", "Can Access Docs"],
  ["discover", "Can Access Discover"]
] as const;

function roleDisplayName(value?: string | null) {
  if (!value) return "Not set";
  return value.split(/[_\s-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function roleAllows(permissionCodes: string[], key: string) {
  if (key === "view") return permissionCodes.some((code) => code.endsWith(".view"));
  if (key === "create") return permissionCodes.some((code) => code.endsWith(".create"));
  if (key === "edit") return permissionCodes.some((code) => code.endsWith(".edit"));
  if (key === "archive") return permissionCodes.some((code) => code.endsWith(".archive"));
  if (key === "restore") return permissionCodes.some((code) => code.endsWith(".restore"));
  if (key === "invite") return permissionCodes.includes("settings.member.invite");
  if (key === "assignRole") return permissionCodes.includes("settings.member.role.assign") || permissionCodes.includes("settings.role.manage");
  if (key === "manageSettings") return permissionCodes.some((code) => code.startsWith("settings.") && code.endsWith(".manage"));
  if (key === "flow") return permissionCodes.some((code) => code.startsWith("flow."));
  if (key === "docs") return permissionCodes.some((code) => code.startsWith("docs."));
  if (key === "discover") return permissionCodes.some((code) => code.startsWith("discover."));
  return false;
}

function scopeOptions(scopeType: string, organizations: Array<{ id: number; name: string }>, workspaces: Array<{ id: number; name: string }>, projects: Array<{ id: number; name: string }>, teams: Array<{ id: number; name: string }>) {
  if (scopeType === "organization") return organizations;
  if (scopeType === "workspace") return workspaces;
  if (scopeType === "project") return projects;
  if (scopeType === "team") return teams;
  return [];
}

function actionDefinition(actionKey: string): ActionDefinition {
  return ACTION_REGISTRY[actionKey as keyof typeof ACTION_REGISTRY] ?? {
    actionKey,
    permissionCode: actionKey,
    module: actionKey.split(".")[0] ?? "unknown",
    resource: actionKey.split(".")[1] ?? "unknown",
    action: actionKey.split(".")[2] ?? "unknown",
    scopeResolver: "project",
    label: roleDisplayName(actionKey),
    riskLevel: "medium"
  };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RoleCertificationView() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const [selectedUserId, setSelectedUserId] = useState<number>(currentUser?.id ?? 1);
  const [scopeType, setScopeType] = useState("project");
  const [scopeId, setScopeId] = useState<number | null>(selectedProjectId ?? null);

  const organizationsQuery = useQuery({ queryKey: ["settings", "role-certification", "organizations"], queryFn: () => settingsApi.listOrganizations(accessToken ?? "", { include_inactive: true }), enabled: Boolean(accessToken) });
  const workspacesQuery = useQuery({ queryKey: ["settings", "role-certification", "workspaces"], queryFn: () => settingsApi.listWorkspaces(accessToken ?? "", { include_inactive: true }), enabled: Boolean(accessToken) });
  const projectsQuery = useQuery({ queryKey: ["settings", "role-certification", "projects"], queryFn: () => settingsApi.listProjects(accessToken ?? "", { include_inactive: true }), enabled: Boolean(accessToken) });
  const teamsQuery = useQuery({ queryKey: ["settings", "role-certification", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolesQuery = useQuery({ queryKey: ["settings", "role-certification", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "role-certification", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolePermissionsQuery = useQuery({
    queryKey: ["settings", "role-certification", "role-permissions", rolesQuery.data?.map((role) => role.id).join(",")],
    queryFn: async () => {
      const rows = await Promise.all((rolesQuery.data ?? []).map(async (role) => [role.id, await settingsApi.listRolePermissions(accessToken ?? "", role.id)] as const));
      return Object.fromEntries(rows) as Record<number, Array<{ permission_id: number }>>;
    },
    enabled: Boolean(accessToken && rolesQuery.data?.length)
  });
  const roleAssignmentsQuery = useQuery({ queryKey: ["settings", "role-certification", "assignments"], queryFn: () => settingsApi.listRoleAssignments(accessToken ?? ""), enabled: Boolean(accessToken) });

  const organizations = organizationsQuery.data ?? [];
  const workspaces = workspacesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const rolePermissions = rolePermissionsQuery.data ?? {};
  const permissionsById = new Map((permissionsQuery.data ?? []).map((permission) => [permission.id, permission.code]));
  const users = useMemo(() => {
    const records = new Map<number, Pick<CoreUser, "id" | "email" | "full_name">>();
    if (currentUser) records.set(currentUser.id, currentUser);
    (roleAssignmentsQuery.data ?? []).forEach((assignment) => {
      records.set(assignment.user_id, { id: assignment.user_id, email: `User ${assignment.user_id}`, full_name: `User ${assignment.user_id}` });
    });
    return Array.from(records.values());
  }, [currentUser, roleAssignmentsQuery.data]);
  const scopeItems = scopeOptions(scopeType, organizations, workspaces, projects, teams);
  const debugQuery = useQuery({
    queryKey: ["settings", "role-certification", "debug", selectedUserId, scopeType, scopeId],
    queryFn: () => settingsApi.getEffectiveAccessDebug(accessToken ?? "", {
      user_id: selectedUserId,
      scope_type: scopeType,
      scope_id: scopeType === "platform" ? null : scopeId,
      action_keys: [...ACTION_CHECK_KEYS]
    }),
    enabled: Boolean(accessToken && selectedUserId && (scopeType === "platform" || scopeId))
  });
  const debug = debugQuery.data;

  function roleCodes(role?: RoleRecord) {
    if (!role) return [];
    return (rolePermissions[role.id] ?? []).map((mapping) => permissionsById.get(mapping.permission_id)).filter(Boolean) as string[];
  }

  function exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      user: debug?.user ?? { id: selectedUserId },
      scope: debug?.scope ?? { scope_type: scopeType, scope_id: scopeId },
      direct_roles: debug?.direct_roles ?? [],
      inherited_roles: debug?.inherited_roles ?? [],
      effective_permissions: debug?.effective_permissions ?? [],
      action_results: debug?.action_results ?? []
    };
    downloadJson(`asthra-role-certification-${selectedUserId}-${Date.now()}.json`, report);
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Access Control", href: "/settings/access-control" }, { label: "Role Certification" }]}
      backHref="/settings/access-control"
      backLabel="Back to Access Control"
      parentContext={{
        label: "Access Control QA",
        title: "Role Certification",
        description: "Repeatable role, scope, permission, and action certification for QA.",
        meta: `${CERTIFICATION_ROLES.length} roles / ${ACTION_CHECK_KEYS.length} action checks`
      }}
    >
      <SettingsSectionHeader
        title="Role Certification"
        description="Select a user and scope to inspect effective roles, inherited permissions, visible actions, and source traces."
        actions={<Button type="button" variant="outline" onClick={exportReport} disabled={!debug}><Download className="mr-2 h-4 w-4" />Export QA Report</Button>}
      />
      <SettingsCard title="Role Certification Matrix" description="Role mapping summary from current role-permission assignments. This is a certification aid, not an enforcement layer.">
        <SettingsDataTable
          columns={["Role", ...CERTIFICATION_COLUMNS.map((column) => column[1])]}
          rows={CERTIFICATION_ROLES.map(([roleKey, roleLabel]) => {
            const role = (rolesQuery.data ?? []).find((item) => item.key === roleKey);
            const codes = roleCodes(role);
            return [
              role?.name ?? roleLabel,
              ...CERTIFICATION_COLUMNS.map(([key]) => roleAllows(codes, key) ? "Allowed" : "Denied")
            ];
          })}
          emptyMessage="No role certification rows"
        />
      </SettingsCard>
      <SettingsCard title="Scope Simulation" description="Choose a user and target scope to resolve roles, inherited roles, permissions, and action results.">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block font-medium">User</span>
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3">
              {users.map((user) => <option key={user.id} value={user.id}>{user.full_name ?? user.email ?? `User ${user.id}`}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Scope type</span>
            <select value={scopeType} onChange={(event) => {
              const nextScope = event.target.value;
              setScopeType(nextScope);
              const nextItems = scopeOptions(nextScope, organizations, workspaces, projects, teams);
              setScopeId(nextScope === "platform" ? null : nextItems[0]?.id ?? null);
            }} className="h-10 w-full rounded-md border bg-background px-3">
              {["platform", "organization", "workspace", "project", "team"].map((scope) => <option key={scope} value={scope}>{roleDisplayName(scope)}</option>)}
            </select>
          </label>
          {scopeType !== "platform" ? (
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Scope</span>
              <select value={scopeId ?? ""} onChange={(event) => setScopeId(Number(event.target.value))} className="h-10 w-full rounded-md border bg-background px-3">
                {scopeItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : null}
          <div className="text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <div className="rounded-md border bg-muted/20 px-3 py-2">{debugQuery.isFetching ? "Checking" : debug ? "Ready" : "Select scope"}</div>
          </div>
        </div>
      </SettingsCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard title="Assigned Roles" description="Roles directly assigned at the selected scope.">
          <SettingsDataTable
            columns={["Role", "Scope", "Source"]}
            rows={(debug?.direct_roles ?? []).map((role) => [role.name, roleDisplayName(role.scope), `${roleDisplayName(role.source_scope_type)} ${role.source_scope_id ?? "global"}`])}
            emptyMessage="No direct roles"
          />
        </SettingsCard>
        <SettingsCard title="Inherited Roles" description="Roles inherited from platform, organization, or workspace scope.">
          <SettingsDataTable
            columns={["Role", "Scope", "Source"]}
            rows={(debug?.inherited_roles ?? []).map((role) => [role.name, roleDisplayName(role.scope), `${roleDisplayName(role.source_scope_type)} ${role.source_scope_id ?? "global"}`])}
            emptyMessage="No inherited roles"
          />
        </SettingsCard>
      </div>
      <SettingsCard title="Action Test Runner" description="Key Settings action checks for the selected user and scope.">
        <SettingsDataTable
          columns={["Action", "Permission", "Result", "Source Role", "Scope Source"]}
          rows={(debug?.action_results ?? ACTION_CHECK_KEYS.map((key) => ({ action_key: key, action_label: actionDefinition(key).label, permission_code: key, allowed: false, source_role: null, scope_source: null, sources: [] }))).map((result) => [
            actionDefinition(result.action_key).label,
            result.permission_code,
            result.allowed ? "Allowed" : "Denied",
            result.source_role ?? "No matching role",
            result.scope_source ?? "No source"
          ])}
          emptyMessage="No action checks"
        />
      </SettingsCard>
      <SettingsCard title="Effective Permissions" description={`${debug?.effective_permissions.length ?? 0} permission codes resolved for the selected scope.`}>
        {debug?.effective_permissions.length ? (
          <div className="flex max-h-60 flex-wrap gap-2 overflow-auto">
            {debug.effective_permissions.map((code) => <span key={code} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{code}</span>)}
          </div>
        ) : <SettingsEmptyState title="No effective permissions" description="Select a user and scope with assigned roles." />}
      </SettingsCard>
      <SettingsCard title="Permission Source Trace" description="Why each allowed permission is available.">
        <SettingsDataTable
          columns={["Permission", "Allowed By", "Scope", "Inherited Through"]}
          rows={(debug?.permission_trace ?? []).slice(0, 40).map((trace) => [
            trace.permission_code,
            trace.sources.map((source) => source.role_name).join(", ") || "No role source",
            trace.sources.map((source) => source.scope_label).join(", ") || "No scope source",
            trace.sources.map((source) => source.inherited_through.join(" -> ")).join(", ") || "Direct"
          ])}
          emptyMessage="No permission trace"
        />
      </SettingsCard>
    </SettingsLayout>
  );
}
