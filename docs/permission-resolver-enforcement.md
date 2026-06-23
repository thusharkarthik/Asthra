# Permission Resolver and Enforcement

Phase C makes permission checks consistent across backend and frontend.

## Resolver API

The core resolver is `AccessControlService`.

Primary methods:

- `get_effective_permissions(user_id, scope_type, scope_id)`
- `has_permission(user_id, permission_code, scope_type, scope_id)`
- `can_access_scope(user_id, scope_type, scope_id)`
- `require(user, permission_code, scope_type, scope_id)`

`has_permission` is the boolean check. `require` raises `403` with the required permission code.

## Inheritance Rules

Scope hierarchy:

```text
Platform
-> Organization
-> Workspace
-> Project
-> Team
```

Rules:

- Platform role applies globally.
- Organization role applies to the organization and child workspaces/projects.
- Workspace role applies to the workspace and child projects.
- Project role applies only to that project.
- Team role applies only inside that team.

Archived or inactive records remain resolvable for permission checks. This allows restore and archive workflows to keep working after browser refresh.

## Backend Enforcement

Critical Settings services use precise permission codes:

- organization edit/archive/restore
- workspace edit/archive/restore
- project edit/archive/restore
- team create/edit/delete
- team member add/remove
- member invite/remove/resend/cancel
- role assignment create/remove

FastAPI dependency helper:

```python
require_permission("settings.project.restore", path_scope("project", "project_id"))
```

Service-level checks remain the primary enforcement point for existing Settings workflows because they have access to the loaded entity and can resolve archived scopes.

## Frontend Contract

Managed actions use the same action contract:

```text
actionKey
permissionCode
scopeType
scopeId
```

Frontend visibility must call:

```ts
can(permissionCode)
```

Frontend checks must not use role names for action visibility.

## Owner QA Fixes

Organization Owner inherits:

- project edit/archive/restore on projects under owned organizations
- team create/edit/delete in workspaces under owned organizations
- member invite/remove/resend/cancel in owned organization scopes

Viewer roles receive view permissions but not edit/archive/restore permissions.

## Debugging

In development, Access Control shows:

- current scope
- active roles
- effective permissions
- selected `can(action)` results

This panel is not intended for production UX.
