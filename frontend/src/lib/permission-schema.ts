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
      { key: "roles_tab", label: "Roles tab", permission: null, type: "tab" },
      { key: "permissions_tab", label: "Permissions tab", permission: null, type: "tab" },
      { key: "edit_general", label: "Save general settings", permission: "settings.organization.edit", type: "button" },
      { key: "edit_settings", label: "Save org settings", permission: "settings.organization.edit", type: "button" },
      { key: "danger_zone", label: "Danger zone", permission: null, type: "section", description: "Organization owner role required" },
    ],
  },
  {
    route: "/settings/members",
    label: "Members",
    elements: [
      { key: "member_list", label: "Member list", permission: "settings.member.view", type: "section" },
      { key: "invite_member", label: "Invite member", permission: "settings.member.invite", type: "button" },
      { key: "remove_member", label: "Remove member", permission: "settings.member.remove", type: "action" },
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
];

function matchesRoute(pathname: string, route: string): boolean {
  const regexStr = route.replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${regexStr}$`).test(pathname);
}

export function findSchemaForRoute(pathname: string): PageSchema | null {
  return PAGE_SCHEMAS.find((s) => matchesRoute(pathname, s.route)) ?? null;
}
