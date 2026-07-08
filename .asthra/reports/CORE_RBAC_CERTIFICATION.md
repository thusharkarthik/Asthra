# Core RBAC Certification

Date: 2026-07-08

## Status

Pass with manual QA required.

## Permission Registry Source

Core remains the source of truth for permission records. Permissions are stored in `permissions` and mapped to roles through `role_permissions`.

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

## Frontend Gates

Frontend gates should continue to use permission codes through `can("permission.code")` and action registry helpers. No new role-name or role-rank access checks were added.

## Known Gaps

- Manual QA still needs to verify role edit behavior in the browser against real users/scopes.
- Some legacy tests in `test_access_control_rbac.py` have pre-existing assertions that conflict with current Superuser behavior and seeded permissions.

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
