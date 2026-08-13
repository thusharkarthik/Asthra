# Platform Cache And Context

## Purpose

Asthra frontend uses TanStack Query for server data and a small Zustand store for selected platform context. The goal is fast module navigation without repeatedly refetching Core hierarchy data.

## Query Setup

The global provider is `frontend/src/providers/query-provider.tsx`.

Shared query defaults live in:

- `frontend/src/lib/queryClient.ts`
- `frontend/src/lib/queryKeys.ts`

Defaults:

- `staleTime`: 60 seconds for general server state.
- `gcTime`: 10 minutes.
- `refetchOnWindowFocus`: disabled.
- retry: one retry for likely transient/server errors, no retry for 4xx errors.
- mutations: no retries.

## Query Keys

Core platform context keys:

- `queryKeys.auth.currentUser`
- `queryKeys.context.organizations`
- `queryKeys.context.workspaces(organizationId)`
- `queryKeys.context.projects(workspaceId)`
- `queryKeys.context.permissions(orgId, workspaceId, projectId)`

Settings mutation areas should invalidate:

- `queryKeys.settings.all`
- `queryKeys.context.all`
- specific role/permission/team/invitation keys where available.

## Smart Context Cache

Hooks live in:

`frontend/src/hooks/use-smart-context-cache.ts`

Available hooks:

- `useCurrentUser()`
- `useOrganizations()`
- `useWorkspaces(orgId)`
- `useProjects(workspaceId)`
- `useCurrentScope()`
- `useCurrentPermissions()`
- `useCan(permissionCode)`
- `useSmartContextCache()`
- `useClearContextCache()`

The cache loads after login and synchronizes server data into `useWorkspaceStore` for selected IDs and offline-safe persisted context.

## Selector Behavior

Bottom dock selectors use the smart context hooks:

- Organization selector shows organizations available to the current user.
- Workspace selector shows only workspaces under the selected organization.
- Project selector shows only projects under the selected workspace.
- Changing organization resets invalid workspace/project.
- Changing workspace resets invalid project.
- If no children exist, selectors show a disabled empty state.

## Permission Helper

Use:

```ts
const canInvite = useCan("settings.member.invite");
```

or:

```ts
const permissions = useCurrentPermissions();
const canInvite = permissions.data?.permission_codes.includes("settings.member.invite");
```

Do not check role names in frontend code.

## Invalidation Rules

Invalidate context and settings queries after:

- create/edit organization
- create/edit workspace
- create/edit project
- invite member
- change role
- create team
- update access-control mappings
- login/logout

Logout removes Core context, Settings, and current-user query data and resets selected context.

## Remaining Gaps

- Not every module page has been rewritten to use shared query keys yet.
- Devtools are not enabled because `@tanstack/react-query-devtools` is not installed.
- Backend context aggregation endpoint is not needed yet; current hooks reuse existing Core APIs.
