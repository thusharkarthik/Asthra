// Display and sorting utilities for role names.
// NOT for access control decisions — use can() from platformContext instead.

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
