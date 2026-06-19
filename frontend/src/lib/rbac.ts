export type RoleName = "owner" | "admin" | "manager" | "member" | "viewer" | string;

export type RoleContext = {
  role?: RoleName | null;
  isSuperuser?: boolean;
};

const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  workspace_viewer: 1,
  project_viewer: 1,
  team_observer: 1,
  organization_auditor: 1,
  member: 2,
  workspace_member: 2,
  project_contributor: 2,
  team_member: 2,
  knowledge_manager: 2,
  manager: 3,
  workspace_manager: 3,
  project_manager: 3,
  team_lead: 3,
  product_owner: 3,
  scrum_master: 3,
  engineering_manager: 3,
  release_manager: 3,
  incident_commander: 3,
  admin: 4,
  platform_admin: 4,
  platform_support: 4,
  organization_admin: 4,
  workspace_admin: 4,
  project_admin: 4,
  owner: 5,
  platform_owner: 5,
  organization_owner: 5
};

export function normalizeRole(role?: RoleName | null) {
  return String(role ?? "viewer").trim().toLowerCase().replaceAll(" ", "_");
}

export function roleRank(role?: RoleName | null) {
  return ROLE_RANK[normalizeRole(role)] ?? ROLE_RANK.viewer;
}

export function hasAtLeastRole(context: RoleContext, minimumRole: RoleName) {
  if (context.isSuperuser) return true;
  return roleRank(context.role) >= roleRank(minimumRole);
}

export function canView(_setting: string, context: RoleContext = {}) {
  return hasAtLeastRole(context, "viewer");
}

export function canManageMembers(context: RoleContext = {}) {
  return canInviteMembers(context);
}

export function canManageRoles(context: RoleContext = {}) {
  return hasAtLeastRole(context, "admin");
}

export function canManageProjects(context: RoleContext = {}) {
  return hasAtLeastRole(context, "manager");
}

export function canEditWork(context: RoleContext = {}) {
  return hasAtLeastRole(context, "member");
}

export function canManagePlatform(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return Boolean(context.isSuperuser || role === "platform_owner" || role === "platform_admin" || role === "owner");
}

export function canManageOrganization(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return canManagePlatform(context) || hasAtLeastRole(context, "admin") || role === "organization_owner" || role === "organization_admin";
}

export function canManageWorkspace(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return canManageOrganization(context) || hasAtLeastRole(context, "manager") || role === "workspace_admin" || role === "workspace_manager";
}

export function canManageProject(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return canManageWorkspace(context) || role === "project_admin" || role === "project_manager";
}

export function canManageTeam(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return canManageWorkspace(context) || role === "team_lead";
}

export function canInviteMembers(context: RoleContext = {}) {
  return canManageWorkspace(context);
}

export function canViewAudit(context: RoleContext = {}) {
  const role = normalizeRole(context.role);
  return canManageOrganization(context) || role === "organization_auditor";
}
