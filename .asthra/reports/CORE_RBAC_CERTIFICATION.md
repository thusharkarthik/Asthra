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

Role detail permission editing now adds search, module/scope/action/selected-state filters, module -> resource grouping, expand/collapse controls, visible/selected counts, and group select/clear actions. These controls only affect display and selected backend permission IDs; they do not introduce frontend-owned permission definitions.

## Frontend Permission Registry Refresh

Frontend permission and role-management UI is backend-driven:

- permission lists come from `settingsApi.listPermissions(...)`
- registry status comes from backend registry/gap/inventory/sync-preview APIs
- role permission checkboxes are built from backend permission records and backend role-permission mappings
- sync/generate actions invalidate permission registry, permissions, roles, role permissions, context version, and unified platform context queries
- sync results now surface unknown database permissions and invalid role-template references for admin review

No frontend-only permission registry is used as the source of truth for role save or checkbox state.

## Frontend Enforcement Batch 1

Manual QA batch 1 frontend enforcement gaps were addressed on 2026-07-09:

- Sidebar visibility now evaluates backend permission codes for both dynamic module-registry navigation and static fallback navigation.
- Static fallback navigation now carries the same permission mappings as the backend module registry where registry permissions exist.
- Multi-permission module links, such as Access Control, allow visibility when the user has any listed backend permission.
- Access Control -> Roles member counts now use distinct active users from active `role_assignments`, not organization/workspace member rows or legacy role labels.
- The old Access Control member aggregation query was removed from the roles table path, reducing unrelated member-list requests.
- Organization edit visibility uses `settings.organization.edit` or `settings.organization.manage`.
- Organization archive and restore actions are surfaced on organization detail and are explicitly gated by `settings.organization.archive` and `settings.organization.restore`.
- Organization template visibility is gated by `settings.organization_templates.view`; applying a template is gated by `settings.organization_templates.apply` and uses the backend apply endpoint.

Organization manage behavior is defined as management-surface/edit authority only. Destructive lifecycle actions remain explicitly permission-gated.

## Membership Lifecycle Batch 2

RBAC membership lifecycle behavior was corrected on 2026-07-10:

- Active `role_assignments` are the source of access for organization/workspace roles.
- Effective permissions are the union of all active role assignments that apply to the requested scope chain.
- Removing one role assignment removes only that assignment and its permissions.
- Removing the last ordinary role assignment in an organization/workspace scope now removes that active scoped membership/access instead of recreating a fallback role.
- Protected platform roles still keep last-Superuser / last-Platform-Owner safety checks.
- Removing an organization member revokes active organization role assignments and descendant workspace/project/team role assignments under that organization.
- Removing a workspace member revokes active workspace role assignments and descendant project/team role assignments under that workspace.
- Organization/workspace membership rows no longer grant effective permissions unless backed by an active matching role assignment.

Backend validation:

- `pytest tests/test_scoped_membership.py -vv` passed: 9 tests.
- `pytest tests/test_app_imports.py` passed: 2 tests.

## Sidebar Audit

Sidebar management is currently split into a dynamic primary source and a static fallback:

- Primary source: `availableModules[]` from `GET /context/platform`, generated by Core Module Registry and filtered by feature flags, navigation mode, and backend permission codes.
- Frontend dynamic mapping: `frontend/src/lib/module-nav-registry.ts` converts backend modules into sidebar sections.
- Static fallback: `frontend/src/lib/navigation-mode.ts` is used only when dynamic modules are unavailable or do not match the current mode.
- Runtime gate: `frontend/src/components/navigation/sidebar-nav.tsx` checks `permission` / `permissions[]` through `can("permission.code")`; no role-name/rank authorization is used for normal item visibility.

Audited modes:

