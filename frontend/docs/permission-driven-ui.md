# Permission Driven UI

Asthra UI action visibility is permission driven.

## Components

Use the shared access components:

- `Can`
- `PermissionButton`
- `PermissionLink`
- `PermissionMenuItem`
- `PermissionSection`

These components use action keys from `frontend/src/access/actionRegistry.ts`.

## Behavior

- Allowed: render normally.
- Denied: hide by default.
- Loading: render a disabled/loading state or explicit skeleton.
- Optional: denied controls can render disabled with a tooltip.

## Settings Actions

Settings uses permission codes for:

- Organization create/edit/archive/restore
- Workspace create/edit/archive/restore
- Project create/edit/archive/restore
- Team create/edit/delete/member add/member remove
- Member invite/remove/resend/cancel/role changes
- Access Control create/sync/mapping actions

## Sidebar

The sidebar hides module links if the current user has no view permission for that module.

Wildcard permission checks are supported for navigation patterns such as `flow.*.view`.

## Rule

Do not add role-name checks for UI visibility. Add an action key and permission code instead.
