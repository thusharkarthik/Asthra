export type RiskLevel = "low" | "medium" | "high";

export type ActionScope = {
  organizationId?: number | null;
  workspaceId?: number | null;
  projectId?: number | null;
  teamId?: number | null;
  permissionCodes?: string[];
  isLoading?: boolean;
};

export type ActionDefinition = {
  actionKey: string;
  permissionCode: string;
  module: string;
  resource: string;
  action: string;
  scopeResolver: "platform" | "organization" | "workspace" | "project" | "team";
  label: string;
  riskLevel: RiskLevel;
};

function action(
  module: string,
  resource: string,
  actionName: string,
  scopeResolver: ActionDefinition["scopeResolver"],
  label: string,
  riskLevel: RiskLevel = "low"
): ActionDefinition {
  const code = `${module}.${resource}.${actionName}`;
  return {
    actionKey: code,
    permissionCode: code,
    module,
    resource,
    action: actionName,
    scopeResolver,
    label,
    riskLevel
  };
}

export const ACTION_REGISTRY = {
  "settings.organization.create": action("settings", "organization", "create", "organization", "Create Organization", "medium"),
  "settings.organization.edit": action("settings", "organization", "edit", "organization", "Edit Organization", "medium"),
  "settings.organization.archive": action("settings", "organization", "archive", "organization", "Archive Organization", "high"),
  "settings.organization.restore": action("settings", "organization", "restore", "organization", "Restore Organization", "high"),

  "settings.workspace.create": action("settings", "workspace", "create", "organization", "Create Workspace", "medium"),
  "settings.workspace.edit": action("settings", "workspace", "edit", "workspace", "Edit Workspace", "medium"),
  "settings.workspace.archive": action("settings", "workspace", "archive", "workspace", "Archive Workspace", "high"),
  "settings.workspace.restore": action("settings", "workspace", "restore", "workspace", "Restore Workspace", "high"),

  "settings.project.create": action("settings", "project", "create", "workspace", "Create Project", "medium"),
  "settings.project.edit": action("settings", "project", "edit", "project", "Edit Project", "medium"),
  "settings.project.archive": action("settings", "project", "archive", "project", "Archive Project", "high"),
  "settings.project.restore": action("settings", "project", "restore", "project", "Restore Project", "high"),

  "settings.team.create": action("settings", "team", "create", "workspace", "Create Team", "medium"),
  "settings.team.edit": action("settings", "team", "edit", "workspace", "Edit Team", "medium"),
  "settings.team.delete": action("settings", "team", "delete", "workspace", "Delete Team", "high"),
  "settings.team.member.add": action("settings", "team.member", "add", "workspace", "Add Team Member", "medium"),
  "settings.team.member.remove": action("settings", "team.member", "remove", "workspace", "Remove Team Member", "high"),

  "settings.member.invite": action("settings", "member", "invite", "workspace", "Invite Member", "medium"),
  "settings.member.remove": action("settings", "member", "remove", "workspace", "Remove Member", "high"),
  "settings.member.role.assign": action("settings", "member.role", "assign", "workspace", "Assign Member Role", "high"),
  "settings.member.role.remove": action("settings", "member.role", "remove", "workspace", "Remove Member Role", "high"),
  "settings.member.resend": action("settings", "member", "resend", "workspace", "Resend Invite", "medium"),
  "settings.member.cancel": action("settings", "member", "cancel", "workspace", "Cancel Invite", "high"),

  "settings.role.create": action("settings", "role", "create", "organization", "Create Role", "high"),
  "settings.role.edit": action("settings", "role", "edit", "organization", "Edit Role", "high"),
  "settings.role.manage": action("settings", "role", "manage", "organization", "Manage Roles", "high"),
  "settings.permission.create": action("settings", "permission", "create", "organization", "Create Permission", "high"),
  "settings.permission.manage": action("settings", "permission", "manage", "organization", "Manage Permissions", "high"),

  "flow.work_item.create": action("flow", "work_item", "create", "project", "Create Work Item", "medium"),
  "flow.work_item.edit": action("flow", "work_item", "edit", "project", "Edit Work Item", "medium"),
  "flow.work_item.delete": action("flow", "work_item", "delete", "project", "Delete Work Item", "high"),
  "flow.sprint.manage": action("flow", "sprint", "manage", "project", "Manage Sprints", "high"),
  "flow.release.manage": action("flow", "release", "manage", "project", "Manage Releases", "high")
} as const satisfies Record<string, ActionDefinition>;

export type ActionKey = keyof typeof ACTION_REGISTRY;

export const SETTINGS_ACTIONS = {
  organizationCreate: ACTION_REGISTRY["settings.organization.create"],
  organizationEdit: ACTION_REGISTRY["settings.organization.edit"],
  organizationArchive: ACTION_REGISTRY["settings.organization.archive"],
  organizationRestore: ACTION_REGISTRY["settings.organization.restore"],
  workspaceCreate: ACTION_REGISTRY["settings.workspace.create"],
  workspaceEdit: ACTION_REGISTRY["settings.workspace.edit"],
  workspaceArchive: ACTION_REGISTRY["settings.workspace.archive"],
  workspaceRestore: ACTION_REGISTRY["settings.workspace.restore"],
  projectCreate: ACTION_REGISTRY["settings.project.create"],
  projectEdit: ACTION_REGISTRY["settings.project.edit"],
  projectArchive: ACTION_REGISTRY["settings.project.archive"],
  projectRestore: ACTION_REGISTRY["settings.project.restore"],
  teamCreate: ACTION_REGISTRY["settings.team.create"],
  teamEdit: ACTION_REGISTRY["settings.team.edit"],
  teamDelete: ACTION_REGISTRY["settings.team.delete"],
  teamMemberAdd: ACTION_REGISTRY["settings.team.member.add"],
  teamMemberRemove: ACTION_REGISTRY["settings.team.member.remove"],
  memberInvite: ACTION_REGISTRY["settings.member.invite"],
  memberRemove: ACTION_REGISTRY["settings.member.remove"],
  memberRoleAssign: ACTION_REGISTRY["settings.member.role.assign"],
  memberRoleRemove: ACTION_REGISTRY["settings.member.role.remove"],
  memberResend: ACTION_REGISTRY["settings.member.resend"],
  memberCancel: ACTION_REGISTRY["settings.member.cancel"],
  roleCreate: ACTION_REGISTRY["settings.role.create"],
  roleEdit: ACTION_REGISTRY["settings.role.edit"],
  roleManage: ACTION_REGISTRY["settings.role.manage"],
  permissionCreate: ACTION_REGISTRY["settings.permission.create"],
  permissionManage: ACTION_REGISTRY["settings.permission.manage"]
} as const;

export function getActionDefinition(actionKey: string): ActionDefinition | undefined {
  return ACTION_REGISTRY[actionKey as ActionKey];
}

export function listActionDefinitions() {
  return Object.values(ACTION_REGISTRY);
}
