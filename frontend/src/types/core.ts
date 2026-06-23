export type CoreUser = {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  timezone?: string | null;
  locale?: string | null;
  is_active: boolean;
  is_superuser?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type Organization = {
  id: number;
  name: string;
  description?: string | null;
  slug?: string;
  owner_id?: number;
  created_by_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type WorkspaceRecord = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  slug?: string;
  created_by_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProjectRecord = {
  id: number;
  workspace_id: number;
  organization_id?: number | null;
  team_id?: number | null;
  name: string;
  key?: string;
  description?: string | null;
  status?: string;
  owner_id?: number | null;
  created_by_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationMember = {
  id: number;
  organization_id: number;
  user_id: number;
  role_id?: number | null;
  member_role: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkspaceMember = {
  id: number;
  workspace_id: number;
  user_id: number;
  role_id?: number | null;
  member_role: string;
  created_at?: string;
  updated_at?: string;
};

export type TeamRecord = {
  id: number;
  workspace_id: number;
  name: string;
  description?: string | null;
  slug?: string;
  created_by_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RoleRecord = {
  id: number;
  organization_id?: number | null;
  name: string;
  key?: string;
  description?: string | null;
  scope: string;
  permission_preset?: string;
  is_system?: boolean;
  is_editable?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RoleTemplateRecord = {
  name: string;
  key: string;
  scope: string;
  description: string;
  permission_patterns: string[];
  is_system: boolean;
  is_editable: boolean;
};

export type PermissionRecord = {
  id: number;
  role_id?: number | null;
  key?: string;
  code: string;
  name: string;
  description?: string | null;
  module?: string | null;
  resource?: string | null;
  action?: string | null;
  scope?: string;
  risk_level?: string;
  source?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PermissionRegistryItem = {
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
  risk_level: string;
  exists: boolean;
  status: string;
};

export type PermissionGapRecord = {
  module: string;
  resource: string;
  action: string;
  expected_permission_code: string;
  status: string;
  suggested_fix: string;
};

export type CurrentUserPermissionScope = {
  scope_type: string;
  scope_id?: number | null;
};

export type CurrentUserResolvedRole = {
  id: number;
  name: string;
  key: string;
  scope: string;
  source_scope_type: string;
  source_scope_id?: number | null;
};

export type CurrentUserPermissions = {
  permission_codes: string[];
  roles: CurrentUserResolvedRole[];
  scope: CurrentUserPermissionScope;
};

export type ContextVersionSnapshot = {
  user_id: number;
  organization_id?: number | null;
  organization_version: number;
  workspace_id?: number | null;
  workspace_version: number;
  project_id?: number | null;
  project_version: number;
  access_version: number;
  generated_at: string;
};

export type ApiKeyRecord = {
  id: number;
  user_id: number;
  organization_id?: number | null;
  workspace_id?: number | null;
  name: string;
  key_prefix: string;
  scopes: string[];
  api_key?: string;
  is_active?: boolean;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvitationRecord = {
  id: number;
  email: string;
  organization_id: number;
  workspace_id?: number | null;
  invited_by_id: number;
  role_id?: number | null;
  status: string;
  scope_type?: string;
  scope_id?: number;
  token?: string;
  expires_at?: string;
  invited_at?: string;
  accepted_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TeamMemberRecord = {
  id: number;
  team_id: number;
  user_id: number;
  role_id?: number | null;
  member_role: string;
  status?: string;
  joined_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserRoleRecord = {
  id: number;
  user_id: number;
  role_id: number;
  created_at?: string;
  updated_at?: string;
};

export type RoleAssignmentRecord = {
  id: number;
  user_id: number;
  role_id: number;
  scope_type: string;
  scope_id?: number | null;
  status: string;
  assigned_by?: number | null;
  assigned_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProjectMembershipRecord = {
  id: number;
  project_id: number;
  user_id: number;
  role_id?: number | null;
  team_id?: number | null;
  status: string;
  joined_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EffectivePermissionsRecord = {
  user: CoreUser;
  active_roles: Array<Record<string, unknown>>;
  inherited_roles: Array<Record<string, unknown>>;
  permission_codes: string[];
  scope_context: Record<string, unknown>;
};

export type CoreNotificationRecord = {
  id: number;
  user_id: number;
  organization_id?: number | null;
  workspace_id?: number | null;
  project_id?: number | null;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
};
