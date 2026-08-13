import type {
  CoreUser,
  Organization,
  WorkspaceRecord,
  ProjectRecord,
  OrganizationMember,
  WorkspaceMember,
  TeamRecord,
  TeamMemberRecord,
  RoleRecord,
  ApiKeyRecord,
  CoreNotificationRecord,
} from "@/types/core";

// Inline types from settings-api to avoid circular import through client.ts
type ActivityLogShape = {
  id: number; created_at: string; updated_at: string;
  actor_user_id: number | null; organization_id: number | null;
  workspace_id: number | null; project_id: number | null;
  action: string; entity_type: string; entity_id: string | null;
  description: string | null; summary: string | null;
  event_metadata: Record<string, unknown> | null;
};
type OrgSettingsShape = {
  default_timezone: string | null; allow_public_invites: boolean;
  default_member_role: string; domain: string | null;
  website_url: string | null; industry: string | null;
  logo_url: string | null; primary_color: string | null;
  locale: string | null; date_format: string | null;
};
type WorkspaceSettingsShape = {
  default_project_visibility: string; default_timezone: string | null;
  enable_activity_feed: boolean; visibility: string;
  locale: string | null; enabled_modules: string[];
};
type OrgHealthShape = {
  organization_id: number; score: number;
  status: "critical" | "needs_attention" | "good" | "excellent";
  checks: Array<{ key: string; label: string; passed: boolean; points: number }>;
  checked_at: string;
};

const NOW = "2026-07-04T10:00:00Z";
const YESTERDAY = "2026-07-03T15:30:00Z";
const LAST_WEEK = "2026-06-27T09:00:00Z";

export const MOCK_USERS: CoreUser[] = [
  { id: 9001, email: "alex.chen@acme-engineering.io", full_name: "Alex Chen", job_title: "Engineering Lead", is_active: true, is_superuser: false, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9002, email: "jordan.lee@acme-engineering.io", full_name: "Jordan Lee", job_title: "Senior Developer", is_active: true, is_superuser: false, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9003, email: "morgan.smith@acme-engineering.io", full_name: "Morgan Smith", job_title: "Product Designer", is_active: true, is_superuser: false, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9004, email: "sam.taylor@acme-engineering.io", full_name: "Sam Taylor", job_title: "Product Manager", is_active: true, is_superuser: false, created_at: LAST_WEEK, updated_at: NOW },
];

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 9001, name: "Acme Engineering", description: "Building the future of developer tools", slug: "acme-engineering", is_active: true, owner_id: 9001, created_at: LAST_WEEK, updated_at: NOW },
];

export const MOCK_WORKSPACES: WorkspaceRecord[] = [
  { id: 9001, organization_id: 9001, name: "Engineering Hub", description: "Core engineering workspace", slug: "engineering-hub", is_active: true, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9002, organization_id: 9001, name: "Product Design", description: "Design and product workspace", slug: "product-design", is_active: true, created_at: LAST_WEEK, updated_at: NOW },
];

export const MOCK_PROJECTS: ProjectRecord[] = [
  { id: 9001, workspace_id: 9001, organization_id: 9001, name: "Asthra Platform", key: "ASTH", description: "Internal developer platform", status: "active", is_active: true, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9002, workspace_id: 9001, organization_id: 9001, name: "Mobile App", key: "MOBI", description: "Cross-platform mobile application", status: "active", is_active: true, created_at: LAST_WEEK, updated_at: NOW },
  { id: 9003, workspace_id: 9002, organization_id: 9001, name: "API Gateway", key: "APIG", description: "Unified API gateway service", status: "active", is_active: true, created_at: LAST_WEEK, updated_at: NOW },
];

export const MOCK_ORG_MEMBERS: OrganizationMember[] = [
  { id: 9001, organization_id: 9001, user_id: 9001, member_role: "admin", created_at: LAST_WEEK },
  { id: 9002, organization_id: 9001, user_id: 9002, member_role: "member", created_at: LAST_WEEK },
  { id: 9003, organization_id: 9001, user_id: 9003, member_role: "member", created_at: LAST_WEEK },
  { id: 9004, organization_id: 9001, user_id: 9004, member_role: "member", created_at: LAST_WEEK },
];

export const MOCK_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id: 9001, workspace_id: 9001, user_id: 9001, member_role: "admin", created_at: LAST_WEEK },
  { id: 9002, workspace_id: 9001, user_id: 9002, member_role: "member", created_at: LAST_WEEK },
  { id: 9003, workspace_id: 9002, user_id: 9003, member_role: "member", created_at: LAST_WEEK },
  { id: 9004, workspace_id: 9002, user_id: 9004, member_role: "member", created_at: LAST_WEEK },
];

export const MOCK_TEAMS: TeamRecord[] = [
  { id: 9001, workspace_id: 9001, name: "Backend Team", description: "Core backend services", slug: "backend-team", is_active: true, created_at: LAST_WEEK },
  { id: 9002, workspace_id: 9001, name: "Frontend Team", description: "UI and frontend development", slug: "frontend-team", is_active: true, created_at: LAST_WEEK },
];

