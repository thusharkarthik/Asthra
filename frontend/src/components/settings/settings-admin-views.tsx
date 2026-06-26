"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePlatformContext } from "@/context/platformContext";
import { settingsApi } from "@/services/api/settings-api";
import { queryKeys } from "@/lib/queryKeys";
import { normalizeRole } from "@/lib/role-utils";
import { can as hasPermission } from "@/lib/permissions";
import { SETTINGS_ACTIONS, listActionDefinitions } from "@/access/actionRegistry";
import { PermissionAction, PermissionButton } from "@/access/permission-components";
import type { ApiKeyRecord, CoreUser, CurrentUserPermissions, InvitationRecord, PermissionRecord, ProjectMembershipRecord, ProjectRecord, RoleAssignmentRecord, RoleRecord, RoleTemplateRecord, TeamMemberRecord, TeamRecord } from "@/types/core";
import {
  FormActions,
  FormField,
  PlatformSetupSteps,
  QuickCreateButton,
  SettingsCard,
  SettingsCreateDialog,
  SettingsDangerZone,
  SettingsDataTable,
  SettingsEmptyState,
  SettingsLayout,
  SettingsSectionHeader
} from "@/components/settings/settings-components";

function SettingsLinkButton({ href, children, variant = "default" }: { href: string; children: ReactNode; variant?: "default" | "outline" }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ${
        variant === "outline" ? "border bg-background hover:bg-muted" : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {children}
    </Link>
  );
}

function useSettingsData() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setProjects = useWorkspaceStore((state) => state.setProjects);

  const organizationsQuery = useQuery({
    queryKey: [...queryKeys.organizations.list, "settings-all"],
    queryFn: () => settingsApi.listOrganizations(accessToken ?? "", { include_inactive: true }),
    enabled: Boolean(accessToken)
  });
  const workspacesQuery = useQuery({
    queryKey: [...queryKeys.workspaces.list(null), "settings-all"],
    queryFn: () => settingsApi.listWorkspaces(accessToken ?? "", { include_inactive: true }),
    enabled: Boolean(accessToken)
  });
  const projectsQuery = useQuery({
    queryKey: [...queryKeys.projects.list(null), "settings-all"],
    queryFn: () => settingsApi.listProjects(accessToken ?? "", { include_inactive: true }),
    enabled: Boolean(accessToken)
  });

  useEffect(() => {
    if (organizationsQuery.data) setOrganizations(organizationsQuery.data.filter((organization) => organization.is_active !== false));
  }, [organizationsQuery.data, setOrganizations]);
  useEffect(() => {
    if (workspacesQuery.data) setWorkspaces(workspacesQuery.data.filter((workspace) => workspace.is_active !== false));
  }, [setWorkspaces, workspacesQuery.data]);
  useEffect(() => {
    if (projectsQuery.data) setProjects(projectsQuery.data.filter((project) => project.is_active !== false));
  }, [projectsQuery.data, setProjects]);

  return {
    accessToken,
    organizations: organizationsQuery.data ?? [],
    workspaces: workspacesQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    isLoading: organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading,
    error: organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error
  };
}

function useCurrentPermissions(scopeOverride?: { orgId?: number; workspaceId?: number; projectId?: number }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const orgId = scopeOverride?.orgId ?? selectedOrganizationId ?? undefined;
  const workspaceId = scopeOverride?.workspaceId ?? selectedWorkspaceId ?? undefined;
  const projectId = scopeOverride?.projectId ?? selectedProjectId ?? undefined;
  const query = useQuery<CurrentUserPermissions>({
    queryKey: queryKeys.permissions.current(orgId, workspaceId, projectId),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {
      org_id: orgId,
      workspace_id: workspaceId,
      project_id: projectId
    }),
    enabled: Boolean(accessToken)
  });
  const permissionCodes = query.data?.permission_codes ?? [];
  return {
    ...query,
    permissionCodes,
    can: (permissionCode: string) => hasPermission(permissionCodes, permissionCode)
  };
}

function permissionActionScope(permissions: ReturnType<typeof useCurrentPermissions>) {
  return {
    permissionCodes: permissions.permissionCodes,
    isLoading: permissions.isLoading || permissions.isFetching
  };
}

function getFormValue(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "").trim();
}

function invalidateSettingsAndContext(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
    // The scoped member list uses ["settings", "members", orgId, wsId] — must invalidate by prefix.
    queryClient.invalidateQueries({ queryKey: ["settings", "members"] }),
    queryClient.invalidateQueries({ queryKey: ["settings", "global-member-role-assignments"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all }),
    // Invalidate authority queries used by settings/layout.tsx so settings unlock without page refresh.
    queryClient.invalidateQueries({ queryKey: ["members-page"] }),
    queryClient.invalidateQueries({ queryKey: ["settings", "roles"] })
  ]);
}

// Shared class for description <textarea> elements — matches Input styling without fixed height.
const DESCRIPTION_TEXTAREA_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 resize-y min-h-[72px]";

type MemberSelectOption = { userId: number; name: string; email: string };

function SettingsMemberSelect({
  name,
  placeholder = "Type 2+ characters to search…",
  members,
}: {
  name: string;
  placeholder?: string;
  members: MemberSelectOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const selected = selectedId != null ? (members.find((m) => m.userId === selectedId) ?? null) : null;
  const filtered =
    search.length >= 2
      ? members.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      {selected ? (
        <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
          <span className="flex-1 truncate">
            {selected.name}
            {selected.email ? <span className="ml-1 text-muted-foreground">· {selected.email}</span> : null}
          </span>
          <button
            type="button"
            aria-label="Clear selection"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => { setSelectedId(null); setSearch(""); }}
          >
            ×
          </button>
        </div>
      ) : (
        <Input
          placeholder={placeholder}
          value={search}
          autoComplete="off"
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { if (search.length >= 2) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      )}
      {open && search.length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-md">
          {filtered.length > 0 ? (
            filtered.map((m) => (
              <button
                key={m.userId}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => { setSelectedId(m.userId); setSearch(""); setOpen(false); }}
              >
                <span className="font-medium">{m.name}</span>
                {m.email ? <span className="ml-2 text-xs text-muted-foreground">{m.email}</span> : null}
              </button>
            ))
          ) : (
            <p className="p-3 text-sm text-muted-foreground">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function displayUser(user?: CoreUser | null, fallbackId?: number) {
  if (!user) return { name: fallbackId ? `User ${fallbackId}` : "Pending user", email: "Email unavailable", status: "Unknown" };
  return {
    name: user.full_name || user.email,
    email: user.email,
    status: user.is_active ? "Active" : "Inactive"
  };
}

const DEFAULT_ROLE_MEANINGS = [
  ["Platform Owner", "Full platform access and owner-only administration."],
  ["Organization Owner", "Full organization, workspace, project, member, role, and audit access."],
  ["Workspace Admin", "Manage workspace setup, members, teams, projects, Flow, Docs, and operational visibility."],
  ["Project Manager", "Manage Flow work items, boards, sprints, releases, and reports."],
  ["Project Contributor", "Create and edit project work while using scoped project knowledge."],
  ["Workspace Viewer / Project Viewer", "Read-only access through view permissions."]
] as const;

const ROLE_SCOPE_LABELS: Record<string, string> = {
  platform: "Platform",
  organization: "Organization",
  workspace: "Workspace",
  project: "Project",
  team: "Team",
  functional: "Functional"
};

const ACCESS_CONTROL_MODULES = ["settings", "flow", "docs", "desk", "pulse", "discover", "dev", "automation"];
const ACCESS_MATRIX_ROLES = [
  { key: "platform_owner", label: "Platform Owner" },
  { key: "platform_admin", label: "Platform Admin" },
  { key: "organization_owner", label: "Organization Owner" },
  { key: "workspace_admin", label: "Workspace Admin" },
  { key: "project_manager", label: "Project Manager" },
  { key: "project_contributor", label: "Project Contributor" },
  { key: "workspace_viewer", label: "Viewer" }
];

function roleDisplayName(role?: string | null) {
  return String(role || "member")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moduleLabel(module?: string | null) {
  return roleDisplayName(module || "uncategorized");
}

function permissionModule(permission: PermissionRecord) {
  return permission.module || permission.code.split(".")[0] || "uncategorized";
}

function accessLevelForPermission(permission: PermissionRecord, role?: RoleRecord, mapped = false) {
  if (!mapped || !role) return "None";
  if (role.key === "platform_owner") return "Full";
  if (permission.code.endsWith(".view")) return "Read";
  if (permission.code.includes(".manage") || permission.code.includes(".delete") || permission.code.includes(".remove")) return "Manage";
  if (permission.code.includes(".create") || permission.code.includes(".edit") || permission.code.includes(".invite")) return "Use";
  return "Use";
}

function groupPermissionsByModule(permissions: PermissionRecord[]) {
  return permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => {
    const module = permissionModule(permission);
    groups[module] = [...(groups[module] ?? []), permission];
    return groups;
  }, {});
}

function groupPermissionCodesByModule(permissionCodes: string[]) {
  return permissionCodes.reduce<Record<string, string[]>>((groups, code) => {
    const module = code.split(".")[0] || "uncategorized";
    groups[module] = [...(groups[module] ?? []), code];
    return groups;
  }, {});
}

function roleNameById(roles: RoleRecord[], roleId?: number | null) {
  return roles.find((role) => role.id === roleId)?.name ?? (roleId ? `Role ${roleId}` : "No role assigned");
}

function scopeLabelForAssignment(assignment: RoleAssignmentRecord, organizations: Array<{ id: number; name: string }>, workspaces: Array<{ id: number; name: string }>) {
  if (assignment.scope_type === "platform") return "Platform";
  if (assignment.scope_type === "organization") return organizations.find((item) => item.id === assignment.scope_id)?.name ?? `Organization ${assignment.scope_id}`;
  if (assignment.scope_type === "workspace") return workspaces.find((item) => item.id === assignment.scope_id)?.name ?? `Workspace ${assignment.scope_id}`;
  return `${roleDisplayName(assignment.scope_type)} ${assignment.scope_id ?? ""}`.trim();
}

function countMembersForRole(role: RoleRecord, members: Array<{ role_id?: number | null; member_role?: string | null }>) {
  return members.filter((member) => member.role_id === role.id || normalizeRole(member.member_role) === normalizeRole(role.key ?? role.name)).length;
}

function roleNameFromRecord(role?: RoleRecord | null, fallback?: string | null) {
  return role?.name ?? roleDisplayName(fallback);
}

function canViewProtectedRoles(currentUser: CoreUser | null, permissions: ReturnType<typeof useCurrentPermissions>) {
  return Boolean(
    currentUser?.is_superuser
    || permissions.data?.roles?.some((role) => role.key === "superuser" || role.key === "platform_owner")
  );
}

function filterVisibleRoles(roles: RoleRecord[], canViewProtected: boolean) {
  if (canViewProtected) return roles;
  return roles.filter((role) => role.key !== "superuser" && role.name !== "Superuser" && !role.is_hidden);
}

function filterVisibleRoleTemplates(roles: RoleTemplateRecord[], canViewProtected: boolean) {
  if (canViewProtected) return roles;
  return roles.filter((role) => role.key !== "superuser" && role.name !== "Superuser" && !role.is_hidden);
}

function groupedRolesForInvite(roles: RoleRecord[], inviteScope: "organization" | "workspace" | "project" | "team", allowPlatformRoles: boolean) {
  const validScopes = new Set([inviteScope, "functional"]);
  if (allowPlatformRoles) validScopes.add("platform");
  return roles
    .filter((role) => role.is_active !== false)
    .filter((role) => validScopes.has(role.scope))
    .reduce<Record<string, RoleRecord[]>>((groups, role) => {
      groups[role.scope] = [...(groups[role.scope] ?? []), role];
      return groups;
    }, {});
}

function RoleSelectOptions({ groupedRoles, includeDefault = true }: { groupedRoles: Record<string, RoleRecord[]>; includeDefault?: boolean }) {
  const scopes = ["platform", "organization", "workspace", "project", "team", "functional"];
  return (
    <>
      {includeDefault ? <option value="">Default member</option> : null}
      {scopes.map((scope) => groupedRoles[scope]?.length ? (
        <optgroup key={scope} label={ROLE_SCOPE_LABELS[scope] ?? roleDisplayName(scope)}>
          {groupedRoles[scope].map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
        </optgroup>
      ) : null)}
    </>
  );
}

function getOrganizationNameForWorkspace(
  organizations: Array<{ id: number; name: string }>,
  workspaces: Array<{ id: number; organization_id: number }>,
  workspaceId: number
) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  return organizations.find((item) => item.id === workspace?.organization_id)?.name ?? "Unknown organization";
}

function useUserProfiles(userIds: number[]) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const uniqueIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))).sort((a, b) => a - b), [userIds]);
  return useQuery({
    queryKey: ["settings", "user-profiles", uniqueIds.join(",")],
    queryFn: async () => {
      const users = await Promise.all(
        uniqueIds.map(async (userId) => {
          try {
            return await settingsApi.getUser(accessToken ?? "", userId);
          } catch {
            return null;
          }
        })
      );
      return new Map(users.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: Boolean(accessToken && uniqueIds.length)
  });
}

function AdminTabs({ tabs }: { tabs: Array<{ label: string; href: string; active?: boolean }> }) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b pb-2" aria-label="Administration tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
            tab.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="max-w-sm" />;
}

function ConfirmActionButton({
  label,
  message,
  onConfirm,
  variant = "outline"
}: {
  label: string;
  message: string;
  onConfirm: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {label}
    </Button>
  );
}

function SetupSummary() {
  const { organizations, workspaces, projects } = useSettingsData();
  return <PlatformSetupSteps hasOrganization={organizations.length > 0} hasWorkspace={workspaces.length > 0} hasProject={projects.length > 0} />;
}

