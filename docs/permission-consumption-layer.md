# Permission Consumption Layer

Asthra permissions are consumed through permission codes, not role names.

## Model

- Users receive roles at a scope.
- Roles contain permissions.
- UI actions and backend endpoints check permission codes.
- No UI should check `Owner`, `Admin`, `Manager`, or similar role names for action visibility.

## Frontend Consumption

Shared frontend utilities live in:

- `frontend/src/lib/permissions.ts`
- `frontend/src/access/actionRegistry.ts`
- `frontend/src/access/permission-components.tsx`

Use:

- `can(permissionCodes, "settings.project.restore")`
- `usePermission(permissionCode, scope)`
- `useActionAccess(actionKey, scope)`
- `Can`
- `PermissionButton`
- `PermissionLink`
- `PermissionMenuItem`
- `PermissionSection`

Denied actions are hidden by default. Loading permissions must not render an access-denied state.

## Navigation

Sidebar module links declare required view permissions.

Examples:

- Flow: `flow.*.view`
- Docs: `docs.*.view`
- Discover: `discover.*.view`
- Settings: `settings.*.view` or `settings.*.manage`

While permissions are loading, navigation fails open to avoid flicker. Once resolved, unauthorized module links are hidden.

## Backend Consumption

Dynamic, payload-sensitive checks remain in service methods.

Static endpoint checks can use:

```python
Depends(require_permission("settings.permission.manage"))
```

Current protected areas include access-control registry sync and inventory endpoints. Organization, workspace, project, team, member, and role assignment services already enforce the relevant Settings permissions.

## Current Migration Boundary

Settings/Core actions are the first migration target. Other modules should adopt the same `actionKey -> permissionCode -> backend require` pattern as they mature.
