# TanStack Query Architecture

Asthra uses TanStack Query as the frontend server-state layer.

## Query Client

`frontend/src/lib/queryClient.ts` defines the global query client.

Defaults:

- `staleTime`: keeps recently loaded data fresh enough for fast navigation.
- `gcTime`: keeps inactive data available for reuse.
- `refetchOnWindowFocus`: disabled to avoid noisy refetching during local workflow testing.
- Queries retry once for transient failures.
- Client-side `4xx` errors do not retry.
- Mutations do not retry automatically.

Devtools can be added in development when the devtools package is installed. The current foundation keeps runtime dependencies minimal.

## Provider

`frontend/src/providers/query-provider.tsx` wraps the app in `QueryClientProvider`.

`frontend/src/providers/app-providers.tsx` makes the query client available to every route.

## Query Keys

`frontend/src/lib/queryKeys.ts` is the shared key registry.

Key groups:

- `auth.currentUser`
- `organizations.list`
- `organizations.detail(id)`
- `workspaces.list(orgId)`
- `projects.list(workspaceId)`
- `members.list(scopeType, scopeId)`
- `roles.list`
- `permissions.list`
- `permissions.current(orgId, workspaceId, projectId)`
- `flow.workItems(projectId)`
- `flow.sprints(projectId)`
- `flow.releases(projectId)`
- `docs.spaces(workspaceId)`
- `docs.pages(workspaceId, spaceId)`
- `discover.ideas(workspaceId)`
- `discover.roadmap(workspaceId)`
- `desk.tickets(workspaceId)`
- `pulse.incidents(workspaceId)`
- `dev.releases(projectId)`

Use query keys from the registry instead of inline arrays for new platform/core work.

## Shared Hooks

`frontend/src/hooks/use-platform-queries.ts` provides the preferred query hooks:

- `useCurrentUser()`
- `useOrganizations()`
- `useOrganization(id)`
- `useWorkspaces(orgId)`
- `useProjects(workspaceId)`
- `useMembers(scope)`
- `useRoles()`
- `usePermissions()`
- `useCurrentPermissions(scopeOverride)`
- `useCan(permissionCode)`

`frontend/src/hooks/use-smart-context-cache.ts` builds on these hooks for the app-wide organization/workspace/project context.

## Mutations

`frontend/src/hooks/use-settings-mutations.ts` defines reusable Settings mutation patterns:

- `useCreateOrganizationMutation()`
- `useUpdateOrganizationMutation(organizationId)`
- `useCreateWorkspaceMutation()`
- `useCreateProjectMutation()`
- `useInviteMemberMutation()`
- `useAssignRoleMutation()`
- `useCreateTeamMutation()`

Mutation rules:

- Return normal TanStack mutation state.
- Do not retry automatically.
- Let callers show existing success/error toasts.
- Invalidate affected query keys on success.

## Cache Invalidation

Examples:

- Create Organization -> invalidate `organizations.list`.
- Update Organization -> invalidate `organizations.list` and `organizations.detail(id)`.
- Create Workspace -> invalidate `workspaces.list(orgId)` and workspace lists.
- Create Project -> invalidate `projects.list(workspaceId)` and project lists.
- Invite Member -> invalidate `invitations.list` and `members`.
- Assign Role -> invalidate `members`, `roles`, and `permissions`.
- Create Team -> invalidate `teams.list`.
- Logout -> clear auth, organization, workspace, project, permission, and settings cache.

Avoid invalidating the whole query cache for ordinary mutations.

## Initial Adoption

The first adoption area is platform context and Settings/Core:

- Current user
- Organizations
- Workspaces scoped to organization
- Projects scoped to workspace
- Current user permissions
- Settings roles
- Settings permissions
- Settings invitations
- Settings teams

Other modules can migrate gradually by adopting `queryKeys` and shared mutation patterns.

## UI State Pattern

Pages should use:

- `isLoading` for first load
- `isFetching` for background refresh indicators
- `isError` and `error` for consistent error states
- `refetch()` for retry actions

Avoid duplicating server data in local state unless the state is a form draft or UI-only value.
