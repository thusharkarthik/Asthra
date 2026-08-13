export type SchemaElementType = "button" | "tab" | "section" | "field" | "action" | "link";

export interface PageSchemaElement {
  key: string;
  label: string;
  permission: string | null;
  type: SchemaElementType;
  description?: string;
}

export interface PageSchema {
  route: string;
  label: string;
  elements: PageSchemaElement[];
}

export const PAGE_SCHEMAS: PageSchema[] = [
  {
    route: "/settings",
    label: "Settings Dashboard",
    elements: [
      { key: "org_section", label: "Organizations section", permission: "settings.organization.view", type: "section" },
      { key: "member_section", label: "Members section", permission: "settings.member.view", type: "section" },
      { key: "workspace_section", label: "Workspaces section", permission: "settings.workspace.view", type: "section" },
    ],
  },
  {
    route: "/settings/organizations",
    label: "Organizations",
    elements: [
      { key: "org_list", label: "Organization list", permission: "settings.organization.view", type: "section" },
      { key: "health_summary", label: "Health summary", permission: null, type: "section", description: "Platform admins and superusers only" },
    ],
  },
  {
    route: "/settings/organizations/:id",
    label: "Organization Detail",
    elements: [
      { key: "members_tab", label: "Members tab", permission: "settings.member.view", type: "tab" },
      { key: "workspaces_tab", label: "Workspaces tab", permission: "settings.workspace.view", type: "tab" },
      { key: "roles_tab", label: "Roles tab", permission: "settings.role.view", type: "tab" },
      { key: "permissions_tab", label: "Permissions tab", permission: "settings.permission.view", type: "tab" },
      { key: "edit_general", label: "Save general settings", permission: "settings.organization.edit", type: "button" },
      { key: "edit_settings", label: "Save org settings", permission: "settings.organization.edit", type: "button" },
      { key: "danger_zone", label: "Danger zone", permission: "settings.organization.delete", type: "action", description: "Organization owner role required" },
    ],
  },
  {
    route: "/settings/members",
    label: "Members",
    elements: [
      { key: "member_list", label: "Member list", permission: "settings.member.view", type: "section" },
      { key: "invite_member", label: "Invite member button", permission: "settings.member.invite", type: "button" },
      { key: "search_filters", label: "Search and filters", permission: "settings.member.view", type: "section" },
      { key: "view_member_button", label: "View member detail", permission: "settings.member.view", type: "action" },
      { key: "change_role_action", label: "Change member role", permission: "settings.role.manage", type: "action" },
      { key: "remove_member_action", label: "Remove member", permission: "settings.member.remove", type: "action" },
    ],
  },
  {
    route: "/settings/workspaces",
    label: "Workspaces",
    elements: [
      { key: "workspace_list", label: "Workspace list", permission: "settings.workspace.view", type: "section" },
      { key: "create_workspace", label: "Create workspace", permission: "settings.workspace.create", type: "button" },
    ],
  },
  {
    route: "/settings/workspaces/:id",
    label: "Workspace Detail",
    elements: [
      { key: "members_tab", label: "Members tab", permission: "settings.member.view", type: "tab" },
      { key: "edit_general", label: "Save general settings", permission: "settings.workspace.edit", type: "button" },
      { key: "danger_zone", label: "Danger zone", permission: null, type: "section", description: "Workspace admin role required" },
    ],
  },
  {
    route: "/settings/projects",
    label: "Projects",
    elements: [
      { key: "project_list", label: "Project list", permission: "settings.workspace.view", type: "section" },
      { key: "create_project", label: "Create project", permission: "settings.workspace.edit", type: "button" },
    ],
  },
  {
    route: "/settings/roles",
    label: "Roles",
    elements: [
      { key: "role_list", label: "Role list", permission: null, type: "section" },
      { key: "create_role", label: "Create role", permission: "settings.role.create", type: "button" },
      { key: "edit_role", label: "Edit role", permission: "settings.role.edit", type: "action" },
      { key: "delete_role", label: "Delete role", permission: "settings.role.delete", type: "action" },
    ],
  },
  {
    route: "/settings/permissions",
    label: "Permissions",
    elements: [
      { key: "permission_list", label: "Permission list", permission: null, type: "section" },
      { key: "assign_permission", label: "Assign permission", permission: "settings.permission.assign", type: "action" },
    ],
  },
  {
    route: "/settings/workspace",
    label: "Workspace Settings",
    elements: [
      { key: "save_general_button", label: "Save general button", permission: "settings.workspace.edit", type: "button" },
      { key: "module_visibility", label: "Module visibility toggles", permission: "settings.workspace.edit", type: "section" },
      { key: "archive_workspace", label: "Archive workspace", permission: "settings.workspace.edit", type: "action" },
    ],
  },
  {
    route: "/settings/audit-logs",
    label: "Audit Logs",
    elements: [
      { key: "audit_filters", label: "Audit filters", permission: "guard.audit.view", type: "section" },
      { key: "audit_table", label: "Audit table", permission: "guard.audit.view", type: "section" },
      { key: "export_button", label: "Export logs", permission: null, type: "button", description: "Not yet implemented" },
    ],
  },
  {
    route: "/settings/api-keys",
    label: "API Keys",
    elements: [
      { key: "api_key_list", label: "API key list", permission: null, type: "section", description: "Personal API keys — no permission required" },
      { key: "create_key_button", label: "Create API key", permission: null, type: "button", description: "Personal key creation" },
      { key: "revoke_key_action", label: "Revoke API key", permission: null, type: "action", description: "Personal key management" },
    ],
  },
  {
    route: "/settings/access-control",
    label: "Access Control",
    elements: [
      { key: "role_list", label: "Role list", permission: null, type: "section" },
      { key: "create_role_button", label: "Create role", permission: "settings.role.create", type: "button" },
      { key: "edit_role_permissions", label: "Edit role permissions", permission: "settings.role.edit", type: "action" },
    ],
  },
  {
    route: "/settings/workspaces/:id/teams",
    label: "Workspace Teams",
    elements: [
      { key: "team_list", label: "Team list", permission: null, type: "section" },
      { key: "create_team", label: "Create team", permission: "settings.team.create", type: "button" },
      { key: "edit_team", label: "Edit team", permission: "settings.team.edit", type: "action" },
      { key: "delete_team", label: "Delete team", permission: "settings.team.delete", type: "action" },
    ],
  },
  {
    route: "/settings/teams/:id",
    label: "Team Detail",
    elements: [
      { key: "member_list", label: "Member list", permission: null, type: "section" },
      { key: "edit_team", label: "Edit team", permission: "settings.team.edit", type: "button" },
      { key: "assign_member", label: "Assign member", permission: "settings.team.member.add", type: "button" },
      { key: "remove_member", label: "Remove member", permission: "settings.team.member.remove", type: "action" },
    ],
  },
  {
    route: "/settings/projects/:id",
    label: "Project Detail",
    elements: [
      { key: "edit_project", label: "Edit project", permission: "settings.project.edit", type: "button" },
      { key: "assign_owner", label: "Assign owner", permission: "settings.project.edit", type: "button" },
      { key: "add_member", label: "Add project member", permission: "settings.project.edit", type: "button" },
      { key: "remove_member", label: "Remove member", permission: "settings.project.edit", type: "action" },
      { key: "archive_project", label: "Archive project", permission: "settings.project.archive", type: "action" },
      { key: "restore_project", label: "Restore project", permission: "settings.project.restore", type: "action" },
    ],
  },
];

function matchesRoute(pathname: string, route: string): boolean {
  const regexStr = route.replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${regexStr}$`).test(pathname);
}

export function findSchemaForRoute(pathname: string): PageSchema | null {
  return PAGE_SCHEMAS.find((s) => matchesRoute(pathname, s.route)) ?? null;
}
