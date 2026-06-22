# Platform Context Cache

Asthra uses a platform-wide context layer for identity, scope, and permissions.

## Ownership

`frontend/src/context/platformContext.tsx` owns the frontend context surface.

It stores:

- Current user
- Organizations
- Selected organization
- Workspaces scoped to selected organization
- Selected workspace
- Projects scoped to selected workspace
- Selected project
- Current effective permissions
- `loadedAt`

TanStack Query remains the server-state source of truth. The context provider reads from query hooks and the persisted selected-scope store; it does not call APIs directly.

## Provider

`PlatformContextProvider` is mounted in `frontend/src/providers/app-providers.tsx` inside `QueryProvider` and `AuthProvider`.

This makes platform context available to every route.

## Scope Hierarchy

```text
Organization
  -> Workspace
      -> Project
```

Rules:

- Organization dropdown shows accessible organizations.
- Workspace dropdown shows only workspaces in the selected organization.
- Project dropdown shows only projects in the selected workspace.
- Changing organization resets invalid workspace and project selections.
- Changing workspace resets invalid project selections.

## Persistence

Selected scope IDs are persisted through the existing `asthra-workspace-context` localStorage entry.

Persisted values:

- `selectedOrganizationId`
- `selectedWorkspaceId`
- `selectedProjectId`

When the user returns, the previous scope is restored if still valid.

## Permission Cache

Effective permissions are loaded with the current scope:

- Organization
- Workspace
- Project

Permissions refresh when scope changes because the query key includes the selected scope IDs.

Permissions also refresh after role, member, invitation, and permission mutations through targeted query invalidation.

## Hooks

Use these hooks for platform context:

- `usePlatformContext()`
- `useCurrentScope()`
- `useSelectedOrganization()`
- `useSelectedWorkspace()`
- `useSelectedProject()`
- `useCurrentPermissions()`
- `useCan(permissionCode)`

The older Smart Context Cache hooks remain as compatibility wrappers for existing code.

## Invalidation Rules

Refresh context after:

- Organization created or updated
- Workspace created or updated
- Project created or updated
- Role assigned
- Member invited
- Permission changed
- Login
- Logout

Logout clears:

- Auth query cache
- Organization cache
- Workspace cache
- Project cache
- Permission cache
- Settings cache

## Initial Integration

Initial consumers:

- Bottom organization/workspace/project selector
- Settings members page
- Flow dashboard
- Docs dashboard
- Discover dashboard

Other modules should migrate gradually.

## Performance Safeguards

- Context data is loaded through shared TanStack Query keys.
- Multiple consumers share the same cached result.
- The bottom selector does not independently fetch its own data.
- Permissions use scoped query keys to avoid stale cross-scope access checks.
- Module pages should read selected scope from context instead of reloading organization/workspace/project data.