export function SettingsHomeView() {
  const { organizations, workspaces, projects } = useSettingsData();
  const permissions = useCurrentPermissions();
  const canCreateOrganization = organizations.length === 0 || permissions.can(SETTINGS_ACTIONS.organizationCreate.permissionCode);
  const canCreateWorkspace = permissions.can(SETTINGS_ACTIONS.workspaceCreate.permissionCode);
  const canCreateProject = permissions.can(SETTINGS_ACTIONS.projectCreate.permissionCode);
  const cards = [
    { title: "Administration", value: "Open", href: "/settings/administration" },
    { title: "Organizations", value: organizations.length, href: "/settings/organizations" },
    { title: "Workspaces", value: workspaces.length, href: "/settings/workspaces" },
    { title: "Projects", value: projects.length, href: "/settings/projects" },
    { title: "Members", value: "Manage", href: "/settings/members" },
    { title: "Teams", value: "Manage", href: "/settings/teams" },
    { title: "Access Control", value: "Manage", href: "/settings/access-control" },
    { title: "API Keys", value: "Manage", href: "/settings/api-keys" }
  ];

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings" }]} backHref="/" backLabel="Back to Home">
      <SettingsSectionHeader
        title="Settings"
        description="Admin center for account preferences, organizations, workspaces, projects, members, roles, and platform setup."
      />
      <SetupSummary />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-lg border bg-card p-4 hover:bg-muted/60">
            <div className="text-sm text-muted-foreground">{card.title}</div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          </Link>
        ))}
      </div>
      <SettingsCard title="Operational setup flow" description="Create the required hierarchy before using project-scoped modules like Flow.">
        <div className="grid gap-3 md:grid-cols-3">
          {canCreateOrganization ? <SettingsLinkButton href="/settings/organizations" variant="outline">Create Organization</SettingsLinkButton> : <Button type="button" variant="outline" disabled>Create Organization</Button>}
          {canCreateWorkspace ? <SettingsLinkButton href="/settings/workspaces" variant="outline">Create Workspace</SettingsLinkButton> : <Button type="button" variant="outline" disabled>Create Workspace</Button>}
          {canCreateProject ? <SettingsLinkButton href="/settings/projects" variant="outline">Create Project</SettingsLinkButton> : <Button type="button" variant="outline" disabled>Create Project</Button>}
        </div>
      </SettingsCard>
      <SettingsCard title="Administration hierarchy" description="Use this relationship map when setting up Asthra for module CRUD testing.">
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="font-medium">Organization</div>
            <div className="mt-2 text-muted-foreground">-&gt; Workspaces</div>
            <div className="text-muted-foreground">-&gt; Projects</div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="font-medium">Workspace</div>
            <div className="mt-2 text-muted-foreground">-&gt; Members</div>
            <div className="text-muted-foreground">-&gt; Teams</div>
            <div className="text-muted-foreground">-&gt; Projects</div>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="font-medium">Project Owners</div>
            <div className="mt-2 text-muted-foreground">Owners must come from workspace members.</div>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Settings navigation" description="Operational administration areas are grouped for admin use.">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold">Personal</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {["Profile", "Account", "Preferences", "Notifications", "API Keys"].map((item) => (
                <Link key={item} className="text-muted-foreground hover:text-foreground" href={`/settings/${item.toLowerCase().replaceAll(" ", "-")}`}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Administration</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {["Organizations", "Workspaces", "Projects", "Members", "Teams"].map((item) => (
                <Link key={item} className="text-muted-foreground hover:text-foreground" href={`/settings/${item.toLowerCase()}`}>
                  {item}
                </Link>
              ))}
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/access-control">Access Control</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/security">Security</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/audit-logs">Audit Logs</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/integrations">Integrations</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/ai-preferences">AI Preferences</Link>
            </div>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}

export function AdministrationDashboardView() {
  const { accessToken, organizations, workspaces, projects } = useSettingsData();
  const teamsQuery = useQuery({ queryKey: ["settings", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const membersEstimate = organizations.length + workspaces.length;
  const cards = [
    { title: "Organizations", count: organizations.length, href: "/settings/organizations" },
    { title: "Workspaces", count: workspaces.length, href: "/settings/workspaces" },
    { title: "Projects", count: projects.length, href: "/settings/projects" },
    { title: "Members", count: membersEstimate, href: "/settings/members" },
    { title: "Teams", count: teamsQuery.data?.length ?? 0, href: "/settings/teams" },
    { title: "Access Control", count: (rolesQuery.data?.length ?? 0) + (permissionsQuery.data?.length ?? 0), href: "/settings/access-control" }
  ];

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Administration" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Administration" description="Operational control center for setup, members, teams, roles, and permissions." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SettingsCard key={card.title} title={card.title}>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold">{card.count}</div>
              <SettingsLinkButton href={card.href} variant="outline">Manage</SettingsLinkButton>
            </div>
          </SettingsCard>
        ))}
      </div>
    </SettingsLayout>
  );
}

export function OrganizationsView() {
  const { accessToken, organizations } = useSettingsData();
  const permissions = useCurrentPermissions();
  const [statusFilter, setStatusFilter] = useState("active");
  const canCreateOrganization = organizations.length === 0 || permissions.can(SETTINGS_ACTIONS.organizationCreate.permissionCode);
  const createOrganizationScope = permissionActionScope(permissions);
  const showLimitedAccess = !permissions.isLoading && !permissions.isFetching && !canCreateOrganization;
  const visibleOrganizations = organizations.filter((organization) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "inactive") return organization.is_active === false;
    return organization.is_active !== false;
  });
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const setSelectedOrganization = useWorkspaceStore((state) => state.setSelectedOrganization);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => settingsApi.createOrganization(accessToken ?? "", payload),
    onSuccess: async (organization) => {
      setOpen(false);
      setFormError(null);
      setSelectedOrganization(organization.id);
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Organization created", message: `${organization.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create organization.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    if (!name) {
      setFormError("Organization name is required.");
      return;
    }
    mutation.mutate({ name, description: getFormValue(form, "description") || undefined });
  }

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organizations" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader
        title="Organizations"
        description="Create and manage the top-level homes for Asthra work."
        actions={organizations.length === 0 ? (
          <QuickCreateButton onClick={() => setOpen(true)}>Create Organization</QuickCreateButton>
        ) : (
          <PermissionAction actionKey={SETTINGS_ACTIONS.organizationCreate.actionKey} scope={createOrganizationScope}>
            <QuickCreateButton onClick={() => setOpen(true)}>Create Organization</QuickCreateButton>
          </PermissionAction>
        )}
      />
      {permissions.isLoading || permissions.isFetching ? (
        <div className="mb-4 rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Checking access</span>
          <span className="ml-2">Loading permissions for this Settings scope.</span>
        </div>
      ) : null}
      {showLimitedAccess ? <SettingsCard title="Limited access" description="You need settings.organization.create to create organizations." /> : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium" htmlFor="organization-status-filter">Status</label>
        <select
          id="organization-status-filter"
          aria-label="Organization status filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>
      <SettingsDataTable
        columns={["Name", "Description", "Status", "Actions"]}
        rows={visibleOrganizations.map((organization) => [
          organization.name,
          organization.description ?? "No description",
          organization.is_active === false ? "Inactive" : "Active",
          <Link key={organization.id} className="text-primary hover:underline" href={`/settings/organizations/${organization.id}`}>
            Open
          </Link>
        ])}
        emptyMessage="No organizations yet"
      />
      <SettingsCreateDialog title="Create organization" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Name" required>
          <Input name="name" placeholder="Acme Platform" />
        </FormField>
        <FormField label="Description">
          <textarea name="description" placeholder="Internal product organization" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormActions submitLabel="Create Organization" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function WorkspacesView({ organizationId }: { organizationId?: number }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const targetOrganizationId = organizationId ?? selectedOrganizationId ?? organizations[0]?.id;
  const targetOrganization = organizations.find((organization) => organization.id === targetOrganizationId);
  const permissions = useCurrentPermissions({ orgId: targetOrganizationId ?? undefined });
  const canCreateWorkspace = permissions.can(SETTINGS_ACTIONS.workspaceCreate.permissionCode);
  const visibleWorkspaces = organizationId ? workspaces.filter((workspace) => workspace.organization_id === organizationId) : workspaces;

  const mutation = useMutation({
    mutationFn: (payload: { organization_id: number; name: string; description?: string }) => settingsApi.createWorkspace(accessToken ?? "", payload),
    onSuccess: async (workspace) => {
      setOpen(false);
      setFormError(null);
      setSelectedWorkspace(workspace.id);
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Workspace created", message: `${workspace.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create workspace.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    const organization_id = Number(getFormValue(form, "organization_id") || targetOrganizationId);
    if (!organization_id) {
      setFormError("Create or select an organization first.");
      return;
    }
    if (!name) {
      setFormError("Workspace name is required.");
      return;
    }
    mutation.mutate({ organization_id, name, description: getFormValue(form, "description") || undefined });
  }

  return (
    <SettingsLayout
      breadcrumbs={
        organizationId
          ? [
              { label: "Settings", href: "/settings" },
              { label: "Organizations", href: "/settings/organizations" },
              { label: organizations.find((organization) => organization.id === organizationId)?.name ?? `Organization ${organizationId}`, href: `/settings/organizations/${organizationId}` },
              { label: "Workspaces" }
            ]
          : [{ label: "Settings", href: "/settings" }, { label: "Workspaces" }]
      }
      backHref={organizationId ? `/settings/organizations/${organizationId}` : "/settings"}
      backLabel={organizationId ? "Back to Organization" : "Back to Settings"}
      parentContext={organizationId ? {
        label: "Organization",
        title: organizations.find((organization) => organization.id === organizationId)?.name ?? `Organization ${organizationId}`,
        description: organizations.find((organization) => organization.id === organizationId)?.description ?? undefined,
        meta: `Scoped workspaces for this organization`
      } : undefined}
    >
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members` },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces`, active: true },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Workspaces"
        description="Workspaces connect teams, projects, and module data under an organization."
        actions={canCreateWorkspace ? <QuickCreateButton onClick={() => setOpen(true)}>Create Workspace</QuickCreateButton> : undefined}
      />
      {!canCreateWorkspace ? <SettingsCard title="Limited access" description="You need settings.workspace.create to create workspaces in this scope." /> : null}
      {!organizations.length ? (
        <SettingsEmptyState title="Create an organization first" description="A workspace must belong to an organization." action={<SettingsLinkButton href="/settings/organizations">Create Organization</SettingsLinkButton>} />
      ) : (
        <SettingsDataTable
          columns={["Name", "Organization", "Description", "Actions"]}
          rows={visibleWorkspaces.map((workspace) => [
            workspace.name,
            organizations.find((organization) => organization.id === workspace.organization_id)?.name ?? workspace.organization_id,
            workspace.description ?? "No description",
            <Link key={workspace.id} className="text-primary hover:underline" href={`/settings/workspaces/${workspace.id}`}>
              Open
            </Link>
          ])}
          emptyMessage="No workspaces yet"
        />
      )}
      <SettingsCreateDialog title="Create workspace" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Organization" required>
          {organizationId ? (
            <>
              <input type="hidden" name="organization_id" value={targetOrganizationId ?? ""} />
              <Input value={targetOrganization?.name ?? `Organization ${organizationId}`} readOnly />
            </>
          ) : (
            <select name="organization_id" defaultValue={targetOrganizationId ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Name" required>
          <Input name="name" placeholder="Product Workspace" />
        </FormField>
        <FormField label="Description">
          <textarea name="description" placeholder="Product and engineering planning" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormActions submitLabel="Create Workspace" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function ProjectsView({ workspaceId }: { workspaceId?: number }) {
  const { accessToken, organizations, workspaces, projects } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const setSelectedProject = useWorkspaceStore((state) => state.setSelectedProject);
  const isScopedProjectCreate = Boolean(workspaceId);
  const visibleWorkspaces = isScopedProjectCreate
    ? workspaces.filter((workspace) => workspace.id === workspaceId)
    : workspaces;
  const targetWorkspaceId = workspaceId ?? visibleWorkspaces[0]?.id;
  const targetWorkspace = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
  const permissions = useCurrentPermissions({ workspaceId: targetWorkspaceId ?? undefined });
  const canCreateProject = permissions.can(SETTINGS_ACTIONS.projectCreate.permissionCode);
  const visibleProjects = (workspaceId ? projects.filter((project) => project.workspace_id === workspaceId) : projects).filter((project) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "archived") return project.is_active === false || project.status === "archived";
    return project.is_active !== false && project.status !== "archived";
  });

  const mutation = useMutation({
    mutationFn: (payload: { workspace_id: number; name: string; description?: string; status?: string }) => settingsApi.createProject(accessToken ?? "", payload),
    onSuccess: async (project) => {
      setOpen(false);
      setFormError(null);
      setSelectedProject(project.id);
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Project created", message: `${project.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create project.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    const workspace_id = Number(getFormValue(form, "workspace_id") || targetWorkspaceId);
    if (!workspace_id) {
      setFormError("Create or select a workspace first.");
      return;
    }
    if (!name) {
      setFormError("Project name is required.");
      return;
    }
    mutation.mutate({ workspace_id, name, description: getFormValue(form, "description") || undefined, status: "active" });
  }

  return (
    <SettingsLayout
      breadcrumbs={
        workspaceId
          ? [
              { label: "Settings", href: "/settings" },
              { label: "Workspaces", href: "/settings/workspaces" },
              { label: workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? `Workspace ${workspaceId}`, href: `/settings/workspaces/${workspaceId}` },
              { label: "Projects" }
            ]
          : [{ label: "Settings", href: "/settings" }, { label: "Projects" }]
      }
      backHref={workspaceId ? `/settings/workspaces/${workspaceId}` : "/settings"}
      backLabel={workspaceId ? "Back to Workspace" : "Back to Settings"}
      parentContext={workspaceId ? {
        label: "Workspace",
        title: workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? `Workspace ${workspaceId}`,
        description: workspaces.find((workspace) => workspace.id === workspaceId)?.description ?? undefined,
        meta: `Organization: ${getOrganizationNameForWorkspace(organizations, workspaces, workspaceId)}`
      } : undefined}
    >
      {workspaceId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/workspaces/${workspaceId}` },
            { label: "Members", href: `/settings/workspaces/${workspaceId}/members` },
            { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams` },
            { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects`, active: true }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Projects"
        description="Projects scope Flow work, Docs knowledge, discovery, tickets, and operations."
        actions={canCreateProject ? <QuickCreateButton onClick={() => setOpen(true)}>Create Project</QuickCreateButton> : undefined}
      />
      {!canCreateProject ? <SettingsCard title="Limited access" description="You need settings.project.create to create projects in this scope." /> : null}
      {!workspaces.length ? (
        <SettingsEmptyState title="Create a workspace first" description="A project must belong to a workspace." action={<SettingsLinkButton href="/settings/workspaces">Create Workspace</SettingsLinkButton>} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium" htmlFor="project-status-filter">Status</label>
            <select id="project-status-filter" aria-label="Project status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="active">Active</option>
              <option value="archived">Archived / Inactive</option>
              <option value="all">All</option>
            </select>
          </div>
          <SettingsDataTable
            columns={["Name", "Workspace", "Status", "Actions"]}
            rows={visibleProjects.map((project) => [
              project.name,
              workspaces.find((workspace) => workspace.id === project.workspace_id)?.name ?? project.workspace_id,
              project.is_active === false ? "archived" : project.status ?? "active",
              <Link key={project.id} className="text-primary hover:underline" href={`/settings/projects/${project.id}`}>
                Open
              </Link>
            ])}
            emptyMessage="No projects yet"
          />
        </>
      )}
      <SettingsCreateDialog title="Create project" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Workspace" required>
          {isScopedProjectCreate ? (
            <>
              <input type="hidden" name="workspace_id" value={targetWorkspaceId ?? ""} />
              <Input value={targetWorkspace?.name ?? `Workspace ${workspaceId}`} readOnly />
            </>
          ) : (
            <select name="workspace_id" defaultValue={targetWorkspaceId ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {visibleWorkspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Name" required>
          <Input name="name" placeholder="Asthra Alpha" />
        </FormField>
        <FormField label="Description">
          <textarea name="description" placeholder="Initial internal alpha project" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormActions submitLabel="Create Project" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function OrganizationDetailView({ organizationId }: { organizationId: number }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const organization = organizations.find((item) => item.id === organizationId);
  const scopedWorkspaces = workspaces.filter((workspace) => workspace.organization_id === organizationId);
  const permissions = useCurrentPermissions({ orgId: organizationId });
  const canEditOrganization =
    permissions.can(SETTINGS_ACTIONS.organizationEdit.permissionCode) ||
    permissions.can(SETTINGS_ACTIONS.organizationArchive.permissionCode) ||
    permissions.can(SETTINGS_ACTIONS.organizationRestore.permissionCode);
  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string; is_active?: boolean }) => settingsApi.updateOrganization(accessToken ?? "", organizationId, payload),
    onSuccess: async (updatedOrganization) => {
      setEditOpen(false);
      setFormError(null);
      await invalidateSettingsAndContext(queryClient);
      addToast({
        type: "success",
        title: "Organization updated",
        message: updatedOrganization.is_active === false
          ? "Organization moved to Inactive. Use status filter to view it."
          : `${updatedOrganization.name} was saved.`
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update organization.";
      setFormError(message);
      addToast({ type: "error", title: "Organization update failed", message });
    }
  });

  if (!organization) {
    return <SettingsEmptyState title="Organization not found" description="Refresh the page or open the organizations list." action={<SettingsLinkButton href="/settings/organizations">Organizations</SettingsLinkButton>} />;
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    if (!name) {
      setFormError("Organization name is required.");
      return;
    }
    updateMutation.mutate({
      name,
      description: getFormValue(form, "description") || undefined,
      is_active: getFormValue(form, "is_active") === "true"
    });
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Organizations", href: "/settings/organizations" }, { label: organization.name }]}
      backHref="/settings/organizations"
      backLabel="Back to Organizations"
      parentContext={{
        label: "Organization",
        title: organization.name,
        description: organization.description ?? undefined,
        meta: `Status: ${organization.is_active === false ? "Inactive" : "Active"}`
      }}
    >
      <SettingsSectionHeader
        title={organization.name}
        description={organization.description ?? "Organization administration and setup."}
        actions={canEditOrganization ? <Button type="button" onClick={() => setEditOpen(true)}>Edit Organization</Button> : undefined}
      />
      {!canEditOrganization ? <SettingsCard title="View only" description="You can view this organization, but do not have settings.organization.edit for edit actions." /> : null}
      <AdminTabs
        tabs={[
          { label: "Overview", href: `/settings/organizations/${organizationId}`, active: true },
          { label: "Members", href: `/settings/organizations/${organizationId}/members` },
          { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
          { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
          { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
        ]}
      />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Slug</dt><dd>{organization.slug ?? "Not available"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{organization.is_active === false ? "Inactive" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(organization.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Workspaces</dt><dd>{scopedWorkspaces.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsDataTable
        columns={["Workspace", "Description", "Actions"]}
        rows={scopedWorkspaces.map((workspace) => [workspace.name, workspace.description ?? "No description", <Link key={workspace.id} className="text-primary hover:underline" href={`/settings/workspaces/${workspace.id}`}>Open</Link>])}
        emptyMessage="No workspaces in this organization"
      />
      <SettingsDangerZone description="Organization deletion and ownership transfer are intentionally deferred for the operational foundation." />
      <SettingsCreateDialog title="Edit organization" open={editOpen} onOpenChange={setEditOpen} onSubmit={submitEdit} error={formError}>
        <FormField label="Name" required>
          <Input name="name" defaultValue={organization.name} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" defaultValue={organization.description ?? ""} className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormField label="Status">
          <select name="is_active" defaultValue={String(organization.is_active !== false)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </FormField>
        <p className="text-xs text-muted-foreground">Domain editing is not available because core-service does not store an organization domain field yet.</p>
        <FormActions submitLabel="Save Organization" isSubmitting={updateMutation.isPending} onCancel={() => setEditOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function WorkspaceDetailView({ workspaceId }: { workspaceId: number }) {
  const { accessToken, organizations, workspaces, projects } = useSettingsData();
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const scopedProjects = projects.filter((project) => project.workspace_id === workspaceId);
  const permissions = useCurrentPermissions({ workspaceId });
  const workspaceActionScope = permissionActionScope(permissions);
  const canEditWorkspace =
    permissions.can(SETTINGS_ACTIONS.workspaceEdit.permissionCode) ||
    permissions.can(SETTINGS_ACTIONS.workspaceArchive.permissionCode) ||
    permissions.can(SETTINGS_ACTIONS.workspaceRestore.permissionCode);
  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string; is_active?: boolean }) => settingsApi.updateWorkspace(accessToken ?? "", workspaceId, payload),
    onSuccess: async (updatedWorkspace) => {
      setEditOpen(false);
      setFormError(null);
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Workspace updated", message: `${updatedWorkspace.name} was saved.` });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update workspace.";
      setFormError(message);
      addToast({ type: "error", title: "Workspace update failed", message });
    }
  });

  if (!workspace) {
    return <SettingsEmptyState title="Workspace not found" description="Refresh the page or open the workspaces list." action={<SettingsLinkButton href="/settings/workspaces">Workspaces</SettingsLinkButton>} />;
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Workspaces", href: "/settings/workspaces" }, { label: workspace.name }]}
      backHref="/settings/workspaces"
      backLabel="Back to Workspaces"
      parentContext={{
        label: "Workspace",
        title: workspace.name,
        description: workspace.description ?? undefined,
        meta: `Organization: ${getOrganizationNameForWorkspace(organizations, workspaces, workspaceId)}`
      }}
    >
      <SettingsSectionHeader
        title={workspace.name}
        description={workspace.description ?? "Workspace administration and project setup."}
        actions={
          <PermissionAction actionKey={SETTINGS_ACTIONS.workspaceEdit.actionKey} scope={workspaceActionScope}>
            <Button type="button" onClick={() => setEditOpen(true)}>Edit Workspace</Button>
          </PermissionAction>
        }
      />
      <AdminTabs
        tabs={[
          { label: "Overview", href: `/settings/workspaces/${workspaceId}`, active: true },
          { label: "Members", href: `/settings/workspaces/${workspaceId}/members` },
          { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams` },
          { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
        ]}
      />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Organization ID</dt><dd>{workspace.organization_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{workspace.is_active === false ? "Inactive" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(workspace.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Projects</dt><dd>{scopedProjects.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsDataTable
        columns={["Project", "Status", "Actions"]}
        rows={scopedProjects.map((project) => [project.name, project.status ?? "active", <Link key={project.id} className="text-primary hover:underline" href={`/settings/projects/${project.id}`}>Open</Link>])}
        emptyMessage="No projects in this workspace"
      />
      <SettingsDangerZone description="Workspace archive and permanent deletion are placeholders until audit and retention policies are added." />
      <SettingsCreateDialog title="Edit workspace" open={editOpen} onOpenChange={setEditOpen} onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = getFormValue(form, "name");
        if (!name) {
          setFormError("Workspace name is required.");
          return;
        }
        updateMutation.mutate({
          name,
          description: getFormValue(form, "description") || undefined,
          is_active: getFormValue(form, "is_active") === "true"
        });
      }} error={formError}>
        <FormField label="Name" required>
          <Input name="name" defaultValue={workspace.name} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" defaultValue={workspace.description ?? ""} className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormField label="Status">
          <select name="is_active" defaultValue={String(workspace.is_active !== false)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </FormField>
        <FormActions submitLabel="Save Workspace" isSubmitting={updateMutation.isPending} onCancel={() => setEditOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function ProjectDetailView({ projectId }: { projectId: number }) {
  const { accessToken, projects, workspaces } = useSettingsData();
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const listProject = projects.find((item) => item.id === projectId);
  const projectDetailQuery = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => settingsApi.getProject(accessToken ?? "", projectId),
    enabled: Boolean(accessToken && projectId),
    initialData: listProject
  });
  const project = projectDetailQuery.data ?? listProject;
  const isProjectArchived = project?.is_active === false || project?.status === "archived" || project?.status === "inactive";
  const projectWorkspace = project ? workspaces.find((workspace) => workspace.id === project.workspace_id) : undefined;
  const projectOrganizationId = project?.organization_id ?? projectWorkspace?.organization_id;
  const permissions = useCurrentPermissions({ orgId: projectOrganizationId, workspaceId: project?.workspace_id, projectId });
  const projectActionScope = permissionActionScope(permissions);
  const canEditProject = permissions.can(SETTINGS_ACTIONS.projectEdit.permissionCode);
  const canArchiveProject = permissions.can(SETTINGS_ACTIONS.projectArchive.permissionCode);
  const canRestoreProject = permissions.can(SETTINGS_ACTIONS.projectRestore.permissionCode);
  const workspaceMembersQuery = useQuery({
    queryKey: ["settings", "project-owner-members", project?.workspace_id],
    queryFn: () => settingsApi.listWorkspaceMembers(accessToken ?? "", project?.workspace_id ?? 0),
    enabled: Boolean(accessToken && project?.workspace_id)
  });
  const projectMembersQuery = useQuery({
    queryKey: ["settings", "project-members", projectId],
    queryFn: () => settingsApi.listProjectMembers(accessToken ?? "", projectId),
    enabled: Boolean(accessToken && projectId)
  });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const ownerProfiles = useUserProfiles([
    ...(workspaceMembersQuery.data ?? []).map((member) => member.user_id),
    ...(projectMembersQuery.data ?? []).map((member) => member.user_id),
    ...(project?.owner_id ? [project.owner_id] : [])
  ]).data ?? new Map<number, CoreUser>();
  const owner = project?.owner_id ? displayUser(ownerProfiles.get(project.owner_id), project.owner_id) : null;
  const ownerMutation = useMutation({
    mutationFn: (owner_id: number | null) => settingsApi.updateProject(accessToken ?? "", projectId, { owner_id }),
    onSuccess: async () => {
      setOwnerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "projects"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Project owner updated" });
    },
    onError: (error) => addToast({ type: "error", title: "Owner update failed", message: error instanceof Error ? error.message : "Unable to update owner." })
  });
  const updateProjectMutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string; status?: string; is_active?: boolean }) => settingsApi.updateProject(accessToken ?? "", projectId, payload),
    onSuccess: async (updatedProject) => {
      setEditOpen(false);
      setEditFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "projects"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Project updated", message: `${updatedProject.name} was saved.` });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update project.";
      setEditFormError(message);
      addToast({ type: "error", title: "Project update failed", message });
    }
  });
  const statusProjectMutation = useMutation({
    mutationFn: (payload: { status: string; is_active: boolean }) => settingsApi.updateProject(accessToken ?? "", projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "projects"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      await invalidateSettingsAndContext(queryClient);
      addToast({
        type: "success",
        title: isProjectArchived ? "Project restored" : "Project archived",
        message: isProjectArchived ? "Project is active again." : "Use the Archived / All filter to view it."
      });
    },
    onError: (error) => addToast({ type: "error", title: "Project status update failed", message: error instanceof Error ? error.message : "Unable to update project status." })
  });
  const addProjectMemberMutation = useMutation({
    mutationFn: (payload: { user_id: number; role_id?: number | null }) => settingsApi.addProjectMember(accessToken ?? "", projectId, payload),
    onSuccess: async () => {
      setMemberOpen(false);
      setMemberFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "project-members", projectId] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Project member added" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to add project member.";
      setMemberFormError(message);
      addToast({ type: "error", title: "Project member add failed", message });
    }
  });
  const removeProjectMemberMutation = useMutation({
    mutationFn: (membershipId: number) => settingsApi.removeProjectMember(accessToken ?? "", projectId, membershipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "project-members", projectId] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Project member removed" });
    },
    onError: (error) => addToast({ type: "error", title: "Project member remove failed", message: error instanceof Error ? error.message : "Unable to remove project member." })
  });
  if (!project) {
    if (projectDetailQuery.isLoading || projectDetailQuery.isFetching) {
      return <SettingsEmptyState title="Loading project" description="Loading project details and access." />;
    }
    return <SettingsEmptyState title="Project not found" description="Refresh the page or open the projects list." action={<SettingsLinkButton href="/settings/projects">Projects</SettingsLinkButton>} />;
  }

  function submitProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = Number(getFormValue(event.currentTarget, "user_id"));
    const roleId = Number(getFormValue(event.currentTarget, "role_id")) || null;
    if (!userId) {
      setMemberFormError("Select a workspace member.");
      return;
    }
    addProjectMemberMutation.mutate({ user_id: userId, role_id: roleId });
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Projects", href: "/settings/projects" }, { label: project.name }]}
      backHref="/settings/projects"
      backLabel="Back to Projects"
      parentContext={{
        label: "Project",
        title: project.name,
        description: project.description ?? undefined,
        meta: `Workspace: ${projectWorkspace?.name ?? project.workspace_id}`
      }}
    >
      <SettingsSectionHeader
        title={project.name}
        description={project.description ?? "Project settings and operational metadata."}
        actions={<>
          <PermissionButton actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope} type="button" onClick={() => setEditOpen(true)}>Edit Project</PermissionButton>
          <PermissionButton actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope} type="button" variant="outline" onClick={() => setOwnerOpen(true)}>Assign Owner</PermissionButton>
          <SettingsLinkButton href="/flow">Open Flow</SettingsLinkButton>
        </>}
      />
      <SettingsCard title="Project metadata">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Workspace</dt><dd>{projectWorkspace?.name ?? project.workspace_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{project.status ?? "active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{project.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Owner Name</dt><dd>{owner?.name ?? "Not assigned"}</dd></div>
          <div><dt className="text-muted-foreground">Owner Email</dt><dd>{owner?.email ?? "Not assigned"}</dd></div>
        </dl>
        {!owner ? (
          <div className="mt-4 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">No owner assigned yet.</div>
            <p className="mt-1">Owners should be selected from workspace members.</p>
          </div>
        ) : null}
      </SettingsCard>
      <SettingsCard title="Ownership actions">
        <p className="mb-3 text-sm text-muted-foreground">Project owners should be selected from workspace members. If no members are available, invite members to the workspace first.</p>
        <div className="flex flex-wrap gap-2">
          <PermissionButton actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope} type="button" variant="outline" onClick={() => setOwnerOpen(true)}>Change Owner</PermissionButton>
          <PermissionAction actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope}>
            <ConfirmActionButton label="Remove Owner" message="Remove this project owner?" onConfirm={() => ownerMutation.mutate(null)} />
          </PermissionAction>
        </div>
      </SettingsCard>
      <SettingsCard
        title="Members"
        description="Project membership gives users project-scoped roles without assigning permissions directly."
        actions={
          <PermissionAction actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope}>
            <QuickCreateButton onClick={() => setMemberOpen(true)}>Add Project Member</QuickCreateButton>
          </PermissionAction>
        }
      >
        <SettingsDataTable
          columns={["Name", "Email", "Role", "Team", "Status", "Joined", "Actions"]}
          rows={(projectMembersQuery.data ?? []).map((member: ProjectMembershipRecord) => {
            const user = displayUser(ownerProfiles.get(member.user_id), member.user_id);
            return [
              user.name,
              user.email,
              roleNameById(rolesQuery.data ?? [], member.role_id),
              member.team_id ? `Team ${member.team_id}` : "No team",
              roleDisplayName(member.status),
              formatDate(member.joined_at),
              <PermissionAction key={member.id} actionKey={SETTINGS_ACTIONS.projectEdit.actionKey} scope={projectActionScope}>
                <ConfirmActionButton label="Remove" message={`Remove ${user.name} from this project?`} onConfirm={() => removeProjectMemberMutation.mutate(member.id)} />
              </PermissionAction>
            ];
          })}
          emptyMessage="No project members"
        />
      </SettingsCard>
      {canArchiveProject || canRestoreProject ? (
        <SettingsDangerZone
          title={isProjectArchived ? "Restore project" : "Archive project"}
          description={isProjectArchived ? "Restore this project to the active project list." : "Archive this project without permanently deleting it. Archived projects remain recoverable from the Projects filter."}
          actions={isProjectArchived ? (
            <PermissionAction actionKey={SETTINGS_ACTIONS.projectRestore.actionKey} scope={projectActionScope}>
              <ConfirmActionButton label="Restore Project" message={`Restore project ${project.name}?`} onConfirm={() => statusProjectMutation.mutate({ status: "active", is_active: true })} />
            </PermissionAction>
          ) : (
            <PermissionAction actionKey={SETTINGS_ACTIONS.projectArchive.actionKey} scope={projectActionScope}>
              <ConfirmActionButton label="Archive Project" message={`Archive project ${project.name}?`} onConfirm={() => statusProjectMutation.mutate({ status: "archived", is_active: false })} />
            </PermissionAction>
          )}
        />
      ) : null}
      <SettingsCreateDialog title="Edit project" open={editOpen} onOpenChange={setEditOpen} onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = getFormValue(form, "name");
        if (!name) {
          setEditFormError("Project name is required.");
          return;
        }
        const status = getFormValue(form, "status") || "active";
        updateProjectMutation.mutate({
          name,
          description: getFormValue(form, "description") || undefined,
          status,
          is_active: status !== "archived"
        });
      }} error={editFormError}>
        <FormField label="Name" required>
          <Input name="name" defaultValue={project.name} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" defaultValue={project.description ?? ""} className={DESCRIPTION_TEXTAREA_CLASS} rows={3} />
        </FormField>
        <FormField label="Status">
          <select name="status" defaultValue={project.is_active === false ? "archived" : project.status ?? "active"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </FormField>
        <FormActions submitLabel="Save Project" isSubmitting={updateProjectMutation.isPending} onCancel={() => setEditOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Assign project owner" open={ownerOpen} onOpenChange={setOwnerOpen} onSubmit={(event) => {
        event.preventDefault();
        const ownerId = Number(getFormValue(event.currentTarget, "owner_id"));
        if (ownerId) ownerMutation.mutate(ownerId);
      }}>
        <FormField label="Workspace member" required>
          <SettingsMemberSelect
            name="owner_id"
            placeholder="Search workspace members…"
            members={(workspaceMembersQuery.data ?? []).map((m) => {
              const user = displayUser(ownerProfiles.get(m.user_id), m.user_id);
              return { userId: m.user_id, name: user.name, email: user.email };
            })}
          />
        </FormField>
        <FormActions submitLabel="Assign Owner" isSubmitting={ownerMutation.isPending} onCancel={() => setOwnerOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Add project member" open={memberOpen} onOpenChange={setMemberOpen} onSubmit={submitProjectMember} error={memberFormError}>
        <FormField label="Workspace member" required>
          <SettingsMemberSelect
            name="user_id"
            placeholder="Search workspace members…"
            members={(workspaceMembersQuery.data ?? []).map((m) => {
              const user = displayUser(ownerProfiles.get(m.user_id), m.user_id);
              return { userId: m.user_id, name: user.name, email: user.email };
            })}
          />
        </FormField>
        <FormField label="Project role">
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">No project role</option>
            {filterVisibleRoles(rolesQuery.data ?? [], false).filter((role) => role.scope === "project" || role.scope === "functional").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </FormField>
        <FormActions submitLabel="Add Member" isSubmitting={addProjectMemberMutation.isPending} onCancel={() => setMemberOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function MembersView({ organizationId, workspaceId }: { organizationId?: number; workspaceId?: number }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isGlobalDirectory = !organizationId && !workspaceId;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState<number | "">("");
  const [inviteWsId, setInviteWsId] = useState<number | "">("");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const membersQuery = useQuery<Array<{ user_id: number; role_id?: number | null; member_role: string }>>({
    queryKey: ["settings", "members", organizationId, workspaceId],
    queryFn: async () => {
      if (organizationId) return settingsApi.listOrganizationMembers(accessToken ?? "", organizationId);
      if (!workspaceId) return [];
      return settingsApi.listWorkspaceMembers(accessToken ?? "", workspaceId);
    },
    enabled: Boolean(accessToken && !isGlobalDirectory && (organizationId || workspaceId))
  });
  const globalUsersQuery = useQuery({
    queryKey: queryKeys.members.list("platform", null),
    queryFn: () => settingsApi.listUsers(accessToken ?? ""),
    enabled: Boolean(accessToken && isGlobalDirectory)
  });
  const globalRoleAssignmentsQuery = useQuery({
    queryKey: ["settings", "global-member-role-assignments"],
    queryFn: () => settingsApi.listRoleAssignments(accessToken ?? ""),
    enabled: Boolean(accessToken && isGlobalDirectory)
  });
  const members = membersQuery.data ?? [];
  const userProfiles = useUserProfiles(members.map((member) => member.user_id));
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const invitationsQuery = useQuery({ queryKey: ["settings", "invitations"], queryFn: () => settingsApi.listInvitations(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roles = rolesQuery.data ?? [];
  const profiles = new Map<number, CoreUser>(userProfiles.data ?? []);
  if (currentUser && !profiles.has(currentUser.id)) profiles.set(currentUser.id, currentUser);
  const scopeOrganizationId = organizationId ?? workspaces.find((workspace) => workspace.id === workspaceId)?.organization_id ?? null;
  const scopeWorkspaceId = workspaceId ?? null;
  const scopedOrganization = organizationId ? organizations.find((organization) => organization.id === organizationId) : undefined;
  const scopedWorkspace = workspaceId ? workspaces.find((workspace) => workspace.id === workspaceId) : undefined;
  const permissions = useCurrentPermissions({ orgId: organizationId ?? undefined, workspaceId: workspaceId ?? undefined });
  const memberActionScope = permissionActionScope(permissions);
  const visibleRoles = filterVisibleRoles(roles, canViewProtectedRoles(currentUser, permissions));
  const canInvite = permissions.can(SETTINGS_ACTIONS.memberInvite.permissionCode);
  const canChangeRoles = permissions.can(SETTINGS_ACTIONS.roleManage.permissionCode);
  const canRemoveMembers = permissions.can(SETTINGS_ACTIONS.memberRemove.permissionCode);
  const inviteScope = workspaceId ? "workspace" : "organization";
  const groupedInviteRoles = groupedRolesForInvite(visibleRoles, inviteScope, false);
  const platformMemberRole = visibleRoles.find((role) => role.key === "platform_member");
  const groupedAllRoles = visibleRoles
    .filter((role) => role.is_active !== false)
    .reduce<Record<string, RoleRecord[]>>((groups, role) => {
      groups[role.scope] = [...(groups[role.scope] ?? []), role];
      return groups;
    }, {});
  const inviteSelectedRole = visibleRoles.find((role) => role.id === Number(inviteRoleId));
  const inviteRoleScopeCategory: "platform" | "organization" | "workspace" | "project" | "team" = (() => {
    const scope = inviteSelectedRole?.scope ?? "";
    if (scope === "organization") return "organization";
    if (scope === "workspace") return "workspace";
    if (scope === "project") return "project";
    if (scope === "team") return "team";
    return "platform";
  })();
  const scopedInvitations = (invitationsQuery.data ?? [])
    .filter((invitation) => (organizationId ? invitation.organization_id === organizationId : true))
    .filter((invitation) => (workspaceId ? invitation.workspace_id === workspaceId : true));
  const memberRows = isGlobalDirectory
    ? buildGlobalMemberRows({ users: globalUsersQuery.data ?? [], roleAssignments: globalRoleAssignmentsQuery.data ?? [], roles: visibleRoles })
    : buildMemberRows({ members, invitations: scopedInvitations, profiles, roles: visibleRoles, organizations, workspaces });
  const filteredRows = memberRows
    .filter((row) => {
      const haystack = `${row.name} ${row.email} ${row.role} ${row.scopeLabel} ${row.status}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (roleFilter && normalizeRole(row.role) !== roleFilter) return false;
      if (!statusFilter && row.kind === "invitation" && row.status !== "pending") return false;
      if (statusFilter && row.status.toLowerCase() !== statusFilter) return false;
      if (scopeFilter && row.scopeType !== scopeFilter) return false;
      return true;
    })
    .sort((left, right) => compareMemberRows(left, right, sortKey));

  const inviteMutation = useMutation({
    // organization_id is null for platform-scoped invites when no org context exists.
    mutationFn: (payload: { email: string; organization_id: number | null; workspace_id?: number | null; role_id?: number | null }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settingsApi.createInvitation(accessToken ?? "", payload as any),
    onSuccess: async (invitation) => {
      setInviteOpen(false);
      setFormError(null);
      setInviteRoleId("");
      setInviteOrgId("");
      setInviteWsId("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.invitations });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Invitation created", message: `${invitation.email} was invited.` });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to invite member.";
      setFormError(message);
      addToast({ type: "error", title: "Invite failed", message });
    }
  });
  const roleMutation = useMutation<unknown, Error, { userId: number; roleId: number }>({
    mutationFn: (payload: { userId: number; roleId: number }) => {
      const role = roles.find((item) => item.id === payload.roleId);
      const updatePayload = { role_id: payload.roleId, member_role: role?.key ?? role?.name?.toLowerCase() ?? null };
      if (organizationId) return settingsApi.updateOrganizationMember(accessToken ?? "", organizationId, payload.userId, updatePayload);
      return settingsApi.updateWorkspaceMember(accessToken ?? "", workspaceId ?? 0, payload.userId, updatePayload);
    },
    onSuccess: async () => {
      setRoleOpen(null);
      setRoleFormError(null);
      await invalidateSettingsAndContext(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["members-page"] });
      addToast({ type: "success", title: "Role assigned" });
    },
    onError: (error) => addToast({ type: "error", title: "Role assignment failed", message: error instanceof Error ? error.message : "Unable to assign role." })
  });
  const removeMutation = useMutation({
    mutationFn: (userId: number) => {
      if (organizationId) return settingsApi.removeOrganizationMember(accessToken ?? "", organizationId, userId);
      return settingsApi.removeWorkspaceMember(accessToken ?? "", workspaceId ?? 0, userId);
    },
    onSuccess: async () => {
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Member removed" });
    },
    onError: (error) => addToast({ type: "error", title: "Remove member failed", message: error instanceof Error ? error.message : "Unable to remove member." })
  });
  const resendMutation = useMutation({
    mutationFn: (invitationId: number) => settingsApi.resendInvitation(accessToken ?? "", invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.invitations });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Invitation resent" });
    },
    onError: (error) => addToast({ type: "error", title: "Resend failed", message: error instanceof Error ? error.message : "Unable to resend invitation." })
  });
  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId: number) => settingsApi.revokeInvitation(accessToken ?? "", invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.invitations });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Invitation cancelled" });
    },
    onError: (error) => addToast({ type: "error", title: "Cancel invite failed", message: error instanceof Error ? error.message : "Unable to cancel invitation." })
  });

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = getFormValue(form, "email");
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    const needsOrg = inviteRoleScopeCategory !== "platform";
    const effectiveOrgId = needsOrg ? (Number(inviteOrgId) || null) : (scopeOrganizationId ?? null);
    if (needsOrg && !effectiveOrgId) {
      setFormError("Select an organization for this role.");
      return;
    }
    const needsWorkspace = inviteRoleScopeCategory === "workspace" || inviteRoleScopeCategory === "project" || inviteRoleScopeCategory === "team";
    const effectiveWsId = needsWorkspace ? (Number(inviteWsId) || null) : scopeWorkspaceId;
    if (needsWorkspace && !effectiveWsId) {
      setFormError("Select a workspace for this role.");
      return;
    }
    inviteMutation.mutate({ email, organization_id: effectiveOrgId, workspace_id: effectiveWsId, role_id: Number(inviteRoleId) || null });
  }

  return (
    <SettingsLayout
      breadcrumbs={[
        { label: "Settings", href: "/settings" },
        ...(organizationId
          ? [
              { label: "Organizations", href: "/settings/organizations" },
              { label: scopedOrganization?.name ?? `Organization ${organizationId}`, href: `/settings/organizations/${organizationId}` },
              { label: "Members" }
            ]
          : workspaceId
            ? [
                { label: "Workspaces", href: "/settings/workspaces" },
                { label: scopedWorkspace?.name ?? `Workspace ${workspaceId}`, href: `/settings/workspaces/${workspaceId}` },
                { label: "Members" }
              ]
            : [{ label: "Members" }])
      ]}
      backHref={organizationId ? `/settings/organizations/${organizationId}` : workspaceId ? `/settings/workspaces/${workspaceId}` : "/settings"}
      backLabel={organizationId ? "Back to Organization" : workspaceId ? "Back to Workspace" : "Back to Settings"}
      parentContext={
        organizationId
          ? {
              label: "Organization",
              title: scopedOrganization?.name ?? `Organization ${organizationId}`,
              description: scopedOrganization?.description ?? undefined,
              meta: `Status: ${scopedOrganization?.is_active === false ? "Inactive" : "Active"}`
            }
          : workspaceId
            ? {
                label: "Workspace",
                title: scopedWorkspace?.name ?? `Workspace ${workspaceId}`,
                description: scopedWorkspace?.description ?? undefined,
                meta: `Organization: ${getOrganizationNameForWorkspace(organizations, workspaces, workspaceId)}`
              }
            : undefined
      }
    >
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members`, active: true },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
          ]}
        />
      ) : null}
      {workspaceId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/workspaces/${workspaceId}` },
            { label: "Members", href: `/settings/workspaces/${workspaceId}/members`, active: true },
            { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams` },
            { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Members"
        description={isGlobalDirectory ? "Global user directory across the platform. Scoped membership is managed from organization, workspace, and project detail pages." : "Invite members, review status, filter membership, and assign roles without using raw database screens."}
        actions={
          <PermissionAction actionKey={SETTINGS_ACTIONS.memberInvite.actionKey} scope={memberActionScope}>
            <QuickCreateButton onClick={() => { setInviteRoleId(String(platformMemberRole?.id ?? "")); setInviteOrgId(""); setInviteWsId(""); setInviteOpen(true); }}>Invite Member</QuickCreateButton>
          </PermissionAction>
        }
      />
      {isGlobalDirectory && !organizations.length ? <SettingsCard title="Global directory" description="Users are visible before an organization exists. Platform-scoped roles (Platform Member, Platform Admin) can be invited immediately. Create an organization first to invite with organization or workspace roles." /> : null}
      {!permissions.isLoading && !permissions.isFetching && !canInvite ? <SettingsCard title="Limited access" description="Your current permissions allow viewing members, but do not include settings.member.invite." /> : null}
      <SettingsCard title="Role model" description="Asthra uses scoped system roles backed by permission mappings. Users receive roles, never direct permissions.">
        <div className="grid gap-2 md:grid-cols-5">
          {DEFAULT_ROLE_MEANINGS.map(([role, meaning]) => (
            <div key={role} className="rounded-md border bg-muted/20 p-3">
              <div className="font-medium">{role}</div>
              <p className="mt-1 text-xs text-muted-foreground">{meaning}</p>
            </div>
          ))}
        </div>
      </SettingsCard>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_160px_160px_180px]">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name or email" />
        <select aria-label="Role filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All roles</option>
          {Array.from(new Set(memberRows.map((row) => normalizeRole(row.role)))).sort().map((role) => <option key={role} value={role}>{roleDisplayName(role)}</option>)}
        </select>
        <select aria-label="Status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
        <select aria-label="Scope filter" value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All scopes</option>
          <option value="platform">Platform</option>
          <option value="organization">Organization</option>
          <option value="workspace">Workspace</option>
          <option value="project">Project</option>
          <option value="team">Team</option>
        </select>
        <select aria-label="Sort members" value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="name">Sort by name</option>
          <option value="email">Sort by email</option>
          <option value="role">Sort by role</option>
          <option value="status">Sort by status</option>
          <option value="date">Sort by joined/invited</option>
        </select>
      </div>
      <SettingsDataTable
        columns={["Name", "Email", "Role", "Scope", "Status", "Joined / Invited", "Last Active", "Actions"]}
        rows={filteredRows.map((row) => {
          if (row.kind === "invitation") {
            return [
              <div key={`${row.id}-name`}><div>{row.name}</div><div className="text-xs text-muted-foreground">Pending invitation</div></div>,
              row.email,
              row.role,
              row.scopeLabel,
              roleDisplayName(row.status),
              row.status === "pending" ? `Last sent: ${formatDate(row.date)}` : formatDate(row.date),
              "Not tracked yet",
              <div key={`${row.id}-actions`} className="flex flex-wrap gap-2">
                {row.status === "pending" ? (
                  <PermissionButton actionKey={SETTINGS_ACTIONS.memberResend.actionKey} scope={memberActionScope} type="button" size="sm" variant="outline" onClick={() => resendMutation.mutate(row.id)}>Resend Invite</PermissionButton>
                ) : null}
                {row.status === "pending" ? (
                  <PermissionButton actionKey={SETTINGS_ACTIONS.memberCancel.actionKey} scope={memberActionScope} type="button" size="sm" variant="outline" onClick={() => cancelInviteMutation.mutate(row.id)}>Cancel Invite</PermissionButton>
                ) : null}
              </div>
            ];
          }
          return [
            <div key={`${row.userId}-name`}><div>{row.name}</div><div className="text-xs text-muted-foreground">User ID {row.userId}</div></div>,
            <div key={`${row.userId}-email`}><div>{row.email}</div>{row.profilePending ? <div className="text-xs text-muted-foreground">Detailed user profile lookup pending</div> : null}</div>,
            row.role,
            row.scopeLabel,
            row.status,
            formatDate(row.date),
            "Not tracked yet",
            <div key={row.userId} className="flex flex-wrap gap-2">
              <SettingsLinkButton href={`/settings/members/${row.userId}`} variant="outline">View</SettingsLinkButton>
              {!isGlobalDirectory ? <PermissionButton actionKey={SETTINGS_ACTIONS.roleManage.actionKey} scope={memberActionScope} type="button" size="sm" variant="outline" onClick={() => { setRoleOpen(row.userId); setRoleFormError(null); }}>Change Role</PermissionButton> : null}
              {!isGlobalDirectory && canRemoveMembers ? (
                <ConfirmActionButton
                  label="Remove"
                  message={`Remove ${row.name} from ${row.scopeLabel}?`}
                  onConfirm={() => removeMutation.mutate(row.userId)}
                />
              ) : null}
            </div>
          ];
        })}
        emptyMessage="No members found"
      />
      <SettingsCreateDialog
        title="Invite member"
        open={inviteOpen}
        onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteRoleId(""); setInviteOrgId(""); setInviteWsId(""); setFormError(null); } }}
        onSubmit={submitInvite}
        error={formError}
      >
        <FormField label="Email" required><Input name="email" type="email" placeholder="teammate@example.com" /></FormField>
        <FormField label="Role">
          <select
            aria-label="Invite role"
            value={inviteRoleId}
            onChange={(e) => { setInviteRoleId(e.target.value); setInviteOrgId(""); setInviteWsId(""); }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Default member</option>
            <RoleSelectOptions groupedRoles={groupedAllRoles} includeDefault={false} />
          </select>
        </FormField>
        {inviteRoleScopeCategory !== "platform" ? (
          <FormField label="Organization" required>
            <select
              aria-label="Invite organization"
              value={inviteOrgId}
              onChange={(e) => { setInviteOrgId(Number(e.target.value) || ""); setInviteWsId(""); }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select organization</option>
              {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </FormField>
        ) : (
          <FormField label="Scope">
            <Input value="Platform scope (no additional scope required)" readOnly />
          </FormField>
        )}
        {(inviteRoleScopeCategory === "workspace" || inviteRoleScopeCategory === "project" || inviteRoleScopeCategory === "team") ? (
          <FormField label="Workspace" required>
            <select
              aria-label="Invite workspace"
              value={inviteWsId}
              onChange={(e) => setInviteWsId(Number(e.target.value) || "")}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select workspace</option>
              {workspaces
                .filter((ws) => !inviteOrgId || ws.organization_id === Number(inviteOrgId))
                .map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
            </select>
          </FormField>
        ) : null}
        <FormActions submitLabel="Invite Member" isSubmitting={inviteMutation.isPending} onCancel={() => { setInviteOpen(false); setInviteRoleId(""); setInviteOrgId(""); setInviteWsId(""); setFormError(null); }} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Change role" open={roleOpen !== null} onOpenChange={(open) => { setRoleOpen(open ? roleOpen : null); if (!open) setRoleFormError(null); }} onSubmit={(event) => {
        event.preventDefault();
        const roleId = Number(getFormValue(event.currentTarget, "role_id"));
        if (!roleId) {
          setRoleFormError("Select a role.");
          return;
        }
        if (roleOpen && roleId) roleMutation.mutate({ userId: roleOpen, roleId });
      }} error={roleFormError}>
        <FormField label="Role" required>
          <select name="role_id" aria-label="Change member role" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <RoleSelectOptions groupedRoles={groupedInviteRoles} includeDefault={false} />
          </select>
        </FormField>
        <FormActions submitLabel="Assign Role" isSubmitting={roleMutation.isPending} onCancel={() => setRoleOpen(null)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

type MemberListRow =
  | {
      kind: "member";
      userId: number;
      name: string;
      email: string;
      role: string;
      scopeType: "platform" | "organization" | "workspace" | "project" | "team";
      scopeId?: number | null;
      scopeLabel: string;
      status: string;
      date?: string;
      profilePending: boolean;
    }
  | {
      kind: "invitation";
      id: number;
      name: string;
      email: string;
      role: string;
      scopeType: "platform" | "organization" | "workspace" | "project" | "team";
      scopeId?: number | null;
      scopeLabel: string;
      status: string;
      date?: string;
    };

function buildMemberRows({
  members,
  invitations,
  profiles,
  roles,
  organizations,
  workspaces
}: {
  members: Array<{ user_id: number; role_id?: number | null; member_role: string; created_at?: string; organization_id?: number; workspace_id?: number }>;
  invitations: InvitationRecord[];
  profiles: Map<number, CoreUser>;
  roles: RoleRecord[];
  organizations: Array<{ id: number; name: string }>;
  workspaces: Array<{ id: number; name: string; organization_id: number }>;
}): MemberListRow[] {
  const activeRows: MemberListRow[] = members.map((member) => {
    const user = displayUser(profiles.get(member.user_id), member.user_id);
    const workspace = member.workspace_id ? workspaces.find((item) => item.id === member.workspace_id) : null;
    const organizationId = member.organization_id ?? workspace?.organization_id;
    const organization = organizationId ? organizations.find((item) => item.id === organizationId) : null;
    const role = roles.find((item) => item.id === member.role_id);
    return {
      kind: "member",
      userId: member.user_id,
      name: user.name,
      email: user.email,
      role: roleNameFromRecord(role, member.member_role),
      scopeType: member.workspace_id ? "workspace" : "organization",
      scopeId: member.workspace_id ?? organizationId ?? null,
      scopeLabel: member.workspace_id
        ? `Workspace: ${workspace?.name ?? member.workspace_id}`
        : `Organization: ${organization?.name ?? member.organization_id ?? "Selected"}`,
      status: user.status,
      date: member.created_at,
      profilePending: !profiles.get(member.user_id)
    };
  });
  const activeKeys = new Set(
    activeRows.map((row) => `${row.email.toLowerCase()}|${row.scopeType}|${row.scopeId ?? "none"}`)
  );
  const invitationRows: MemberListRow[] = invitations.filter((invitation) => {
    const scopeType = invitation.workspace_id ? "workspace" : "organization";
    const scopeId = invitation.workspace_id ?? invitation.organization_id ?? null;
    return !activeKeys.has(`${invitation.email.toLowerCase()}|${scopeType}|${scopeId ?? "none"}`);
  }).map((invitation) => {
    const workspace = invitation.workspace_id ? workspaces.find((item) => item.id === invitation.workspace_id) : null;
    const organization = organizations.find((item) => item.id === invitation.organization_id);
    const role = roles.find((item) => item.id === invitation.role_id);
    return {
      kind: "invitation",
      id: invitation.id,
      name: invitation.email,
      email: invitation.email,
      role: roleNameFromRecord(role, "member"),
      scopeType: invitation.workspace_id ? "workspace" : "organization",
      scopeId: invitation.workspace_id ?? invitation.organization_id ?? null,
      scopeLabel: invitation.workspace_id
        ? `Workspace: ${workspace?.name ?? invitation.workspace_id}`
        : `Organization: ${organization?.name ?? invitation.organization_id}`,
      status: invitation.status,
      date: invitation.updated_at ?? invitation.created_at ?? invitation.expires_at
    };
  });
  return [...activeRows, ...invitationRows];
}

function buildGlobalMemberRows({
  users,
  roleAssignments,
  roles
}: {
  users: CoreUser[];
  roleAssignments: RoleAssignmentRecord[];
  roles: RoleRecord[];
}): MemberListRow[] {
  return users.map((user) => {
    const activeAssignments = roleAssignments.filter((assignment) => assignment.user_id === user.id && assignment.status === "active");
    const assignedRoles = activeAssignments
      .map((assignment) => roles.find((role) => role.id === assignment.role_id))
      .filter((role): role is RoleRecord => Boolean(role));
    const platformRoles = assignedRoles.filter((role) => role.scope === "platform");
    const roleNames = assignedRoles.map((role) => role.name);
    return {
      kind: "member",
      userId: user.id,
      name: displayUser(user, user.id).name,
      email: user.email,
      role: roleNames.length ? roleNames.join(", ") : user.is_superuser ? "Superuser" : "No roles assigned",
      scopeType: platformRoles.length ? "platform" : (activeAssignments[0]?.scope_type as MemberListRow["scopeType"] | undefined) ?? "platform",
      scopeId: platformRoles.length ? null : activeAssignments[0]?.scope_id ?? null,
      scopeLabel: platformRoles.length ? "Platform" : roleDisplayName(activeAssignments[0]?.scope_type ?? "platform"),
      status: user.is_active ? "active" : "inactive",
      date: user.created_at,
      profilePending: false
    };
  });
}

function compareMemberRows(left: MemberListRow, right: MemberListRow, sortKey: string) {
  const leftValue = memberSortValue(left, sortKey);
  const rightValue = memberSortValue(right, sortKey);
  return leftValue.localeCompare(rightValue);
}

function memberSortValue(row: MemberListRow, sortKey: string) {
  if (sortKey === "email") return row.email.toLowerCase();
  if (sortKey === "role") return row.role.toLowerCase();
  if (sortKey === "status") return row.status.toLowerCase();
  if (sortKey === "date") return row.date ?? "";
  return row.name.toLowerCase();
}

export function MemberDetailView({ userId }: { userId: number }) {
  const { organizations, workspaces } = useSettingsData();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignOrgId, setAssignOrgId] = useState<number | "">("");
  const [assignWsId, setAssignWsId] = useState<number | "">("");
  const userQuery = useQuery({ queryKey: ["settings", "user", userId], queryFn: () => settingsApi.getUser(accessToken ?? "", userId), enabled: Boolean(accessToken && userId) });
  const userRolesQuery = useQuery({ queryKey: ["settings", "user-roles", userId], queryFn: () => settingsApi.listUserRoles(accessToken ?? "", userId), enabled: Boolean(accessToken && userId) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roleAssignmentsQuery = useQuery({
    queryKey: ["settings", "role-assignments", userId],
    queryFn: () => settingsApi.listRoleAssignments(accessToken ?? "", { user_id: userId }),
    enabled: Boolean(accessToken && userId)
  });
  const currentPermissions = useCurrentPermissions();
  const effectiveScope = selectedProjectId
    ? { scope_type: "project", scope_id: selectedProjectId }
    : selectedWorkspaceId
      ? { scope_type: "workspace", scope_id: selectedWorkspaceId }
      : selectedOrganizationId
        ? { scope_type: "organization", scope_id: selectedOrganizationId }
        : { scope_type: "platform", scope_id: null };
  const effectivePermissionsQuery = useQuery({
    queryKey: ["settings", "effective-permissions", userId, effectiveScope.scope_type, effectiveScope.scope_id],
    queryFn: () => settingsApi.getUserEffectivePermissions(accessToken ?? "", userId, effectiveScope),
    enabled: Boolean(accessToken && userId)
  });
  const visibleRoles = filterVisibleRoles(rolesQuery.data ?? [], canViewProtectedRoles(currentUser, currentPermissions));
  // Active role_assignments is the source of truth — user_roles only has backward-compat unscoped data.
  const activeAssignments = (roleAssignmentsQuery.data ?? []).filter((a) => a.status === "active");
  const memberRoleIds = activeAssignments.map((assignment) => assignment.role_id);
  const assignSelectedRole = visibleRoles.find((role) => role.id === Number(assignRoleId));
  const assignScopeCategory: "platform" | "organization" | "workspace" | "project" | "team" = (() => {
    const scope = assignSelectedRole?.scope ?? "";
    if (scope === "organization") return "organization";
    if (scope === "workspace") return "workspace";
    if (scope === "project") return "project";
    if (scope === "team") return "team";
    return "platform";
  })();
  const inheritedPermissionsQuery = useQuery({
    queryKey: ["settings", "member-inherited-permissions", userId, memberRoleIds.join(",")],
    queryFn: async () => {
      const mappings = await Promise.all(memberRoleIds.map((roleId) => settingsApi.listRolePermissions(accessToken ?? "", roleId).catch(() => [])));
      return Array.from(new Set(mappings.flat().map((mapping) => mapping.permission_id)));
    },
    enabled: Boolean(accessToken && memberRoleIds.length)
  });
  const assignRoleMutation = useMutation({
    mutationFn: (payload: { role_id: number; scope_type: string; scope_id: number | null }) =>
      settingsApi.createRoleAssignment(accessToken ?? "", { user_id: userId, role_id: payload.role_id, scope_type: payload.scope_type, scope_id: payload.scope_id }),
    onSuccess: async () => {
      setAssignRoleId("");
      setAssignOrgId("");
      setAssignWsId("");
      await queryClient.invalidateQueries({ queryKey: ["settings", "user-roles", userId] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-assignments", userId] });
      await queryClient.invalidateQueries({ queryKey: ["members-page"] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
      addToast({ type: "success", title: "Role assigned" });
    },
    onError: (error) => addToast({ type: "error", title: "Role assignment failed", message: error instanceof Error ? error.message : "Unable to assign role." })
  });
  const removeRoleMutation = useMutation({
    mutationFn: (assignmentId: number) => settingsApi.deleteRoleAssignment(accessToken ?? "", assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "user-roles", userId] });
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-assignments", userId] });
      await queryClient.invalidateQueries({ queryKey: ["members-page"] });
      addToast({ type: "success", title: "Role removed" });
    },
    onError: (error) => addToast({ type: "error", title: "Role removal failed", message: error instanceof Error ? error.message : "Unable to remove role." })
  });
  const user = userQuery.data;
  const availableRoles = visibleRoles.filter((role) => !memberRoleIds.includes(role.id));
  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Members", href: "/settings/members" }, { label: displayUser(user, userId).name }]}
      backHref="/settings/members"
      backLabel="Back to Members"
      parentContext={{ label: "Member", title: displayUser(user, userId).name, meta: "Detailed user profile lookup pending when core-service returns only membership IDs." }}
    >
      <SettingsSectionHeader title={displayUser(user, userId).name} description="Member details, assigned roles, teams, projects, and activity placeholders." />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Email</dt><dd>{displayUser(user, userId).email}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{displayUser(user, userId).status}</dd></div>
          <div><dt className="text-muted-foreground">Job Title</dt><dd>{user?.job_title ?? "Not set"}</dd></div>
          <div><dt className="text-muted-foreground">Joined</dt><dd>{formatDate(user?.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Legacy Role Permissions Count</dt><dd>{inheritedPermissionsQuery.data?.length ?? 0}</dd></div>
          <div><dt className="text-muted-foreground">Effective Permissions Count</dt><dd>{effectivePermissionsQuery.data?.permission_codes.length ?? 0}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Scoped Role Assignments" description="Roles are assigned to this user at platform, organization, workspace, project, or team scope. Permissions come from the assigned roles.">
        <SettingsDataTable
          columns={["Role", "Scope Type", "Scope ID", "Status", "Assigned", "Revoked"]}
          rows={(roleAssignmentsQuery.data ?? []).map((assignment: RoleAssignmentRecord) => [
            roleNameById(visibleRoles, assignment.role_id),
            roleDisplayName(assignment.scope_type),
            assignment.scope_id ?? "Global",
            roleDisplayName(assignment.status),
            formatDate(assignment.assigned_at),
            formatDate(assignment.revoked_at)
          ])}
          emptyMessage="No scoped role assignments"
        />
      </SettingsCard>
      <SettingsCard title="Effective Permissions" description={`Resolved for ${roleDisplayName(effectiveScope.scope_type)} ${effectiveScope.scope_id ?? "global"}. Higher-scope roles are inherited where applicable.`}>
        <div className="space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="font-medium">Direct roles</div>
              <div className="mt-1 text-muted-foreground">
                {(effectivePermissionsQuery.data?.active_roles ?? []).map((role) => String(role.name ?? role.key ?? "Role")).join(", ") || "No direct roles"}
              </div>
            </div>
            <div>
              <div className="font-medium">Inherited roles</div>
              <div className="mt-1 text-muted-foreground">
                {(effectivePermissionsQuery.data?.inherited_roles ?? []).map((role) => String(role.name ?? role.key ?? "Role")).join(", ") || "No inherited roles"}
              </div>
            </div>
          </div>
          {Object.entries(groupPermissionCodesByModule(effectivePermissionsQuery.data?.permission_codes ?? [])).map(([module, codes]) => (
            <div key={module} className="rounded-md border p-3">
              <div className="mb-2 text-sm font-medium">{moduleLabel(module)}</div>
              <div className="flex flex-wrap gap-2">
                {codes.map((code) => <span key={code} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{code}</span>)}
              </div>
            </div>
          ))}
          {!effectivePermissionsQuery.data?.permission_codes.length ? <p className="text-sm text-muted-foreground">No effective permissions resolved for this scope.</p> : null}
        </div>
      </SettingsCard>
      <SettingsCard
        title="Current Roles"
        description="Users receive roles. Inherited permissions are calculated from assigned role mappings."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Assign member role"
              value={assignRoleId}
              onChange={(event) => { setAssignRoleId(event.target.value); setAssignOrgId(""); setAssignWsId(""); }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select role</option>
              {availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            {assignScopeCategory !== "platform" ? (
              <select
                aria-label="Assign organization"
                value={assignOrgId}
                onChange={(e) => { setAssignOrgId(Number(e.target.value) || ""); setAssignWsId(""); }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select org</option>
                {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
            ) : null}
            {(assignScopeCategory === "workspace" || assignScopeCategory === "project" || assignScopeCategory === "team") ? (
              <select
                aria-label="Assign workspace"
                value={assignWsId}
                onChange={(e) => setAssignWsId(Number(e.target.value) || "")}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select workspace</option>
                {workspaces
                  .filter((ws) => !assignOrgId || ws.organization_id === Number(assignOrgId))
                  .map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
              </select>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={
                !assignRoleId ||
                (assignScopeCategory !== "platform" && !assignOrgId) ||
                ((assignScopeCategory === "workspace" || assignScopeCategory === "project" || assignScopeCategory === "team") && !assignWsId) ||
                assignRoleMutation.isPending
              }
              onClick={() => {
                const scopeId =
                  assignScopeCategory === "workspace" || assignScopeCategory === "project" || assignScopeCategory === "team"
                    ? Number(assignWsId) || null
                    : assignScopeCategory === "organization"
                      ? Number(assignOrgId) || null
                      : null;
                assignRoleMutation.mutate({ role_id: Number(assignRoleId), scope_type: assignScopeCategory, scope_id: scopeId });
              }}
            >
              Assign Role
            </Button>
          </div>
        }
      >
        <SettingsDataTable
          columns={["Role", "Scope", "System Role", "Assigned", "Actions"]}
          rows={activeAssignments.map((assignment) => {
            const role = visibleRoles.find((item) => item.id === assignment.role_id);
            return [
              role?.name ?? `Role ${assignment.role_id}`,
              scopeLabelForAssignment(assignment, organizations, workspaces),
              role?.is_system ? "Yes" : "No",
              formatDate(assignment.assigned_at),
              <Button key={assignment.id} type="button" size="sm" variant="outline" onClick={() => removeRoleMutation.mutate(assignment.id)} disabled={removeRoleMutation.isPending}>Remove</Button>
            ];
          })}
          emptyMessage="No assigned roles"
        />
      </SettingsCard>
      <SettingsCard title="Teams" description="Team membership is shown from team detail pages in this pass. Assignment is available under team administration." />
      <SettingsCard title="Projects" description="Project ownership can be assigned from project detail pages." />
      <SettingsCard title="Activity Placeholder" description="Member audit and activity stream integration is planned for a later platform pass." />
    </SettingsLayout>
  );
}

export function TeamsView({ workspaceId }: { workspaceId?: number }) {
  const { accessToken, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const visibleWorkspaces = workspaceId
    ? workspaces.filter((workspace) => workspace.id === workspaceId)
    : selectedOrganizationId
      ? workspaces.filter((workspace) => workspace.organization_id === selectedOrganizationId)
      : workspaces;
  const targetWorkspaceId = workspaceId ?? (selectedWorkspaceId && visibleWorkspaces.some((workspace) => workspace.id === selectedWorkspaceId) ? selectedWorkspaceId : visibleWorkspaces[0]?.id);
  const targetWorkspace = workspaces.find((workspace) => workspace.id === targetWorkspaceId);
  const permissions = useCurrentPermissions({ workspaceId: targetWorkspaceId ?? undefined });
  const teamCreateActionScope = permissionActionScope(permissions);
  const canCreateTeam = permissions.can(SETTINGS_ACTIONS.teamCreate.permissionCode);
  const teamsQuery = useQuery({ queryKey: ["settings", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const teams = (teamsQuery.data ?? [])
    .filter((team: TeamRecord) => visibleWorkspaces.some((workspace) => workspace.id === team.workspace_id))
    .filter((team: TeamRecord) => `${team.name} ${team.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const mutation = useMutation({
    mutationFn: (payload: { workspace_id: number; name: string; description?: string }) => settingsApi.createTeam(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.teams });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Team created" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create team.";
      setFormError(message);
      addToast({ type: "error", title: "Team create failed", message });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => settingsApi.deleteTeam(accessToken ?? "", teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "teams"] });
      addToast({ type: "success", title: "Team archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Team archive failed", message: error instanceof Error ? error.message : "Unable to archive team." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspace_id = Number(getFormValue(event.currentTarget, "workspace_id") || targetWorkspaceId);
    const name = getFormValue(event.currentTarget, "name");
    if (!workspace_id || !name) {
      setFormError("Workspace and team name are required.");
      return;
    }
    mutation.mutate({ workspace_id, name, description: getFormValue(event.currentTarget, "description") || undefined });
  }
  return (
    <SettingsLayout
      breadcrumbs={[
        { label: "Settings", href: "/settings" },
        workspaceId ? { label: "Workspaces", href: "/settings/workspaces" } : { label: "Teams", href: "/settings/teams" },
        ...(workspaceId ? [{ label: workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? `Workspace ${workspaceId}`, href: `/settings/workspaces/${workspaceId}` }, { label: "Teams" }] : [])
      ]}
      backHref={workspaceId ? `/settings/workspaces/${workspaceId}` : "/settings"}
      backLabel={workspaceId ? "Back to Workspace" : "Back to Settings"}
      parentContext={workspaceId ? {
        label: "Workspace",
        title: workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? `Workspace ${workspaceId}`,
        description: workspaces.find((workspace) => workspace.id === workspaceId)?.description ?? undefined,
        meta: "Teams group workspace members."
      } : undefined}
    >
      {workspaceId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/workspaces/${workspaceId}` },
            { label: "Members", href: `/settings/workspaces/${workspaceId}/members` },
            { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams`, active: true },
            { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Teams"
        description="Create lightweight workspace teams for future ownership and permissions."
        actions={
          <PermissionAction actionKey={SETTINGS_ACTIONS.teamCreate.actionKey} scope={teamCreateActionScope}>
            <QuickCreateButton onClick={() => setOpen(true)}>Create Team</QuickCreateButton>
          </PermissionAction>
        }
      />
      {!permissions.isLoading && !permissions.isFetching && !canCreateTeam ? <SettingsCard title="Limited access" description="You need settings.team.create to create teams in this workspace scope." /> : null}
      <SearchBox value={search} onChange={setSearch} placeholder="Search teams" />
      <SettingsDataTable
        columns={["Name", "Description", "Members Count", "Lead", "Status", "Actions"]}
        rows={teams.map((team) => [
          team.name,
          team.description ?? "No description",
          "Open detail",
          team.created_by_id ? `User ${team.created_by_id}` : "Not assigned",
          team.is_active === false ? "Archived" : "Active",
          <div key={team.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/teams/${team.id}`} variant="outline">View</SettingsLinkButton>
            <PermissionAction actionKey={SETTINGS_ACTIONS.teamEdit.actionKey} scope={teamCreateActionScope}>
              <SettingsLinkButton href={`/settings/teams/${team.id}`} variant="outline">Edit</SettingsLinkButton>
            </PermissionAction>
            <PermissionAction actionKey={SETTINGS_ACTIONS.teamDelete.actionKey} scope={teamCreateActionScope}>
              <ConfirmActionButton label="Delete" message={`Archive team ${team.name}?`} onConfirm={() => deleteMutation.mutate(team.id)} />
            </PermissionAction>
          </div>
        ])}
        emptyMessage="No teams yet"
      />
      <SettingsCreateDialog title="Create team" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Workspace" required>
          {workspaceId ? (
            <>
              <input type="hidden" name="workspace_id" value={targetWorkspaceId ?? ""} />
              <Input value={targetWorkspace?.name ?? `Workspace ${workspaceId}`} readOnly />
            </>
          ) : (
            <select name="workspace_id" defaultValue={targetWorkspaceId ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {visibleWorkspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
            </select>
          )}
        </FormField>
        <FormField label="Name" required><Input name="name" placeholder="Engineering" /></FormField>
        <FormField label="Description"><textarea name="description" placeholder="Build and operations team" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <FormActions submitLabel="Create Team" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function TeamDetailView({ teamId }: { teamId: number }) {
  const { accessToken, workspaces } = useSettingsData();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const teamQuery = useQuery({ queryKey: ["settings", "team", teamId], queryFn: () => settingsApi.getTeam(accessToken ?? "", teamId), enabled: Boolean(accessToken && teamId) });
  const team = teamQuery.data;
  const permissions = useCurrentPermissions({ workspaceId: team?.workspace_id });
  const teamActionScope = permissionActionScope(permissions);
  const canEditTeam = permissions.can(SETTINGS_ACTIONS.teamEdit.permissionCode);
  const canAddTeamMember = permissions.can(SETTINGS_ACTIONS.teamMemberAdd.permissionCode);
  const canRemoveTeamMember = permissions.can(SETTINGS_ACTIONS.teamMemberRemove.permissionCode);
  const membersQuery = useQuery({ queryKey: ["settings", "team-members", teamId], queryFn: () => settingsApi.listTeamMembers(accessToken ?? "", teamId), enabled: Boolean(accessToken && teamId) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const visibleRoles = filterVisibleRoles(rolesQuery.data ?? [], canViewProtectedRoles(currentUser, permissions));
  const workspaceMembersQuery = useQuery({
    queryKey: ["settings", "workspace-members-for-team", teamQuery.data?.workspace_id],
    queryFn: () => settingsApi.listWorkspaceMembers(accessToken ?? "", teamQuery.data?.workspace_id ?? 0),
    enabled: Boolean(accessToken && teamQuery.data?.workspace_id)
  });
  const teamMembers = membersQuery.data ?? [];
  const profiles = useUserProfiles(teamMembers.map((member: TeamMemberRecord) => member.user_id)).data ?? new Map<number, CoreUser>();
  const workspaceMemberProfiles = useUserProfiles((workspaceMembersQuery.data ?? []).map((member) => member.user_id)).data ?? new Map<number, CoreUser>();
  const updateTeamMutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string; is_active?: boolean }) => settingsApi.updateTeam(accessToken ?? "", teamId, payload),
    onSuccess: async () => {
      setEditOpen(false);
      setEditFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings", "team", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "teams"] }),
        invalidateSettingsAndContext(queryClient)
      ]);
      addToast({ type: "success", title: "Team updated" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update team.";
      setEditFormError(message);
      addToast({ type: "error", title: "Team update failed", message });
    }
  });
  const assignMutation = useMutation({
    mutationFn: (payload: { user_id: number; role_id?: number | null; member_role?: string }) => settingsApi.addTeamMember(accessToken ?? "", teamId, payload),
    onSuccess: async () => {
      setAssignOpen(false);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "team-members", teamId] });
      addToast({ type: "success", title: "Member assigned to team" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to assign member.";
      setFormError(message);
      addToast({ type: "error", title: "Assignment failed", message });
    }
  });
  const removeTeamMemberMutation = useMutation({
    mutationFn: (membershipId: number) => settingsApi.removeTeamMember(accessToken ?? "", teamId, membershipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "team-members", teamId] });
      addToast({ type: "success", title: "Team member removed" });
    },
    onError: (error) => addToast({ type: "error", title: "Team member remove failed", message: error instanceof Error ? error.message : "Unable to remove team member." })
  });
  if (!team) return <SettingsEmptyState title="Team not found" description="Open the teams list or refresh the page." action={<SettingsLinkButton href="/settings/teams">Teams</SettingsLinkButton>} />;

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (!name) {
      setEditFormError("Team name is required.");
      return;
    }
    updateTeamMutation.mutate({
      name,
      description: getFormValue(event.currentTarget, "description") || undefined,
      is_active: getFormValue(event.currentTarget, "is_active") !== "false"
    });
  }

  function submitAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = Number(getFormValue(event.currentTarget, "user_id"));
    const roleId = Number(getFormValue(event.currentTarget, "role_id")) || null;
    if (!userId) {
      setFormError("Select a workspace member.");
      return;
    }
    assignMutation.mutate({ user_id: userId, role_id: roleId, member_role: "member" });
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Teams", href: "/settings/teams" }, { label: team.name }]}
      backHref="/settings/teams"
      backLabel="Back to Teams"
      parentContext={{
        label: "Team",
        title: team.name,
        description: team.description ?? undefined,
        meta: `Workspace: ${workspaces.find((workspace) => workspace.id === team.workspace_id)?.name ?? team.workspace_id}`
      }}
    >
      <SettingsSectionHeader
        title={team.name}
        description={team.description ?? "Team administration."}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionButton actionKey={SETTINGS_ACTIONS.teamEdit.actionKey} scope={teamActionScope} type="button" variant="outline" onClick={() => setEditOpen(true)}>Edit Team</PermissionButton>
            <PermissionAction actionKey={SETTINGS_ACTIONS.teamMemberAdd.actionKey} scope={teamActionScope}>
              <QuickCreateButton onClick={() => setAssignOpen(true)}>Assign Member</QuickCreateButton>
            </PermissionAction>
          </div>
        }
      />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Workspace</dt><dd>{workspaces.find((workspace) => workspace.id === team.workspace_id)?.name ?? team.workspace_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{team.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Lead</dt><dd>{team.created_by_id ? `User ${team.created_by_id}` : "Not assigned"}</dd></div>
          <div><dt className="text-muted-foreground">Members</dt><dd>{teamMembers.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Members">
        <SettingsDataTable
          columns={["Name", "Email", "Role", "Status", "Joined", "Actions"]}
          rows={teamMembers.map((member: TeamMemberRecord) => {
            const user = displayUser(profiles.get(member.user_id), member.user_id);
            return [
              user.name,
              user.email,
              visibleRoles.find((role) => role.id === member.role_id)?.name ?? member.member_role,
              roleDisplayName(member.status ?? user.status),
              formatDate(member.joined_at ?? member.created_at),
              <PermissionAction key={member.id} actionKey={SETTINGS_ACTIONS.teamMemberRemove.actionKey} scope={teamActionScope}>
                <ConfirmActionButton label="Remove" message={`Remove ${user.name} from this team?`} onConfirm={() => removeTeamMemberMutation.mutate(member.id)} />
              </PermissionAction>
            ];
          })}
          emptyMessage="No team members"
        />
      </SettingsCard>
      <SettingsCard title="Projects" description="Project/team links are stored on project memberships. Add users to a project and assign this team from the project detail page." />
      <SettingsCard title="Roles" description="Team scoped roles apply inside this team only. Higher workspace and project roles remain visible in member effective permissions." />
      <SettingsCreateDialog title="Edit team" open={editOpen} onOpenChange={setEditOpen} onSubmit={submitEdit} error={editFormError}>
        <FormField label="Name" required><Input name="name" defaultValue={team.name} /></FormField>
        <FormField label="Description"><textarea name="description" defaultValue={team.description ?? ""} className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <FormField label="Status">
          <select name="is_active" defaultValue={team.is_active === false ? "false" : "true"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="true">Active</option>
            <option value="false">Archived</option>
          </select>
        </FormField>
        <FormActions submitLabel="Save Team" isSubmitting={updateTeamMutation.isPending} onCancel={() => setEditOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Assign member to team" open={assignOpen} onOpenChange={setAssignOpen} onSubmit={submitAssign} error={formError}>
        <FormField label="Workspace member" required>
          <SettingsMemberSelect
            name="user_id"
            placeholder="Search workspace members…"
            members={(workspaceMembersQuery.data ?? []).map((m) => {
              const user = displayUser(workspaceMemberProfiles.get(m.user_id), m.user_id);
              return { userId: m.user_id, name: user.name, email: user.email };
            })}
          />
        </FormField>
        <FormField label="Role">
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Default member</option>
            {visibleRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </FormField>
        <FormActions submitLabel="Assign Member" isSubmitting={assignMutation.isPending} onCancel={() => setAssignOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

type AccessControlSection = "roles" | "permissions" | "mapping" | "assignments" | "registry" | "gaps" | "qa-matrix" | "role-certification";

function AccessControlTabs({ active }: { active: AccessControlSection }) {
  const tabs = [
    { key: "roles", label: "Roles", href: "/settings/access-control" },
    { key: "permissions", label: "Permissions", href: "/settings/access-control/permissions" },
    { key: "mapping", label: "Role Mapping", href: "/settings/access-control/mapping" },
    { key: "assignments", label: "Assignments", href: "/settings/access-control/assignments" },
    { key: "registry", label: "Permission Registry", href: "/settings/access-control/registry" },
    { key: "gaps", label: "Permission Gaps", href: "/settings/access-control/gaps" },
    { key: "qa-matrix", label: "QA Matrix", href: "/settings/access-control/qa-matrix" },
    { key: "role-certification", label: "Role Certification", href: "/settings/access-control/role-certification" }
  ] as const;
  return (
    <nav aria-label="Access Control sections" className="flex flex-wrap gap-2 border-b pb-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            active === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function AccessControlView({ section = "roles" }: { section?: AccessControlSection }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentPermissions = useCurrentPermissions();
  const platformContext = usePlatformContext();
  const canManageRoleMappings = currentPermissions.can(SETTINGS_ACTIONS.roleManage.permissionCode);
  const canCreatePermission = currentPermissions.can(SETTINGS_ACTIONS.permissionManage.permissionCode);
  const accessControlActionScope = permissionActionScope(currentPermissions);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleCreateOpen, setRoleCreateOpen] = useState(false);
  const [permissionCreateOpen, setPermissionCreateOpen] = useState(false);
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false);
  const [assignmentFormError, setAssignmentFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionRegistryQuery = useQuery({ queryKey: ["settings", "permission-registry"], queryFn: () => settingsApi.listPermissionRegistry(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionGapsQuery = useQuery({ queryKey: ["settings", "permission-gaps"], queryFn: () => settingsApi.listPermissionGaps(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionInventoryQuery = useQuery({ queryKey: ["settings", "permission-inventory"], queryFn: () => settingsApi.getPermissionInventory(accessToken ?? ""), enabled: Boolean(accessToken) });
  const syncPreviewQuery = useQuery({ queryKey: ["settings", "permission-registry-sync-preview"], queryFn: () => settingsApi.previewPermissionRegistrySync(accessToken ?? ""), enabled: Boolean(accessToken && section === "registry") });
  const roleMappingSuggestionsQuery = useQuery({ queryKey: ["settings", "role-mapping-suggestions"], queryFn: () => settingsApi.listRoleMappingSuggestions(accessToken ?? ""), enabled: Boolean(accessToken && section === "mapping") });
  const roleTemplatesQuery = useQuery({ queryKey: ["settings", "role-templates"], queryFn: () => settingsApi.listRoleTemplates(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roleAssignmentsQuery = useQuery({ queryKey: ["settings", "role-assignments"], queryFn: () => settingsApi.listRoleAssignments(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rawRoles = rolesQuery.data ?? [];
  const roles = filterVisibleRoles(rawRoles, canViewProtectedRoles(currentUser, currentPermissions));
  const roleTemplates = filterVisibleRoleTemplates(roleTemplatesQuery.data ?? [], canViewProtectedRoles(currentUser, currentPermissions));
  const permissions = permissionsQuery.data ?? [];
  const rolePermissionsQuery = useQuery({
    queryKey: ["settings", "role-permissions", roles.map((role) => role.id).join(",")],
    queryFn: async () => {
      const mappings = await Promise.all(roles.map(async (role) => [role.id, await settingsApi.listRolePermissions(accessToken ?? "", role.id)] as const));
      return Object.fromEntries(mappings) as Record<number, Array<{ id: number; role_id: number; permission_id: number }>>;
    },
    enabled: Boolean(accessToken && roles.length)
  });
  const membersQuery = useQuery({
    queryKey: ["settings", "access-control-members", organizations.map((item) => item.id).join(","), workspaces.map((item) => item.id).join(",")],
    queryFn: async () => {
      const organizationMembers = await Promise.all(organizations.map((organization) => settingsApi.listOrganizationMembers(accessToken ?? "", organization.id).catch(() => [])));
      const workspaceMembers = await Promise.all(workspaces.map((workspace) => settingsApi.listWorkspaceMembers(accessToken ?? "", workspace.id).catch(() => [])));
      return [...organizationMembers.flat(), ...workspaceMembers.flat()];
    },
    enabled: Boolean(accessToken)
  });
  const rolePermissionMap = rolePermissionsQuery.data ?? {};
  const members = membersQuery.data ?? [];
  const filteredPermissions = permissions
    .filter((permission) => `${permission.code} ${permission.name} ${permission.description ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    .filter((permission) => (moduleFilter ? permissionModule(permission) === moduleFilter : true))
    .filter((permission) => (resourceFilter ? permission.resource === resourceFilter : true))
    .filter((permission) => (actionFilter ? permission.action === actionFilter : true))
    .filter((permission) => (scopeFilter ? permission.scope === scopeFilter : true))
    .filter((permission) => (riskFilter ? permission.risk_level === riskFilter : true))
    .filter((permission) => (sourceFilter ? permission.source === sourceFilter : true))
    .filter((permission) => (statusFilter ? (permission.status ?? (permission.is_active === false ? "inactive" : "active")) === statusFilter : true));
  const groupedPermissions = groupPermissionsByModule(filteredPermissions);
  const modules = Array.from(new Set([...ACCESS_CONTROL_MODULES, ...permissions.map(permissionModule)])).sort();
  const resources = Array.from(new Set(permissions.map((permission) => permission.resource).filter(Boolean) as string[])).sort();
  const actions = Array.from(new Set(permissions.map((permission) => permission.action).filter(Boolean) as string[])).sort();
  const scopes = Array.from(new Set(permissions.map((permission) => permission.scope).filter(Boolean) as string[])).sort();
  const risks = Array.from(new Set(permissions.map((permission) => permission.risk_level).filter(Boolean) as string[])).sort();
  const sources = Array.from(new Set(permissions.map((permission) => permission.source).filter(Boolean) as string[])).sort();
  const statuses = Array.from(new Set(permissions.map((permission) => permission.status ?? (permission.is_active === false ? "inactive" : "active")))).sort();
  const registryItems = permissionRegistryQuery.data ?? [];
  const registryModules = Array.from(new Set(registryItems.map((item) => item.module))).sort();
  const missingRegistryCount = registryItems.filter((item) => !item.exists || item.status !== "active").length;
  const inventory = permissionInventoryQuery.data;
  const createRoleMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; scope: string }) => settingsApi.createRole(accessToken ?? "", { ...payload, is_system: false, is_editable: true }),
    onSuccess: async () => {
      setRoleCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Custom role created" });
    },
    onError: (error) => addToast({ type: "error", title: "Role create failed", message: error instanceof Error ? error.message : "Unable to create role." })
  });
  const createPermissionMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description?: string; module: string; scope: string; status: string }) => settingsApi.createPermission(accessToken ?? "", payload),
    onSuccess: async () => {
      setPermissionCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.permissions });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Permission created" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission create failed", message: error instanceof Error ? error.message : "Unable to create permission." })
  });
  const createAssignmentMutation = useMutation({
    mutationFn: (payload: { user_id: number; role_id: number; scope_type: string; scope_id?: number | null }) => settingsApi.createRoleAssignment(accessToken ?? "", payload),
    onSuccess: async () => {
      setAssignmentCreateOpen(false);
      setAssignmentFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-assignments"] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Role assignment created" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create role assignment.";
      setAssignmentFormError(message);
      addToast({ type: "error", title: "Assignment failed", message });
    }
  });
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: number) => settingsApi.deleteRoleAssignment(accessToken ?? "", assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-assignments"] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Role assignment revoked" });
    },
    onError: (error) => addToast({ type: "error", title: "Assignment revoke failed", message: error instanceof Error ? error.message : "Unable to revoke assignment." })
  });
  const syncRegistryMutation = useMutation({
    mutationFn: () => settingsApi.syncPermissionRegistry(accessToken ?? ""),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings", "permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "permission-registry"] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "permission-gaps"] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "permission-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["settings", "permission-registry-sync-preview"] }),
        invalidateSettingsAndContext(queryClient)
      ]);
      addToast({ type: "success", title: "Permission registry synced", message: `${result.created_count} created, ${result.updated_count} updated, ${result.deprecated_count} deprecated.` });
    },
    onError: (error) => addToast({ type: "error", title: "Permission sync failed", message: error instanceof Error ? error.message : "Unable to sync permissions." })
  });

  function submitCustomRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    const scope = getFormValue(event.currentTarget, "scope") || "project";
    if (name) {
      createRoleMutation.mutate({
        name,
        scope,
        description: getFormValue(event.currentTarget, "description") || undefined
      });
    }
  }

  function submitPermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getFormValue(event.currentTarget, "code");
    const name = getFormValue(event.currentTarget, "name");
    if (code && name) {
      createPermissionMutation.mutate({
        code,
        name,
        description: getFormValue(event.currentTarget, "description") || undefined,
        module: getFormValue(event.currentTarget, "module") || code.split(".")[0] || "settings",
        scope: getFormValue(event.currentTarget, "scope") || "workspace",
        status: getFormValue(event.currentTarget, "status") || "active"
      });
    }
  }

  function submitRoleAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = Number(getFormValue(event.currentTarget, "user_id"));
    const roleId = Number(getFormValue(event.currentTarget, "role_id"));
    const scopeType = getFormValue(event.currentTarget, "scope_type") || "project";
    const rawScopeId = getFormValue(event.currentTarget, "scope_id");
    const scopeId = scopeType === "platform" || !rawScopeId ? null : Number(rawScopeId);
    if (!userId || !roleId) {
      setAssignmentFormError("User ID and role are required.");
      return;
    }
    createAssignmentMutation.mutate({ user_id: userId, role_id: roleId, scope_type: scopeType, scope_id: scopeId });
  }

  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Access Control" }]}
      backHref="/settings"
      backLabel="Back to Settings"
      parentContext={{
        label: "Access Control",
        title: "Role Based Access Control",
        description: "Users receive roles, roles contain permissions, and permissions drive access across Asthra.",
        meta: `${roles.length} roles / ${permissions.length} permissions / ${roleTemplates.length} templates`
      }}
    >
      <SettingsSectionHeader
        title="Access Control"
        description="Unified RBAC center for roles, permission catalog, and role-permission mapping."
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionAction actionKey={SETTINGS_ACTIONS.roleCreate.actionKey} scope={accessControlActionScope}>
              <QuickCreateButton onClick={() => setRoleCreateOpen(true)}>Create Custom Role</QuickCreateButton>
            </PermissionAction>
            <PermissionButton actionKey={SETTINGS_ACTIONS.roleManage.actionKey} scope={accessControlActionScope} type="button" variant="outline" onClick={() => setAssignmentCreateOpen(true)}>Assign Role</PermissionButton>
            <PermissionButton actionKey={SETTINGS_ACTIONS.permissionCreate.actionKey} scope={accessControlActionScope} type="button" variant="outline" onClick={() => setPermissionCreateOpen(true)}>Create Permission</PermissionButton>
          </div>
        }
      />
      <AccessControlTabs active={section} />
      <SettingsCard title="Current User Permissions" description="Debug view for the active Settings scope. Backend enforcement uses these permission codes.">
        <div className="grid gap-4 text-sm lg:grid-cols-3">
          <div>
            <div className="font-medium">Current scope</div>
            <div className="mt-1 text-muted-foreground">{currentPermissions.data?.scope.scope_type ?? "loading"} {currentPermissions.data?.scope.scope_id ?? ""}</div>
          </div>
          <div>
            <div className="font-medium">Active roles</div>
            <div className="mt-1 max-h-28 overflow-auto text-muted-foreground">
              {(currentPermissions.data?.roles ?? []).map((role) => role.name).join(", ") || "No roles resolved"}
            </div>
          </div>
          <div>
            <div className="font-medium">Active permissions</div>
            <div className="mt-1 max-h-28 overflow-auto text-muted-foreground">
              {currentPermissions.permissionCodes.join(", ") || "No permissions resolved"}
            </div>
          </div>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 border-t pt-4 text-sm">
            <div className="font-medium">Current Context Versions</div>
            <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-4">
              <div>Organization: {platformContext.contextVersions?.organization_version ?? "n/a"}</div>
              <div>Workspace: {platformContext.contextVersions?.workspace_version ?? "n/a"}</div>
              <div>Project: {platformContext.contextVersions?.project_version ?? "n/a"}</div>
              <div>Access: {platformContext.contextVersions?.access_version ?? "n/a"}</div>
            </div>
            <div className="mt-4 font-medium">Critical can(action) results</div>
            <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-3">
              {[
                SETTINGS_ACTIONS.organizationEdit,
                SETTINGS_ACTIONS.workspaceEdit,
                SETTINGS_ACTIONS.projectArchive,
                SETTINGS_ACTIONS.projectRestore,
                SETTINGS_ACTIONS.teamCreate,
                SETTINGS_ACTIONS.teamEdit,
                SETTINGS_ACTIONS.memberInvite,
                SETTINGS_ACTIONS.memberRemove
              ].map((action) => (
                <div key={action.actionKey}>{action.actionKey}: {currentPermissions.can(action.permissionCode) ? "yes" : "no"}</div>
              ))}
            </div>
          </div>
        ) : null}
      </SettingsCard>
      {section === "roles" ? (
        <SettingsCard title="Roles" description="System roles are locked templates. Custom roles can be added later without assigning permissions directly to users.">
          <SettingsDataTable
            columns={["Name", "Scope", "System Role", "Members Count", "Permissions Count", "Actions"]}
            rows={roles.map((role) => [
              <div key={`${role.id}-name`}><div className="font-medium">{role.name}</div><div className="text-xs text-muted-foreground">{role.description ?? role.key}</div></div>,
              roleDisplayName(role.scope),
              role.is_system ? "Yes" : "No",
              String(countMembersForRole(role, members)),
              String(rolePermissionMap[role.id]?.length ?? 0),
              <div key={role.id} className="flex flex-wrap gap-2">
                <SettingsLinkButton href={`/settings/access-control/roles/${role.id}`} variant="outline">{role.is_editable === false ? "View" : "View/Edit"}</SettingsLinkButton>
              </div>
            ])}
            emptyMessage="No roles yet"
          />
        </SettingsCard>
      ) : null}
      {section === "permissions" ? (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_repeat(3,180px)] xl:grid-cols-[minmax(0,1fr)_repeat(6,160px)]">
            <SearchBox value={search} onChange={setSearch} placeholder="Search permissions" />
            <select aria-label="Permission module filter" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All modules</option>
              {modules.map((module) => <option key={module} value={module}>{moduleLabel(module)}</option>)}
            </select>
            <select aria-label="Permission resource filter" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All resources</option>
              {resources.map((resource) => <option key={resource} value={resource}>{roleDisplayName(resource)}</option>)}
            </select>
            <select aria-label="Permission action filter" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All actions</option>
              {actions.map((action) => <option key={action} value={action}>{roleDisplayName(action)}</option>)}
            </select>
            <select aria-label="Permission scope filter" value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All scopes</option>
              {scopes.map((scope) => <option key={scope} value={scope}>{roleDisplayName(scope)}</option>)}
            </select>
            <select aria-label="Permission risk filter" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All risk</option>
              {risks.map((risk) => <option key={risk} value={risk}>{roleDisplayName(risk)}</option>)}
            </select>
            <select aria-label="Permission source filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All sources</option>
              {sources.map((source) => <option key={source} value={source}>{roleDisplayName(source)}</option>)}
            </select>
            <select aria-label="Permission status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{roleDisplayName(status)}</option>)}
            </select>
          </div>
          {modules.filter((module) => groupedPermissions[module]?.length).map((module) => (
            <SettingsCard key={module} title={moduleLabel(module)} description={`${groupedPermissions[module].length} permissions`}>
              <SettingsDataTable
                columns={["Code", "Name", "Resource", "Action", "Scope", "Risk", "Source", "Status"]}
                rows={groupedPermissions[module].map((permission) => [
                  permission.code,
                  permission.name,
                  roleDisplayName(permission.resource ?? "unknown"),
                  roleDisplayName(permission.action ?? "unknown"),
                  roleDisplayName(permission.scope),
                  roleDisplayName(permission.risk_level ?? "low"),
                  roleDisplayName(permission.source ?? "custom"),
                  roleDisplayName(permission.status ?? (permission.is_active === false ? "inactive" : "active"))
                ])}
                emptyMessage={`No ${moduleLabel(module)} permissions`}
              />
            </SettingsCard>
          ))}
          {!filteredPermissions.length ? <SettingsEmptyState title="No permissions found" description="Adjust search or module filters." /> : null}
        </div>
      ) : null}
      {section === "mapping" ? (
        <div className="space-y-4">
          <SettingsCard title="Role Mapping Insights" description="Inventory summary for current role-permission mappings. This is diagnostic only; mappings are not auto-changed in Phase A.">
            <div className="grid gap-3 text-sm md:grid-cols-4">
              <div><div className="text-muted-foreground">Total permissions</div><div className="text-2xl font-semibold">{inventory?.total_permissions ?? permissions.length}</div></div>
              <div><div className="text-muted-foreground">High risk</div><div className="text-2xl font-semibold">{inventory?.by_risk?.high ?? permissions.filter((permission) => permission.risk_level === "high").length}</div></div>
              <div><div className="text-muted-foreground">Unmapped</div><div className="text-2xl font-semibold">{inventory?.unmapped_permissions?.length ?? 0}</div></div>
              <div><div className="text-muted-foreground">Broad manage</div><div className="text-2xl font-semibold">{inventory?.broad_permissions?.length ?? permissions.filter((permission) => permission.action === "manage").length}</div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {Object.entries(inventory?.by_module ?? {}).map(([module, count]) => (
                <span key={module} className="rounded-full border px-2 py-1">{moduleLabel(module)}: {count}</span>
              ))}
            </div>
          </SettingsCard>
          <SettingsCard title="Role Mapping Suggestions" description="Suggested permission bundles are read-only. They are not auto-applied to roles.">
            <SettingsDataTable
              columns={["Role", "Suggested Permissions", "High Risk", "Patterns", "Note"]}
              rows={(roleMappingSuggestionsQuery.data ?? []).map((suggestion) => [
                roleDisplayName(suggestion.role_key),
                String(suggestion.suggested_count),
                String(suggestion.high_risk_count),
                suggestion.permission_patterns.join(", "),
                suggestion.note
              ])}
              emptyMessage="No role mapping suggestions"
            />
          </SettingsCard>
          <SettingsCard title="Manage Role Permissions" description="Open a role to view or change its permission assignments. System roles are view-only.">
            <SettingsDataTable
              columns={["Role", "Scope", "System Role", "Permissions Count", "Action"]}
              rows={roles.map((role) => [
                role.name,
                roleDisplayName(role.scope),
                role.is_system ? "Yes" : "No",
                String(rolePermissionMap[role.id]?.length ?? 0),
                <SettingsLinkButton key={role.id} href={`/settings/access-control/roles/${role.id}`} variant="outline">Manage Permissions</SettingsLinkButton>
              ])}
              emptyMessage="No roles available for mapping"
            />
          </SettingsCard>
          <SettingsCard title="Role Mapping Matrix" description="Effective access levels derived from current role-permission mappings.">
            <SettingsDataTable
              columns={["Permission", ...ACCESS_MATRIX_ROLES.map((role) => role.label)]}
              rows={permissions.map((permission) => [
                <div key={permission.id}><div className="font-medium">{permission.name}</div><div className="text-xs text-muted-foreground">{permission.code}</div></div>,
                ...ACCESS_MATRIX_ROLES.map((matrixRole) => {
                  const role = roles.find((item) => item.key === matrixRole.key);
                  const mapped = Boolean(role && rolePermissionMap[role.id]?.some((mapping) => mapping.permission_id === permission.id));
                  return accessLevelForPermission(permission, role, mapped);
                })
              ])}
              emptyMessage="No permissions available for mapping"
            />
          </SettingsCard>
        </div>
      ) : null}
      {section === "assignments" ? (
        <SettingsCard title="Scoped Role Assignments" description="Users receive roles at a scope. Effective permissions are resolved from these assignments plus inherited higher-scope roles.">
          <SettingsDataTable
            columns={["User", "Role", "Scope Type", "Scope Name", "Assigned By", "Assigned On", "Status", "Actions"]}
            rows={(roleAssignmentsQuery.data ?? []).map((assignment: RoleAssignmentRecord) => [
              <SettingsLinkButton key={`${assignment.id}-user`} href={`/settings/members/${assignment.user_id}`} variant="outline">User {assignment.user_id}</SettingsLinkButton>,
              roleNameById(roles, assignment.role_id),
              roleDisplayName(assignment.scope_type),
              scopeLabelForAssignment(assignment, organizations, workspaces),
              assignment.assigned_by ? `User ${assignment.assigned_by}` : "System",
              formatDate(assignment.assigned_at),
              roleDisplayName(assignment.status),
              <ConfirmActionButton key={assignment.id} label="Revoke" message="Revoke this role assignment?" onConfirm={() => deleteAssignmentMutation.mutate(assignment.id)} />
            ])}
            emptyMessage="No scoped role assignments"
          />
        </SettingsCard>
      ) : null}
      {section === "registry" ? (
        <div className="space-y-4">
          <SettingsCard title="Registry Summary" description="Structured module/resource/action registry with safe preview and explicit sync. Role mappings are not auto-applied.">
            <div className="grid gap-3 text-sm md:grid-cols-4">
              <div><div className="text-muted-foreground">Expected permissions</div><div className="text-2xl font-semibold">{registryItems.length}</div></div>
              <div><div className="text-muted-foreground">Missing or inactive</div><div className="text-2xl font-semibold">{missingRegistryCount}</div></div>
              <div><div className="text-muted-foreground">Current catalog</div><div className="text-2xl font-semibold">{inventory?.total_permissions ?? permissions.length}</div></div>
              <div><div className="text-muted-foreground">Preview created</div><div className="text-2xl font-semibold">{syncPreviewQuery.data?.created_count ?? 0}</div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PermissionButton actionKey={SETTINGS_ACTIONS.permissionManage.actionKey} scope={accessControlActionScope} type="button" variant="outline" onClick={() => syncPreviewQuery.refetch()} disabled={syncPreviewQuery.isFetching}>Sync Preview</PermissionButton>
              <PermissionButton
                actionKey={SETTINGS_ACTIONS.permissionManage.actionKey}
                scope={accessControlActionScope}
                type="button"
                onClick={() => {
                  if (window.confirm("Sync registry permissions? Custom permissions will be preserved and role mappings will not be auto-applied.")) {
                    syncRegistryMutation.mutate();
                  }
                }}
                disabled={syncRegistryMutation.isPending}
              >
                Sync Permissions
              </PermissionButton>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
              <div><span className="text-muted-foreground">Updated preview:</span> {syncPreviewQuery.data?.updated_count ?? 0}</div>
              <div><span className="text-muted-foreground">Deprecated preview:</span> {syncPreviewQuery.data?.deprecated_count ?? 0}</div>
              <div><span className="text-muted-foreground">Custom skipped:</span> {syncPreviewQuery.data?.skipped_custom_count ?? 0}</div>
              <div><span className="text-muted-foreground">Errors:</span> {syncPreviewQuery.data?.errors.length ?? 0}</div>
            </div>
          </SettingsCard>
          {registryModules.map((module) => {
            const moduleItems = registryItems.filter((item) => item.module === module);
            return (
              <SettingsCard key={module} title={`${moduleLabel(module)} Registry`} description={`${moduleItems.length} generated action permissions`}>
                <SettingsDataTable
                  columns={["Permission", "Resource", "Action", "Scope", "Risk", "Sync Status"]}
                  rows={moduleItems.map((item) => [
                    <div key={item.code}><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.code}</div></div>,
                    roleDisplayName(item.resource),
                    roleDisplayName(item.action),
                    roleDisplayName(item.scope),
                    roleDisplayName(item.risk_level),
                    item.exists ? roleDisplayName(item.status) : "Missing"
                  ])}
                  emptyMessage={`No ${moduleLabel(module)} registry permissions`}
                />
              </SettingsCard>
            );
          })}
          {!registryItems.length && !permissionRegistryQuery.isLoading ? <SettingsEmptyState title="No registry permissions" description="The backend registry endpoint returned no generated permissions." /> : null}
        </div>
      ) : null}
      {section === "gaps" ? (
        <SettingsCard
          title="Permission Gaps"
          description="Registry permissions that are missing, inactive, or deprecated. These are the action keys that need catalog attention before UI or backend enforcement can rely on them."
          actions={
            <PermissionButton
              actionKey={SETTINGS_ACTIONS.permissionManage.actionKey}
              scope={accessControlActionScope}
              type="button"
              variant="outline"
              onClick={() => {
                if (window.confirm("Generate missing registry permissions? This will not map permissions to roles automatically.")) {
                  syncRegistryMutation.mutate();
                }
              }}
              disabled={syncRegistryMutation.isPending}
            >
              Generate Missing Permissions
            </PermissionButton>
          }
        >
          <SettingsDataTable
            columns={["Module", "Resource", "Action", "Expected Code", "Status", "Suggested Fix"]}
            rows={(permissionGapsQuery.data ?? []).map((gap) => [
              moduleLabel(gap.module),
              roleDisplayName(gap.resource),
              roleDisplayName(gap.action),
              gap.expected_permission_code,
              roleDisplayName(gap.status),
              gap.suggested_fix
            ])}
            emptyMessage="No permission gaps"
          />
        </SettingsCard>
      ) : null}
      {section === "qa-matrix" ? (
        <SettingsCard
          title="Permission QA Matrix"
          description="Development and admin view for validating action keys, required permissions, and current allow/deny results."
        >
          {process.env.NODE_ENV === "production" && !canManageRoleMappings ? (
            <SettingsEmptyState title="QA matrix unavailable" description="This diagnostic view is available to Access Control administrators." />
          ) : (
            <SettingsDataTable
              columns={["Action", "Permission", "Module", "Resource", "Scope", "Risk", "Result"]}
              rows={listActionDefinitions().map((action) => [
                action.actionKey,
                action.permissionCode,
                moduleLabel(action.module),
                roleDisplayName(action.resource),
                roleDisplayName(action.scopeResolver),
                roleDisplayName(action.riskLevel),
                currentPermissions.isLoading || currentPermissions.isFetching
                  ? "Checking"
                  : currentPermissions.can(action.permissionCode)
                    ? "Allowed"
                    : "Denied"
              ])}
              emptyMessage="No registered actions"
            />
          )}
        </SettingsCard>
      ) : null}
      <SettingsCreateDialog title="Create custom role" open={roleCreateOpen && canManageRoleMappings} onOpenChange={setRoleCreateOpen} onSubmit={submitCustomRole}>
        <FormField label="Name" required><Input name="name" placeholder="QA Lead" /></FormField>
        <FormField label="Scope">
          <select name="scope" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="project">
            {["platform", "organization", "workspace", "project", "team", "functional"].map((scope) => <option key={scope} value={scope}>{roleDisplayName(scope)}</option>)}
          </select>
        </FormField>
        <FormField label="Description"><textarea name="description" placeholder="Custom access role for this team" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <FormActions submitLabel="Create Custom Role" isSubmitting={createRoleMutation.isPending} onCancel={() => setRoleCreateOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Create permission" open={permissionCreateOpen && canCreatePermission} onOpenChange={setPermissionCreateOpen} onSubmit={submitPermission}>
        <FormField label="Code" required><Input name="code" placeholder="flow.custom.view" /></FormField>
        <FormField label="Name" required><Input name="name" placeholder="View custom Flow area" /></FormField>
        <FormField label="Module"><Input name="module" placeholder="flow" /></FormField>
        <FormField label="Scope">
          <select name="scope" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="workspace">
            {["platform", "organization", "workspace", "project", "team", "functional"].map((scope) => <option key={scope} value={scope}>{roleDisplayName(scope)}</option>)}
          </select>
        </FormField>
        <FormField label="Description"><textarea name="description" placeholder="What this permission allows" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <input type="hidden" name="status" value="active" />
        <FormActions submitLabel="Create Permission" isSubmitting={createPermissionMutation.isPending} onCancel={() => setPermissionCreateOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Assign scoped role" open={assignmentCreateOpen && canManageRoleMappings} onOpenChange={setAssignmentCreateOpen} onSubmit={submitRoleAssignment} error={assignmentFormError}>
        <FormField label="User ID" required><Input name="user_id" type="number" min="1" placeholder="1" /></FormField>
        <FormField label="Role" required>
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name} ({roleDisplayName(role.scope)})</option>)}
          </select>
        </FormField>
        <FormField label="Scope type">
          <select name="scope_type" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="project">
            {["platform", "organization", "workspace", "project", "team"].map((scope) => <option key={scope} value={scope}>{roleDisplayName(scope)}</option>)}
          </select>
        </FormField>
        <FormField label="Scope ID"><Input name="scope_id" type="number" min="1" placeholder="Leave blank for platform" /></FormField>
        <FormActions submitLabel="Assign Role" isSubmitting={createAssignmentMutation.isPending} onCancel={() => setAssignmentCreateOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function RolesView({ organizationId }: { organizationId?: number }) {
  if (!organizationId) return <AccessControlView section="roles" />;
  const { accessToken, organizations } = useSettingsData();
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentPermissions = useCurrentPermissions({ orgId: organizationId });
  const canManageRoleMappings = currentPermissions.can(SETTINGS_ACTIONS.roleManage.permissionCode);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roles = filterVisibleRoles(rolesQuery.data ?? [], canViewProtectedRoles(currentUser, currentPermissions))
    .filter((role: RoleRecord) => (organizationId ? role.organization_id === organizationId || role.organization_id == null : true))
    .filter((role: RoleRecord) => `${role.name} ${role.description ?? ""} ${role.scope}`.toLowerCase().includes(search.toLowerCase()));
  const scopedOrganization = organizationId ? organizations.find((organization) => organization.id === organizationId) : undefined;
  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; organization_id?: number; scope?: string }) => settingsApi.createRole(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Role created" });
    },
    onError: (error) => addToast({ type: "error", title: "Role create failed", message: error instanceof Error ? error.message : "Unable to create role." })
  });
  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => settingsApi.deleteRole(accessToken ?? "", roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Role archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Role archive failed", message: error instanceof Error ? error.message : "Unable to archive role." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (name) mutation.mutate({ name, description: getFormValue(event.currentTarget, "description") || undefined, organization_id: organizationId, scope: "organization" });
  }
  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: organizationId ? "Organizations" : "Roles", href: organizationId ? "/settings/organizations" : "/settings/roles" }, ...(organizationId ? [{ label: scopedOrganization?.name ?? `Organization ${organizationId}`, href: `/settings/organizations/${organizationId}` }, { label: "Roles" }] : [])]}
      backHref={organizationId ? `/settings/organizations/${organizationId}` : "/settings"}
      backLabel={organizationId ? "Back to Organization" : "Back to Settings"}
      parentContext={organizationId ? { label: "Organization", title: scopedOrganization?.name ?? `Organization ${organizationId}`, description: scopedOrganization?.description ?? undefined, meta: "Scoped roles for this organization." } : undefined}
    >
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members` },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles`, active: true },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Roles"
        description="Define role records for future access-control assignment."
        actions={canManageRoleMappings ? <QuickCreateButton onClick={() => setOpen(true)}>Create Role</QuickCreateButton> : undefined}
      />
      {!canManageRoleMappings ? <SettingsCard title="Limited access" description="You need settings.role.manage to create, edit, or archive roles." /> : null}
      <SearchBox value={search} onChange={setSearch} placeholder="Search roles" />
      <SettingsDataTable
        columns={["Name", "Description", "Scope", "Status", "Actions"]}
        rows={roles.map((role) => [
          role.name,
          role.description ?? "No description",
          role.scope,
          role.is_active === false ? "Archived" : "Active",
          <div key={role.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/roles/${role.id}`} variant="outline">View</SettingsLinkButton>
            {canManageRoleMappings ? <SettingsLinkButton href={`/settings/roles/${role.id}`} variant="outline">Edit</SettingsLinkButton> : null}
            {canManageRoleMappings ? <ConfirmActionButton label="Delete" message={`Archive role ${role.name}?`} onConfirm={() => deleteMutation.mutate(role.id)} /> : null}
          </div>
        ])}
        emptyMessage="No roles yet"
      />
      <SettingsCreateDialog title="Create role" open={open && canManageRoleMappings} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Name" required><Input name="name" placeholder="Workspace Admin" /></FormField>
        <FormField label="Description"><textarea name="description" placeholder="Can manage workspace setup" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <FormActions submitLabel="Create Role" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function PermissionsView({ organizationId }: { organizationId?: number } = {}) {
  if (!organizationId) return <AccessControlView section="permissions" />;
  const { accessToken, organizations } = useSettingsData();
  const currentPermissions = useCurrentPermissions({ orgId: organizationId });
  const canManagePermissions = currentPermissions.can(SETTINGS_ACTIONS.permissionManage.permissionCode);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissions = (permissionsQuery.data ?? []).filter((permission: PermissionRecord) => `${permission.code} ${permission.name} ${permission.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const scopedOrganization = organizationId ? organizations.find((organization) => organization.id === organizationId) : undefined;
  const mutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description?: string }) => settingsApi.createPermission(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.permissions });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Permission created" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission create failed", message: error instanceof Error ? error.message : "Unable to create permission." })
  });
  const deleteMutation = useMutation({
    mutationFn: (permissionId: number) => settingsApi.deletePermission(accessToken ?? "", permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.permissions });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Permission archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission archive failed", message: error instanceof Error ? error.message : "Unable to archive permission." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getFormValue(event.currentTarget, "code");
    const name = getFormValue(event.currentTarget, "name");
    if (code && name) mutation.mutate({ code, name, description: getFormValue(event.currentTarget, "description") || undefined });
  }
  return (
    <SettingsLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: organizationId ? "Organizations" : "Permissions", href: organizationId ? "/settings/organizations" : "/settings/permissions" }, ...(organizationId ? [{ label: scopedOrganization?.name ?? `Organization ${organizationId}`, href: `/settings/organizations/${organizationId}` }, { label: "Permissions" }] : [])]}
      backHref={organizationId ? `/settings/organizations/${organizationId}` : "/settings"}
      backLabel={organizationId ? "Back to Organization" : "Back to Settings"}
      parentContext={organizationId ? { label: "Organization", title: scopedOrganization?.name ?? `Organization ${organizationId}`, description: scopedOrganization?.description ?? undefined, meta: "Scoped permission planning for this organization." } : undefined}
    >
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members` },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions`, active: true }
          ]}
        />
      ) : null}
      <SettingsSectionHeader
        title="Permissions"
        description="Permission records are available for future role binding."
        actions={canManagePermissions ? <QuickCreateButton onClick={() => setOpen(true)}>Create Permission</QuickCreateButton> : undefined}
      />
      {!canManagePermissions ? <SettingsCard title="Limited access" description="You need settings.permission.manage to create or archive permissions." /> : null}
      <SearchBox value={search} onChange={setSearch} placeholder="Search permissions" />
      <SettingsDataTable
        columns={["Code", "Name", "Description", "Status", "Actions"]}
        rows={permissions.map((permission) => [
          permission.code,
          permission.name,
          permission.description ?? "No description",
          permission.is_active === false ? "Archived" : "Active",
          <div key={permission.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/permissions/${permission.id}`} variant="outline">View</SettingsLinkButton>
            {canManagePermissions ? <ConfirmActionButton label="Delete" message={`Archive permission ${permission.name}?`} onConfirm={() => deleteMutation.mutate(permission.id)} /> : null}
          </div>
        ])}
        emptyMessage="No permissions yet"
      />
      <SettingsCard title="Permission matrix" description="Legacy scoped planning view. Use Access Control for live role-permission mappings.">
        <SettingsDataTable
          columns={["Permission", "Platform Owner", "Workspace Admin", "Project Manager", "Project Contributor", "Viewer"]}
          rows={permissions.map((permission) => [
            permission.code,
            "Full",
            permission.code.includes(".view") ? "Read" : "Manage",
            permission.code.includes("delete") ? "No" : "Manage",
            permission.code.includes("manage") ? "No" : "Use",
            "Read"
          ])}
          emptyMessage="No permissions to map"
        />
      </SettingsCard>
      <SettingsCreateDialog title="Create permission" open={open && canManagePermissions} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Code" required><Input name="code" placeholder="workspace.manage" /></FormField>
        <FormField label="Name" required><Input name="name" placeholder="Manage workspace" /></FormField>
        <FormField label="Description"><textarea name="description" placeholder="Allows workspace setup changes" className={DESCRIPTION_TEXTAREA_CLASS} rows={3} /></FormField>
        <FormActions submitLabel="Create Permission" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function RoleDetailView({ roleId }: { roleId: number }) {
  const { accessToken } = useSettingsData();
  const currentPermissions = useCurrentPermissions();
  const canManageRoleMappings = currentPermissions.can(SETTINGS_ACTIONS.roleManage.permissionCode);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolePermissionsQuery = useQuery({ queryKey: ["settings", "role-permissions", roleId], queryFn: () => settingsApi.listRolePermissions(accessToken ?? "", roleId), enabled: Boolean(accessToken && roleId) });
  const role = rolesQuery.data?.find((item) => item.id === roleId);
  const addPermissionMutation = useMutation({
    mutationFn: (permissionId: number) => settingsApi.addRolePermission(accessToken ?? "", roleId, permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-permissions", roleId] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Permission assigned" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission assignment failed", message: error instanceof Error ? error.message : "Unable to assign permission." })
  });
  const removePermissionMutation = useMutation({
    mutationFn: (permissionId: number) => settingsApi.removeRolePermission(accessToken ?? "", roleId, permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "role-permissions", roleId] });
      await invalidateSettingsAndContext(queryClient);
      addToast({ type: "success", title: "Permission removed" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission removal failed", message: error instanceof Error ? error.message : "Unable to remove permission." })
  });
  if (!role) return <SettingsEmptyState title="Role not found" description="Open the access control center or refresh the page." action={<SettingsLinkButton href="/settings/access-control">Access Control</SettingsLinkButton>} />;
  const linkedPermissionIds = new Set((rolePermissionsQuery.data ?? []).map((item) => item.permission_id));
  const groupedPermissions = groupPermissionsByModule(permissionsQuery.data ?? []);
  const modules = Array.from(new Set([...ACCESS_CONTROL_MODULES, ...Object.keys(groupedPermissions)])).filter((module) => groupedPermissions[module]?.length);
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Access Control", href: "/settings/access-control" }, { label: "Roles", href: "/settings/access-control" }, { label: role.name }]} backHref="/settings/access-control" backLabel="Back to Access Control" parentContext={{ label: "Role", title: role.name, description: role.description ?? undefined, meta: `Scope: ${roleDisplayName(role.scope)}` }}>
      <SettingsSectionHeader title={role.name} description={role.description ?? "Role detail and permission mapping."} />
      <SettingsCard title="Role Information">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Scope</dt><dd>{roleDisplayName(role.scope)}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{role.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{role.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">System Role</dt><dd>{role.is_system ? "Yes" : "No"}</dd></div>
          <div><dt className="text-muted-foreground">Editable</dt><dd>{role.is_editable === false ? "No" : "Yes"}</dd></div>
          <div><dt className="text-muted-foreground">Assigned Permissions</dt><dd>{linkedPermissionIds.size}</dd></div>
        </dl>
      </SettingsCard>
      {role.is_editable === false ? <SettingsCard title="System Role Locked" description="System role templates are managed by Asthra and cannot be manually edited or remapped." /> : null}
      {!canManageRoleMappings ? <SettingsCard title="View Only" description="You need settings.role.manage to change role-permission mappings." /> : null}
      {modules.map((module) => (
        <SettingsCard key={module} title={`${moduleLabel(module)} Permissions`} description="Assign or remove permissions from this role.">
          <SettingsDataTable
            columns={["Permission", "Scope", "Status", "Assigned", "Action"]}
            rows={(groupedPermissions[module] ?? []).map((permission) => {
              const linked = linkedPermissionIds.has(permission.id);
              return [
                <div key={`${permission.id}-permission`}><div className="font-medium">{permission.name}</div><div className="text-xs text-muted-foreground">{permission.code}</div></div>,
                roleDisplayName(permission.scope),
                roleDisplayName(permission.status ?? (permission.is_active === false ? "inactive" : "active")),
                linked ? "Yes" : "No",
                <label key={`${permission.id}-action`} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={linked}
                    disabled={!canManageRoleMappings || role.is_editable === false || addPermissionMutation.isPending || removePermissionMutation.isPending}
                    onChange={() => linked ? removePermissionMutation.mutate(permission.id) : addPermissionMutation.mutate(permission.id)}
                  />
                  {!canManageRoleMappings || role.is_editable === false ? "View only" : linked ? "Assigned" : "Assign Permission"}
                </label>
              ];
            })}
            emptyMessage={`No ${moduleLabel(module)} permissions`}
          />
        </SettingsCard>
      ))}
      <SettingsCard title="Assigned Members" description="User-role assignments are shown on member detail pages. Bulk role membership editing is planned." />
    </SettingsLayout>
  );
}

export function PermissionDetailView({ permissionId }: { permissionId: number }) {
  const { accessToken } = useSettingsData();
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permission = permissionsQuery.data?.find((item) => item.id === permissionId);
  if (!permission) return <SettingsEmptyState title="Permission not found" description="Open the permissions list or refresh the page." action={<SettingsLinkButton href="/settings/permissions">Permissions</SettingsLinkButton>} />;
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Permissions", href: "/settings/permissions" }, { label: permission.name }]} backHref="/settings/permissions" backLabel="Back to Permissions" parentContext={{ label: "Permission", title: permission.name, description: permission.description ?? undefined, meta: `Code: ${permission.code}` }}>
      <SettingsSectionHeader title={permission.name} description={permission.description ?? "Permission detail."} />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Code</dt><dd>{permission.code}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{permission.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{permission.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(permission.created_at)}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Permission matrix">
        <SettingsDataTable columns={["Platform Owner", "Workspace Admin", "Project Manager", "Project Contributor", "Viewer"]} rows={[["Full", "Manage", "Manage", "Use", "Read"]]} emptyMessage="No matrix mapping" />
      </SettingsCard>
    </SettingsLayout>
  );
}

export function ApiKeysView() {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const apiKeysQuery = useQuery({ queryKey: ["settings", "api-keys"], queryFn: () => settingsApi.listApiKeys(accessToken ?? ""), enabled: Boolean(accessToken) });
  const apiKeys = apiKeysQuery.data ?? [];
  const mutation = useMutation({
    mutationFn: (payload: { name: string; organization_id?: number | null; workspace_id?: number | null; scopes?: string[] }) => settingsApi.createApiKey(accessToken ?? "", payload),
    onSuccess: async (key: ApiKeyRecord) => {
      setCreatedKey(key.api_key ?? null);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "api-keys"] });
    }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (name) mutation.mutate({ name, organization_id: organizations[0]?.id ?? null, workspace_id: workspaces[0]?.id ?? null, scopes: ["read"] });
  }
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "API Keys" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="API Keys" description="Create and review personal API keys for future integrations." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create API Key</QuickCreateButton>} />
      {createdKey ? <SettingsCard title="New API key" description="Copy this value now. Core-service only returns it once."><code className="break-all rounded bg-muted px-2 py-1 text-sm">{createdKey}</code></SettingsCard> : null}
      <SettingsDataTable columns={["Name", "Prefix", "Scopes", "Status"]} rows={apiKeys.map((key) => [key.name, key.key_prefix, key.scopes.join(", ") || "None", key.is_active === false ? "Revoked" : "Active"])} emptyMessage="No API keys yet" />
      <SettingsCreateDialog title="Create API key" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Name" required><Input name="name" placeholder="Local testing key" /></FormField>
        <FormActions submitLabel="Create API Key" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </SettingsLayout>
  );
}

export function PlaceholderSettingsView({ title, description }: { title: string; description: string }) {
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: title }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title={title} description={description} />
      <SettingsEmptyState title={`${title} is planned`} description="This settings area is intentionally a placeholder for the operational foundation. No backend behavior is required yet." />
    </SettingsLayout>
  );
}

export function AccountSettingsView() {
  const user = useAuthStore((state) => state.currentUser);
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Account" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Account" description="Signed-in user identity and account metadata." />
      <SettingsCard title="Profile">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Email</dt><dd>{user?.email ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Name</dt><dd>{user?.full_name ?? "Not set"}</dd></div>
          <div><dt className="text-muted-foreground">User ID</dt><dd>{user?.id ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{user?.is_active ? "Active" : "Unknown"}</dd></div>
        </dl>
      </SettingsCard>
    </SettingsLayout>
  );
}

export function WorkspaceContextSettingsView() {
  const { organizations, workspaces, projects } = useSettingsData();
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const summary = useMemo(
    () => [
      ["Organization", organizations.find((item) => item.id === selectedOrganizationId)?.name ?? "Not selected"],
      ["Workspace", workspaces.find((item) => item.id === selectedWorkspaceId)?.name ?? "Not selected"],
      ["Project", projects.find((item) => item.id === selectedProjectId)?.name ?? "Not selected"]
    ],
    [organizations, projects, selectedOrganizationId, selectedProjectId, selectedWorkspaceId, workspaces]
  );
  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Workspace Context" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Workspace Context" description="Current organization, workspace, and project selection used across Asthra." />
      <SetupSummary />
      <SettingsDataTable columns={["Context", "Selected"]} rows={summary} emptyMessage="No context selected" />
    </SettingsLayout>
  );
}
