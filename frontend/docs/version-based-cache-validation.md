# Version-Based Cache Validation

Asthra uses lightweight context versions to avoid refetching stable platform context payloads.

## Endpoint Contract

Core exposes:

`GET /api/v1/context/version`

Query params:

- `organization_id`
- `workspace_id`
- `project_id`

Response:

```json
{
  "user_id": 1,
  "organization_id": 1,
  "organization_version": 4,
  "workspace_id": 2,
  "workspace_version": 7,
  "project_id": 3,
  "project_version": 5,
  "access_version": 9,
  "generated_at": "2026-06-22T00:00:00Z"
}
```

## Version Fields

Core owns these counters:

- `Organization.context_version`
- `Organization.access_version`
- `Workspace.context_version`
- `Workspace.access_version`
- `Project.context_version`
- `Project.access_version`

## What Changes Versions

Organization changes:

- Increment organization context version.

Workspace created, updated, or deleted:

- Increment workspace context version.
- Increment parent organization context version.

Project created, updated, or deleted:

- Increment project context version.
- Increment parent workspace context version.
- Increment parent organization context version through workspace context bump.

Access changes:

- Member invite or removal increments access version for the affected scope.
- Role assignment changes increment access version for the affected scope.
- Permission or role mapping changes increment platform-level access by bumping all scope access counters.
- Team membership changes increment workspace access version.

## Frontend Validation

`useContextVersion()` compares the latest endpoint response with the persisted `asthra-context-versions` snapshot.

If versions match:

- Keep cached organization, workspace, project, and permission payloads.
- Do not invalidate full context queries.

If versions differ:

- Organization version changed: invalidate organizations and scoped workspaces.
- Workspace version changed: invalidate scoped workspaces and scoped projects.
- Project version changed: invalidate scoped projects and project detail.
- Access version changed: invalidate scoped permissions, members, roles, and settings access data.

## Persistence

The version snapshot is persisted separately from selected scope.

Logout and user switch clear the version snapshot.

## Future Direction

This is a polling and route-change validation layer. Future event-driven infrastructure can publish version changes through Redis or an event bus so clients can refresh only when notified.