export const MOCK_TEAM_MEMBERS: TeamMemberRecord[] = [
  { id: 9001, team_id: 9001, user_id: 9001, member_role: "lead", status: "active", created_at: LAST_WEEK },
  { id: 9002, team_id: 9001, user_id: 9002, member_role: "member", status: "active", created_at: LAST_WEEK },
  { id: 9003, team_id: 9002, user_id: 9003, member_role: "lead", status: "active", created_at: LAST_WEEK },
];

export const MOCK_API_KEYS: ApiKeyRecord[] = [
  { id: 9001, user_id: 9001, organization_id: 9001, name: "CI/CD Pipeline", key_prefix: "ak_demo_", scopes: ["read:projects", "write:deployments"], is_active: true, last_used_at: YESTERDAY, created_at: LAST_WEEK },
  { id: 9002, user_id: 9001, organization_id: 9001, name: "Monitoring Dashboard", key_prefix: "ak_mon_", scopes: ["read:metrics", "read:alerts"], is_active: true, last_used_at: NOW, created_at: LAST_WEEK },
];

export const MOCK_NOTIFICATIONS: CoreNotificationRecord[] = [
  { id: 9001, user_id: 9001, organization_id: 9001, type: "info", title: "God Mode Active", message: "Viewing demo data in God Mode calibration sandbox.", is_read: false, created_at: NOW },
  { id: 9002, user_id: 9001, organization_id: 9001, workspace_id: 9001, type: "success", title: "Deploy succeeded", message: "Asthra Platform v2.1.0 deployed to production.", is_read: true, read_at: YESTERDAY, created_at: YESTERDAY },
  { id: 9003, user_id: 9001, organization_id: 9001, type: "warning", title: "API key expiring", message: "CI/CD Pipeline key expires in 7 days.", is_read: false, created_at: LAST_WEEK },
];

export const MOCK_AUDIT_LOGS: ActivityLogShape[] = [
  { id: 9001, created_at: NOW, updated_at: NOW, actor_user_id: 9001, organization_id: 9001, workspace_id: 9001, project_id: null, action: "project.created", entity_type: "project", entity_id: "9001", description: "Created project Asthra Platform", summary: "Project created", event_metadata: null },
  { id: 9002, created_at: YESTERDAY, updated_at: YESTERDAY, actor_user_id: 9002, organization_id: 9001, workspace_id: 9001, project_id: 9001, action: "member.added", entity_type: "member", entity_id: "9002", description: "Added Jordan Lee to Engineering Hub", summary: "Member added", event_metadata: null },
  { id: 9003, created_at: YESTERDAY, updated_at: YESTERDAY, actor_user_id: 9001, organization_id: 9001, workspace_id: null, project_id: null, action: "role.updated", entity_type: "role", entity_id: "9002", description: "Updated Developer role permissions", summary: "Role updated", event_metadata: null },
  { id: 9004, created_at: LAST_WEEK, updated_at: LAST_WEEK, actor_user_id: 9004, organization_id: 9001, workspace_id: 9001, project_id: null, action: "team.created", entity_type: "team", entity_id: "9001", description: "Created Backend Team", summary: "Team created", event_metadata: null },
  { id: 9005, created_at: LAST_WEEK, updated_at: LAST_WEEK, actor_user_id: 9001, organization_id: 9001, workspace_id: null, project_id: null, action: "api_key.created", entity_type: "api_key", entity_id: "9001", description: "Created CI/CD Pipeline API key", summary: "API key created", event_metadata: null },
];

export const MOCK_ORG_SETTINGS: OrgSettingsShape = {
  default_timezone: "America/New_York",
  allow_public_invites: false,
  default_member_role: "member",
  domain: "acme-engineering.io",
  website_url: "https://acme-engineering.io",
  industry: "Software & Technology",
  logo_url: null,
  primary_color: "#6d28d9",
  locale: "en-US",
  date_format: "YYYY-MM-DD",
};

export const MOCK_WS_SETTINGS: WorkspaceSettingsShape = {
  default_project_visibility: "internal",
  default_timezone: "America/New_York",
  enable_activity_feed: true,
  visibility: "internal",
  locale: "en-US",
  enabled_modules: ["flow", "docs", "pulse", "connect"],
};

export const MOCK_ORG_HEALTH: OrgHealthShape = {
  organization_id: 9001,
  score: 87,
  status: "good",
  checks: [
    { key: "has_admin", label: "Has organization admin", passed: true, points: 20 },
    { key: "has_members", label: "Has active members", passed: true, points: 15 },
    { key: "has_workspace", label: "Has active workspace", passed: true, points: 20 },
    { key: "has_roles", label: "Custom roles configured", passed: true, points: 15 },
    { key: "mfa_enabled", label: "MFA enforcement active", passed: false, points: 17 },
  ],
  checked_at: NOW,
};

export const MOCK_EFFECTIVE_PERMISSIONS = {
  user: MOCK_USERS[0],
  active_roles: [],
  inherited_roles: [],
  permission_codes: [] as string[],
  scope_context: {} as Record<string, unknown>,
};
