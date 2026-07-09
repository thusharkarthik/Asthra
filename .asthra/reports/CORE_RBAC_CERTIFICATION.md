# Core RBAC Certification

Date: 2026-07-08

## Status

Pass with manual QA required.

## Permission Registry Source

Core remains the source of truth for permission records. Permissions are stored in `permissions` and mapped to roles through `role_permissions`.

Canonical permission definitions live in `services/core-service/app/services/permission_registry.py` as module/resource/action/scope registry entries. `PermissionService.sync_registry_permissions()` is the shared sync engine used by startup/bootstrap and the manual Access Control "Generate Missing Permissions" / "Sync Permissions" action.

## Permission Sync Architecture

Sync behavior:

- creates missing registry permissions
- updates safe registry metadata fields
- preserves custom permissions
- does not hard-delete database permission rows
- deprecates removed registry permissions instead of deleting them
- reports unknown database permissions that are not in the code registry
- reports exact role-template permission references that do not exist in the registry

Frontend Access Control fetches registry status from the backend and does not define permission codes locally.

## Role Permission Persistence

Role permission editing supports:

- adding one permission to a role
- removing one permission from a role
- replacing the complete permission set for a role

The replace endpoint now uses the same protected-system-role allowance as add/remove: Superuser and Platform Owner may edit system role mappings except the Superuser role.

## Effective Permission Resolver

Effective permissions resolve from active `role_assignments` and scoped membership fallback records. Permission codes are read from `role_permissions`; users do not receive permissions directly.

Confirmed scope behavior:

- platform roles apply globally
- organization role assignments inherit to child workspaces/projects
- workspace role assignments inherit to child projects
- project roles apply to project scope

## `/me/permissions`

`/api/v1/me/permissions` uses `AccessControlService.get_user_permissions(...)` and returns effective permission codes for the requested scope.

## `/context/platform`

`/api/v1/context/platform` uses the same effective permission resolver as `/me/permissions`. For the same scope, frontend platform context permissions should match `/me/permissions`.

## Frontend Checkbox UI

Role detail checkboxes use backend permission IDs and call:

- `POST /roles/{role_id}/permissions`
- `DELETE /roles/{role_id}/permissions/{permission_id}`

Checkbox state is based on `GET /roles/{role_id}/permissions`, not current-user effective permissions. After mutation, frontend invalidates role permissions, settings permissions, effective permissions, context version, and unified platform context.

## Frontend Permission Registry Refresh

Frontend permission and role-management UI is backend-driven:

- permission lists come from `settingsApi.listPermissions(...)`
- registry status comes from backend registry/gap/inventory/sync-preview APIs
- role permission checkboxes are built from backend permission records and backend role-permission mappings
- sync/generate actions invalidate permission registry, permissions, roles, role permissions, context version, and unified platform context queries
- sync results now surface unknown database permissions and invalid role-template references for admin review

No frontend-only permission registry is used as the source of truth for role save or checkbox state.

## Frontend Gates

Frontend gates should continue to use permission codes through `can("permission.code")` and action registry helpers. No new role-name or role-rank access checks were added.

## Known Gaps

- Manual QA still needs to verify role edit behavior in the browser against real users/scopes.
- Frontend production build now passes. The `.next` ownership/EACCES blocker is guarded by the prebuild script, and the apparent optimizer stall was a long full-route compile. `cd frontend && npm run build` completed on 2026-07-09 after a 9.2 minute optimizer phase.
- Some legacy tests in `test_access_control_rbac.py` have pre-existing assertions that conflict with current Superuser behavior and seeded permissions.
- Current role template audit reports member self-service exact references such as `settings.profile.view`, `settings.notifications.view`, and `settings.preferences.view` as missing from the backend registry. They are now visible in sync preview/report output instead of silently hidden.

## Manual QA Checklist

1. Login as Superuser or Platform Owner.
2. Open Settings -> Access Control -> Roles.
3. Open a non-Superuser role.
4. Check a permission and confirm it remains checked after reopening the role.
5. Assign the role to a test user at the correct scope.
6. Confirm `/me/permissions` includes the added permission.
7. Uncheck the permission and confirm it remains unchecked after reopening the role.
8. Confirm `/me/permissions` no longer includes the removed permission.
9. Confirm `/context/platform` matches `/me/permissions` for the same scope.
10. Confirm UI actions hide/show without hard reload.
