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
  owner_name?: string | null;
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
  is_hidden?: boolean;
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
  is_hidden?: boolean;
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
  is_system?: boolean;
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

export type PermissionInventoryRecord = {
  total_permissions: number;
  by_module: Record<string, number>;
  by_resource: Record<string, number>;
  by_action: Record<string, number>;
  by_risk: Record<string, number>;
  by_scope: Record<string, number>;
  deprecated_permissions: string[];
  malformed_permissions: string[];
  duplicate_like_permissions: string[][];
  unmapped_permissions: string[];
  broad_permissions: string[];
  existing_not_in_registry_baseline: string[];
  roles_using_each_permission: Record<string, string[]>;
};

export type PermissionRegistrySyncResult = {
  created_count: number;
  existing_count?: number;
  updated_count: number;
  deprecated_count: number;
  skipped_custom_count: number;
  unknown_db_count?: number;
  invalid_template_reference_count?: number;
  errors: string[];
  created: string[];
  existing?: string[];
  updated: string[];
  deprecated: string[];
  skipped_custom: string[];
  unknown_db_permissions?: string[];
  invalid_template_references?: Array<{
    role_key: string;
    role_name: string;
    permission_pattern: string;
    reason: string;
  }>;
  created_permissions?: string[];
  existing_permissions?: string[];
  updated_permissions?: string[];
  total_registry_permissions: number;
};

export type RoleMappingSuggestion = {
  role_key: string;
  permission_patterns: string[];
  suggested_permissions: string[];
  suggested_count: number;
  high_risk_count: number;
  note: string;
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
  feature_flags?: Record<string, boolean>;
  enabled_modules?: string[];
};

export type FeatureFlagRecord = {
  id: number;
  created_at: string;
  updated_at: string;
  flag_key: string;
  name: string;
  description?: string | null;
  category: string;
  default_enabled: boolean;
  is_system: boolean;
  is_active: boolean;
};

export type FeatureFlagOverrideRecord = {
  id: number;
  created_at: string;
  updated_at: string;
  flag_key: string;
  scope_type: string;
  scope_id?: number | null;
  enabled: boolean;
  reason?: string | null;
  created_by?: number | null;
};

export type FeatureFlagCatalogResponse = {
  flags: FeatureFlagRecord[];
  overrides: FeatureFlagOverrideRecord[];
};

export type EffectiveFeatureFlagsResponse = {
  scope_type: string;
  scope_id?: number | null;
  feature_flags: Record<string, boolean>;
  enabled_modules: string[];
  generated_at: string;
};

export type FeatureFlagOverridePayload = {
  flag_key: string;
  scope_type: string;
  scope_id?: number | null;
  enabled: boolean;
  reason?: string | null;
};

export type ModuleRegistryItem = {
  module_key: string;
  name: string;
  description?: string | null;
  category: string;
  route: string;
  icon: string;
  navigation_mode: string;
  required_feature_flag?: string | null;
  required_permissions: string[];
  sort_order: number;
  enabled: boolean;
  visible: boolean;
};

export type NavigationRegistryItem = {
  nav_key: string;
  label: string;
  route: string;
  mode: string;
  group: string;
  icon: string;
  order: number;
  required_any_permissions: string[];
  required_feature_flag?: string | null;
  module_key?: string | null;
  default_visible: boolean;
  is_customizable: boolean;
  description?: string | null;
  children?: NavigationRegistryItem[];
};

export type NavigationRegistryResponse = {
  version: number;
  items: NavigationRegistryItem[];
};

export type ResolvedNavigation = {
  version: number;
  modes: Record<string, { items: NavigationRegistryItem[] }>;
};

export type RoleNavigationVisibility =
  | "default"
  | "hidden"
  | "show_when_allowed"
  | "show_locked_if_denied";

