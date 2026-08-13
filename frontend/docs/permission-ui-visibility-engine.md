# Permission UI Visibility Engine

Phase D standardizes frontend action visibility around permission codes.

## Action Registry

Frontend actions are registered in `frontend/src/access/actionRegistry.ts`.

Each action defines:

- `actionKey`
- `permissionCode`
- `module`
- `resource`
- `action`
- `scopeResolver`
- `label`
- `riskLevel`

Action keys intentionally match permission codes, for example:

- `settings.project.restore`
- `settings.team.edit`
- `settings.member.invite`
- `flow.work_item.create`

## Permission Components

Reusable visibility primitives live in `frontend/src/access/permission-components.tsx`.

- `useActionAccess(actionKey, scope)`
- `Can`
- `PermissionAction`
- `PermissionButton`
- `PermissionMenuItem`

Default behavior is to hide denied actions. Use `deniedMode="disabled"` when the user should see a disabled action with a permission hint.

Loading permissions must not show denied or limited-access states. Components render a loading fallback or disabled loading control until permissions resolve.

## Scope

Actions can receive an explicit scope:

```tsx
<PermissionButton
  actionKey="settings.project.restore"
  scope={{ projectId, permissionCodes, isLoading }}
>
  Restore Project
</PermissionButton>
```

Settings pages usually pass already-loaded permission codes from `useCurrentPermissions()` to avoid duplicate permission requests.

## QA Matrix

The diagnostic route is:

`/settings/access-control/qa-matrix`

It shows:

- action key
- required permission
- module/resource
- scope resolver
- risk
- current allowed/denied result

Use this page during role QA to confirm action visibility before testing the underlying backend action.

## Migration Rule

New frontend actions should not check role names. Use one of:

- `can(permissionCode)`
- `useActionAccess(actionKey, scope)`
- `Can`
- `PermissionButton`

Backend enforcement remains the source of truth. Frontend visibility is only the user experience layer.