- Platform Mode: Organizations, Members, Access Control, Audit Logs, and Platform Health have permission gates. Home, API Keys, and Settings are currently treated as authenticated/personal or broad platform utilities.
- Organization Mode: Workspaces, Members, Teams, Roles, and Org Settings have permission gates. Home, Preferences, and Profile remain authenticated/personal items.
- Work Mode: Flow, Discover, Docs, Collab, Desk, Pulse, Automation, Dev, Connect, and Insights have permission gates where backend registry permissions exist. Home, Memory, Assistant, and Settings remain ungated in fallback because the backend Module Registry currently defines those modules without required permissions or as broad shell utilities.

No full sidebar customization was implemented in this batch. Follow-up should decide whether API Keys, Memory, Assistant, and generic Settings require explicit registry permissions instead of authenticated visibility.

## Organization Archive / Restore Status

Backend organization archive/restore is supported through `PATCH /organizations/{id}` with `is_active=false/true`.

- Archive is enforced by `settings.organization.archive`.
- Restore is enforced by `settings.organization.restore`.
- Frontend organization detail loads `GET /organizations/{id}` directly for the route, so inactive organization detail remains reachable even when platform context/list queries hide inactive records by default.
- Frontend organization detail surfaces Archive or Restore based on the detail record's active state and explicit lifecycle permission.
- The runtime lifecycle action is no longer wrapped by the old `danger_zone` schema gate because that schema entry represented `settings.organization.delete`, not archive/restore authority.
- Archive/restore success updates the organization detail cache and invalidates organization list/detail, platform context, context version, and scoped permission queries.
- The optional `/organizations/{id}/settings` read is non-fatal; if Core returns 404, the frontend uses safe default settings and keeps rendering canonical org detail state.
- Archive/restore no longer forces an `org-settings` refetch, because organization lifecycle state is owned by `GET /organizations/{id}` and the list/platform context refreshes.
- Post-action platform context refetches no longer trigger the AsthraShell skipped-onboarding clear loop; the shell only clears skipped onboarding state when a matching non-null skipped user id exists.
- Post-action platform context sync into `workspace-store` is idempotent; invalid current scope ids from refetched context are ignored unless present in incoming arrays, and equivalent id/parent/active snapshots do not rewrite store state.
- `PlatformContextProvider` syncs workspace-store from a stable workspace-scope key, not full platform context object identity. The key excludes volatile timestamps and permission/navigation/module/metadata fields, and a ref guard prevents syncing the same workspace key twice for the same access token.
- `settings.organization.manage` does not grant archive/restore by itself.

## Organization-Scoped Member Routing Batch

Organization member management scope was corrected on 2026-07-12:

- Inviting from `/settings/organizations/:orgId/members` defaults and locks the invitation organization to the route org.
- Platform roles are hidden in organization-scoped invite and add-role flows.
- Workspace choices in scoped invite/add-role flows are constrained to descendants of the route organization.
- Member rows opened from an organization member list now route to `/settings/organizations/:orgId/members/:memberId`.
- The scoped member detail route reuses `MemberDetailView` with explicit organization scope, so effective permissions and Add Role defaults are resolved for the route org.
- Global `/settings/members/:memberId` remains available for platform/global cross-scope administration.
- The active organization settings route now uses explicit `settings.organization.archive` / `settings.organization.restore` permissions for lifecycle actions and exposes Restore for inactive organizations.

Validation:

- `./node_modules/.bin/tsc --noEmit` passed.
- `npm run build` passed from a clean `/tmp/asthra-frontend-verify` copy because the repository-local `.next` directory contains pre-existing files owned by `nobody:nogroup`.

## Organization Template Permission Status

Organization template permissions are implemented and documented:

- `settings.organization_templates.view` controls template list visibility.
- `settings.organization_templates.apply` controls the Apply Template action.
- Backend apply endpoint enforces apply permission.

## Frontend Gates

Frontend gates should continue to use permission codes through `can("permission.code")` and action registry helpers. No new role-name or role-rank access checks were added.

## Known Gaps

- Manual QA still needs to verify role edit behavior in the browser against real users/scopes.
- Manual QA still needs to verify member removal and last-role removal behavior through Settings UI against real users/scopes.
- Sidebar follow-up: decide whether currently ungated authenticated/personal fallback items should receive new backend registry permissions.
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