export type RoleNavigationConfigItem = {
  id: number;
  created_at: string;
  updated_at: string;
  role_id: number;
  mode: string;
  nav_key: string;
  visibility: RoleNavigationVisibility;
  order_override?: number | null;
  label_override?: string | null;
  group_override?: string | null;
  is_active: boolean;
};

export type RoleNavigationConfigUpdateItem = {
  nav_key: string;
  visibility: RoleNavigationVisibility;
  order_override?: number | null;
  label_override?: string | null;
  group_override?: string | null;
  is_active?: boolean;
};

export type RoleNavigationConfigBatchUpdate = {
  role_id: number;
  mode: string;
  items: RoleNavigationConfigUpdateItem[];
};

export type RoleNavigationConfigResponse = {
  role_id: number;
  mode: string;
  items: RoleNavigationConfigItem[];
};

export type RoleNavigationConfigPreviewItem = NavigationRegistryItem & {
  config?: RoleNavigationConfigItem | null;
  preview_visibility: RoleNavigationVisibility;
  preview_label: string;
  preview_group: string;
  preview_order: number;
};

export type RoleNavigationConfigPreviewResponse = {
  role_id: number;
  mode: string;
  generated_at: string;
  items: RoleNavigationConfigPreviewItem[];
};

export type AIContextMetadata = {
  available: boolean;
  endpoint: string;
  block_count: number;
  categories: string[];
  source_modules: string[];
};

export type ConfigurationMetadata = {
  available: boolean;
  endpoint: string;
  definition_count: number;
  categories: string[];
  source_modules: string[];
  scope_inheritance: string[];
};

export type SearchMetadata = {
  available: boolean;
  endpoint: string;
  registry_endpoint: string;
  categories: string[];
  entity_types: string[];
  shortcut: string;
};

export type OrganizationTemplateMetadata = {
  available: boolean;
  endpoint: string;
  template_count: number;
  categories: string[];
};

export type OrganizationTemplateRecord = {
  template_key: string;
  name: string;
  description: string;
  category: string;
  recommended_for: string[];
  workspaces: Array<{
    name: string;
    description?: string | null;
    projects: Array<{ name: string; description?: string | null }>;
    teams: Array<{ name: string; description?: string | null }>;
  }>;
  feature_flags: Record<string, boolean>;
  configuration: Record<string, unknown>;
  notes: string[];
  sort_order: number;
  is_active: boolean;
};

export type OrganizationTemplateReport = {
  template_key: string;
  organization_id: number;
  summary: {
    workspaces_to_create: number;
    projects_to_create: number;
    teams_to_create: number;
    feature_flags_to_apply: number;
    configuration_values_to_apply: number;
    skipped_existing: number;
  };
  actions: Array<{
    action_type: string;
    name: string;
    status: string;
    scope_type?: string | null;
    scope_id?: number | null;
    parent?: string | null;
    detail?: string | null;
  }>;
  warnings: string[];
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

export type EffectiveAccessRole = {
  id: number;
  name: string;
  key: string;
  scope: string;
  source_scope_type: string;
  source_scope_id?: number | null;
};

export type PermissionSourceTrace = {
  role_name: string;
  role_key: string;
  role_scope: string;
  source_scope_type: string;
  source_scope_id?: number | null;
  scope_label: string;
  inherited_through: string[];
};

export type EffectiveAccessActionResult = {
  action_key: string;
  action_label: string;
  permission_code: string;
  allowed: boolean;
  source_role?: string | null;
  scope_source?: string | null;
  sources: PermissionSourceTrace[];
};

export type EffectiveAccessDebugRecord = {
  user: Pick<CoreUser, "id" | "email" | "full_name" | "is_active" | "is_superuser">;
  scope: { scope_type: string; scope_id?: number | null };
  direct_roles: EffectiveAccessRole[];
  inherited_roles: EffectiveAccessRole[];
  effective_permissions: string[];
  permission_trace: Array<{ permission_code: string; sources: PermissionSourceTrace[] }>;
  action_results: EffectiveAccessActionResult[];
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
