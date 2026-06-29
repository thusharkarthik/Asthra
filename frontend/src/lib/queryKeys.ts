export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: ["auth", "current-user"] as const
  },
  organizations: {
    all: ["organizations"] as const,
    list: ["organizations", "list"] as const,
    detail: (id?: number | null) => ["organizations", "detail", id ?? null] as const
  },
  workspaces: {
    all: ["workspaces"] as const,
    list: (organizationId?: number | null) => ["workspaces", "list", organizationId ?? null] as const,
    detail: (id?: number | null) => ["workspaces", "detail", id ?? null] as const
  },
  projects: {
    all: ["projects"] as const,
    list: (workspaceId?: number | null) => ["projects", "list", workspaceId ?? null] as const,
    detail: (id?: number | null) => ["projects", "detail", id ?? null] as const,
    members: (id?: number | null) => ["projects", "members", id ?? null] as const
  },
  teams: {
    all: ["teams"] as const,
    list: ["teams", "list"] as const,
    detail: (id?: number | null) => ["teams", "detail", id ?? null] as const,
    members: (id?: number | null) => ["teams", "members", id ?? null] as const
  },
  members: {
    all: ["members"] as const,
    list: (scopeType?: string | null, scopeId?: number | null) => ["members", "list", scopeType ?? null, scopeId ?? null] as const
  },
  roles: {
    all: ["roles"] as const,
    list: ["roles", "list"] as const,
    detail: (id?: number | null) => ["roles", "detail", id ?? null] as const,
    templates: ["roles", "templates"] as const,
    permissions: (roleId?: number | null) => ["roles", "permissions", roleId ?? null] as const,
    assignments: (filters?: Record<string, unknown>) => ["roles", "assignments", filters ?? null] as const
  },
  permissions: {
    all: ["permissions"] as const,
    list: ["permissions", "list"] as const,
    current: (orgId?: number | null, workspaceId?: number | null, projectId?: number | null) =>
      ["permissions", "current", orgId ?? null, workspaceId ?? null, projectId ?? null] as const
  },
  invitations: {
    all: ["invitations"] as const,
    list: ["invitations", "list"] as const
  },
  flow: {
    all: ["flow"] as const,
    dashboardSummary: (projectId?: number | null) => ["flow", "dashboard-summary", projectId ?? null] as const,
    workItems: (projectId?: number | null) => ["flow", "work-items", projectId ?? null] as const,
    sprints: (projectId?: number | null) => ["flow", "sprints", projectId ?? null] as const,
    releases: (projectId?: number | null) => ["flow", "releases", projectId ?? null] as const
  },
  docs: {
    all: ["docs"] as const,
    dashboardSummary: (workspaceId?: number | null) => ["docs", "dashboard-summary", workspaceId ?? null] as const,
    spaces: (workspaceId?: number | null) => ["docs", "spaces", workspaceId ?? null] as const,
    pages: (workspaceId?: number | null, spaceId?: number | null) => ["docs", "pages", workspaceId ?? null, spaceId ?? null] as const
  },
  discover: {
    all: ["discover"] as const,
    dashboardSummary: (workspaceId?: number | null) => ["discover", "dashboard-summary", workspaceId ?? null] as const,
    ideas: (workspaceId?: number | null) => ["discover", "ideas", workspaceId ?? null] as const,
    roadmap: (workspaceId?: number | null) => ["discover", "roadmap", workspaceId ?? null] as const
  },
  desk: {
    all: ["desk"] as const,
    dashboardSummary: (workspaceId?: number | null) => ["desk", "dashboard-summary", workspaceId ?? null] as const,
    tickets: (workspaceId?: number | null) => ["desk", "tickets", workspaceId ?? null] as const
  },
  pulse: {
    all: ["pulse"] as const,
    dashboardSummary: (workspaceId?: number | null) => ["pulse", "dashboard-summary", workspaceId ?? null] as const,
    incidents: (workspaceId?: number | null) => ["pulse", "incidents", workspaceId ?? null] as const
  },
  dev: {
    all: ["dev"] as const,
    releases: (projectId?: number | null) => ["dev", "releases", projectId ?? null] as const
  },
  context: {
    all: ["context"] as const,
    versionRoot: ["context", "version"] as const,
    version: (organizationId?: number | null, workspaceId?: number | null, projectId?: number | null) =>
      ["context", "version", organizationId ?? null, workspaceId ?? null, projectId ?? null] as const,
    organizations: ["organizations", "list"] as const,
    workspaces: (organizationId?: number | null) => ["workspaces", "list", organizationId ?? null] as const,
    projects: (workspaceId?: number | null) => ["projects", "list", workspaceId ?? null] as const,
    permissions: (orgId?: number | null, workspaceId?: number | null, projectId?: number | null) =>
      ["permissions", "current", orgId ?? null, workspaceId ?? null, projectId ?? null] as const
  },
  platformContext: {
    all: ["platform-context"] as const,
    detail: (orgId?: number | null, workspaceId?: number | null, projectId?: number | null) =>
      ["platform-context", orgId ?? null, workspaceId ?? null, projectId ?? null] as const
  },
  settings: {
    all: ["settings"] as const,
    teams: ["settings", "teams"] as const,
    roles: ["settings", "roles"] as const,
    permissions: ["settings", "permissions"] as const,
    invitations: ["settings", "invitations"] as const
  }
};

export const legacyQueryKeys = {
  settingsAll: ["settings"] as const,
  coreAll: ["core"] as const
};
