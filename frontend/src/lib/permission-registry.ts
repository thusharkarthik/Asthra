export type PermissionDefinition = {
  code: string;
  label: string;
  category: string;
  affects: string;
  requires?: string[];
  routes?: string[];
};

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // ─── Organization (Level 1) ───────────────────────────────────────────────
  {
    code: "settings.organization.view",
    label: "View Organizations",
    category: "Organizations",
    affects: "All organization-scoped settings pages (members, workspaces, workspace settings)",
    routes: [
      "/settings/organizations",
      "/settings/organizations/[id]",
      "/settings/members",
      "/settings/workspaces",
      "/settings/workspace",
    ],
  },
  {
    code: "settings.organization.create",
    label: "Create Organizations",
    category: "Organizations",
    affects: "Create Organization button on the organizations page",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations"],
  },
  {
    code: "settings.organization.edit",
    label: "Edit Organizations",
    category: "Organizations",
    affects: "Save General Settings and Save Organization Settings buttons",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]"],
  },
  {
    code: "settings.organization.archive",
    label: "Archive Organizations",
    category: "Organizations",
    affects: "Archive organization action in the danger zone",
    requires: ["settings.organization.view", "settings.organization.edit"],
    routes: ["/settings/organizations/[id]"],
  },
  {
    code: "settings.organization.restore",
    label: "Restore Organizations",
    category: "Organizations",
    affects: "Restore archived organization action",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]"],
  },

  // ─── Members (Level 2+) ───────────────────────────────────────────────────
  {
    code: "settings.member.view",
    label: "View Members",
    category: "Members",
    affects: "Member list, View button, Search and filter controls, Member detail page access",
    requires: ["settings.organization.view"],
    routes: ["/settings/members", "/settings/members/[id]", "/settings/organizations/[id]", "/settings/organizations/[id]/members"],
  },
  {
    code: "settings.member.manage",
    label: "Manage Member Roles",
    category: "Members",
    affects: "Assign Role button, role selector, org/workspace scope selectors, Remove role button in member detail",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members", "/settings/members/[id]"],
  },
  {
    code: "settings.member.view.roles",
    label: "View Member Role Assignments",
    category: "Members",
    affects: "Scoped Role Assignments table and Current Roles card on member detail page",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members/[id]"],
  },
  {
    code: "settings.member.view.permissions",
    label: "View Member Effective Permissions",
    category: "Members",
    affects: "Effective Permissions panel showing inherited and direct roles with permission codes",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members/[id]"],
  },
  {
    code: "settings.member.view.teams",
    label: "View Member Teams",
    category: "Members",
    affects: "Teams section on member detail page",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members/[id]"],
  },
  {
    code: "settings.member.invite",
    label: "Invite Members",
    category: "Members",
    affects: "Invite Member button",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members", "/settings/organizations/[id]/members"],
  },
  {
    code: "settings.member.remove",
    label: "Remove Members",
    category: "Members",
    affects: "Remove button in member rows",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members", "/settings/members/[id]", "/settings/organizations/[id]/members"],
  },
  {
    code: "settings.member.resend",
    label: "Resend Invites",
    category: "Members",
    affects: "Resend Invite button for pending invitations",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members"],
  },
  {
    code: "settings.member.cancel",
    label: "Cancel Invites",
    category: "Members",
    affects: "Cancel Invite button for pending invitations",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members"],
  },

  // ─── Workspaces (Level 2+) ────────────────────────────────────────────────
  {
    code: "settings.workspace.view",
    label: "View Workspaces",
    category: "Workspaces",
    affects: "Workspaces tab in organization detail and workspace settings page",
    requires: ["settings.organization.view"],
    routes: [
      "/settings/workspaces",
      "/settings/workspace",
      "/settings/organizations/[id]",
      "/settings/organizations/[id]/workspaces",
    ],
  },
  {
    code: "settings.workspace.create",
    label: "Create Workspaces",
    category: "Workspaces",
    affects: "Create Workspace button",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/workspaces", "/settings/organizations/[id]/workspaces"],
  },
  {
    code: "settings.workspace.edit",
    label: "Edit Workspace",
    category: "Workspaces",
    affects: "Save General, Save Settings buttons, form fields, and Archive danger zone",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/workspace"],
  },
  {
    code: "settings.workspace.archive",
    label: "Archive Workspace",
    category: "Workspaces",
    affects: "Archive Workspace action in the danger zone",
    requires: ["settings.organization.view", "settings.workspace.view", "settings.workspace.edit"],
    routes: ["/settings/workspace"],
  },
  {
    code: "settings.workspace.restore",
    label: "Restore Workspace",
    category: "Workspaces",
    affects: "Restore archived workspace action",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/workspace"],
  },

  // ─── Roles & Permissions ──────────────────────────────────────────────────
  {
    code: "settings.role.manage",
    label: "Manage Roles",
    category: "Roles & Permissions",
    affects: "Change Role button in member rows",
    requires: ["settings.organization.view", "settings.member.view"],
    routes: ["/settings/members", "/settings/organizations/[id]/members"],
  },
  {
    code: "settings.role.create",
    label: "Create Roles",
    category: "Roles & Permissions",
    affects: "Create Role button in role management",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]/roles"],
  },
  {
    code: "settings.role.edit",
    label: "Edit Roles",
    category: "Roles & Permissions",
    affects: "Role editing forms and save actions",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]/roles"],
  },
  {
    code: "settings.permission.manage",
    label: "Manage Permissions",
    category: "Roles & Permissions",
    affects: "Permission assignment within roles",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]/permissions"],
  },
  {
    code: "settings.permission.create",
    label: "Create Permissions",
    category: "Roles & Permissions",
    affects: "Create Permission button",
    requires: ["settings.organization.view"],
    routes: ["/settings/organizations/[id]/permissions"],
  },

  // ─── Projects ─────────────────────────────────────────────────────────────
  {
    code: "settings.project.create",
    label: "Create Projects",
    category: "Projects",
    affects: "Create Project button",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/projects"],
  },
  {
    code: "settings.project.edit",
    label: "Edit Projects",
    category: "Projects",
    affects: "Project edit forms and save actions",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/projects/[id]"],
  },
  {
    code: "settings.project.archive",
    label: "Archive Projects",
    category: "Projects",
    affects: "Archive Project danger zone",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/projects/[id]"],
  },
  {
    code: "settings.project.restore",
    label: "Restore Projects",
    category: "Projects",
    affects: "Restore archived project action",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/projects/[id]"],
  },

  // ─── Teams ────────────────────────────────────────────────────────────────
  {
    code: "settings.team.create",
    label: "Create Teams",
    category: "Teams",
    affects: "Create Team button",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/teams"],
  },
  {
    code: "settings.team.edit",
    label: "Edit Teams",
    category: "Teams",
    affects: "Team name, description, and settings save actions",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/teams/[id]"],
  },
  {
    code: "settings.team.delete",
    label: "Delete Teams",
    category: "Teams",
    affects: "Delete Team danger zone",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/teams/[id]"],
  },
  {
    code: "settings.team.member.add",
    label: "Add Team Members",
    category: "Teams",
    affects: "Add member to team action",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/teams/[id]"],
  },
  {
    code: "settings.team.member.remove",
    label: "Remove Team Members",
    category: "Teams",
    affects: "Remove member from team action",
    requires: ["settings.organization.view", "settings.workspace.view"],
    routes: ["/settings/teams/[id]"],
  },

  // ─── Audit & Compliance ───────────────────────────────────────────────────
  {
    code: "guard.audit.view",
    label: "View Audit Logs",
    category: "Audit & Compliance",
    affects: "Audit Logs page and all log entries",
    routes: ["/settings/audit-logs"],
  },
];

// ─── Lookups ──────────────────────────────────────────────────────────────────

const _codeToDefinition = new Map<string, PermissionDefinition>(
  PERMISSION_REGISTRY.map((def) => [def.code, def])
);

export function getPermissionDefinition(code: string): PermissionDefinition | undefined {
  return _codeToDefinition.get(code);
}

export function getPermissionsForRoute(pathname: string): PermissionDefinition[] {
  return PERMISSION_REGISTRY.filter((def) => {
    if (!def.routes) return false;
    return def.routes.some((route) => {
      if (route === pathname) return true;
      // Match dynamic segments: /settings/organizations/[id] → /settings/organizations/123
      const pattern = route.replace(/\[[\w]+\]/g, "[^/]+");
      return new RegExp(`^${pattern}(/.*)?$`).test(pathname);
    });
  });
}
