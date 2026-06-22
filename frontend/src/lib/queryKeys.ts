export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const
  },
  context: {
    all: ["core"] as const,
    organizations: ["core", "organizations"] as const,
    workspaces: (organizationId?: number | null) => ["core", "workspaces", organizationId ?? null] as const,
    projects: (workspaceId?: number | null) => ["core", "projects", workspaceId ?? null] as const,
    permissions: (orgId?: number | null, workspaceId?: number | null, projectId?: number | null) =>
      ["settings", "me-permissions", orgId ?? null, workspaceId ?? null, projectId ?? null] as const
  },
  settings: {
    all: ["settings"] as const,
    teams: ["settings", "teams"] as const,
    roles: ["settings", "roles"] as const,
    permissions: ["settings", "permissions"] as const,
    invitations: ["settings", "invitations"] as const
  }
};
