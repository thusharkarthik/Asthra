# Bug Registry

## Fixed

### BUG-039 — Self-Serve Organization Onboarding Did Not Own No-Org Flow [FIXED 2026-07-01]

**Files**: `frontend/src/layouts/asthra-shell.tsx`, `frontend/src/app/page.tsx`, `frontend/src/components/platform/platform-setup-guide.tsx`
**Symptom**: After register, an authenticated no-org user could still cause Home dashboard/activity requests. After `POST /organizations/onboard` succeeded, the UI stayed in the create organization form. Double-submit could send a second onboard request and receive 400 "You already have access to an organization."
**Root cause**: The Home page declared dashboard/activity queries before its no-org branch, so those requests fired even when no-org UI rendered. The onboarding form only invalidated old split-query keys, not unified platform context, and had no success-completed submit guard. Skip state was also shell-local but not tied to the authenticated user.
**Fix**: Home dashboard/activity queries are disabled for no-org users. Organization onboarding now disables duplicate submits, treats the already-created 400 as recoverable, invalidates/refetches `platform-context`, context version, organizations, and permissions, and then leaves onboarding. Skip-for-now state is scoped to the current user and cleared once an organization appears.

### BUG-038 — Register No-Org Flow Reused Previous Work Scope [FIXED 2026-07-01]

**Files**: `frontend/src/stores/auth-store.ts`, `frontend/src/context/platformContext.tsx`
**Symptom**: During register + no-org onboarding QA, a newly registered user with no organization still triggered `GET /context/platform?org_id=1&workspace_id=1&project_id=1` from a previous user/session. `/context/version` could also run with stale scoped IDs.
**Root cause**: `asthra-workspace-context` persisted selected organization/workspace/project IDs, while `PlatformContextProvider` used those IDs in its first platform-context query before the current user's context had validated them. Register/login only cleared the context-version snapshot, not the selected work scope.
**Fix**: Login/register/logout now clear session-scoped workspace selections, context-version snapshot, and permission simulation state before setting the new token. PlatformContext now only sends selected scope IDs after they are confirmed against cached current-session organizations/workspaces/projects, and context-version checks wait for a confirmed settled scope. No-org users keep null scope and do not run scoped platform/version requests.

### BUG-037 — Logout Leaves Stale Shell/Home/Onboarding State [FIXED 2026-07-01]

**Files**: `frontend/src/hooks/use-logout.ts`, `frontend/src/layouts/asthra-shell.tsx`, `frontend/src/app/settings/account/page.tsx`, `frontend/src/context/platformContext.tsx`, `frontend/src/providers/auth-provider.tsx`
**Symptom**: After logout, the app could show Home instead of Login. After refresh, the logged-out user could see organization onboarding before a second logout reached Login.
**Root cause**: Shell logout delayed clearing auth state until after the logout transition delay, while React Query and workspace/platform cleanup happened later in `AuthProvider`. During that gap, stale platform context query data and persisted selected scope could still participate in shell/onboarding decisions.
**Fix**: Added a shared `useLogout()` hook that synchronously clears authenticated React Query cache, workspace scope, context-version snapshot, permission simulation, and auth state before navigating to `/login`. `PlatformContextProvider` now exposes empty auth-dependent context whenever no token exists, even if cached query data remains. `AuthProvider` also clears query cache and workspace state on any no-token hydrated state.

### BUG-036 — Duplicate Core Context Calls After Login [FIXED 2026-07-01]

**Files**: `frontend/src/context/platformContext.tsx`, `frontend/src/layouts/asthra-shell.tsx`, `frontend/src/app/page.tsx`, `frontend/src/providers/auth-provider.tsx`, `frontend/src/stores/auth-store.ts`, `frontend/src/stores/workspace-store.ts`, `frontend/src/hooks/use-context-version.ts`, `frontend/src/components/platform/notification-center.tsx`
**Symptom**: After login, the frontend called the same Core context endpoints repeatedly: scoped `/context/platform` 5 times, `/context/version` 7 times, `/auth/me` twice, `/notifications` twice, plus old split-query endpoints (`/organizations`, `/workspaces`, `/projects`, `/me/permissions`).
**Root cause**: The shell still mounted `WorkspaceContextLoader`, which used the old Smart Context Cache split queries. Login/register and `AuthProvider` also called `/auth/me` even though Unified Platform Context already returns the current user. Context version refetched immediately on token/path changes and focus, and scope hydration updated org/workspace/project in separate store writes.
**Fix**: Removed the shell/home old split-query loader, made PlatformContext hydrate the workspace store in one batched action, synced auth store `currentUser` from `/context/platform`, removed login/register/provider `/auth/me` calls from the normal login path, delayed context-version checks until after initial platform context load, disabled aggressive refetch triggers, and made notification queries share cache without polling.

**Follow-up 2026-07-01**: The remaining login cascade was `/context/platform` → `/context/platform?org_id=...&workspace_id=...` → `/context/platform?org_id=...&workspace_id=...&project_id=...`. Root cause: the unscoped platform context returned organizations/workspaces but no default projects/current project, so the frontend could only commit org+workspace first and had to fetch again to discover a project. Fixed by returning deterministic default current org/workspace/project and projects for the default workspace from `/context/platform`, and by gating context-version checks until the selected scope is settled.

### BUG-001 — Settings Members Page Tied to Bottom Bar [FIXED 2026-06-25]

**File**: `frontend/src/app/settings/members/page.tsx`
**Symptom**: Members page scope changed when user switched the bottom bar workspace/organization selector. An org admin switching to a workspace context would see workspace-scoped members instead of org-scoped members.
**Root cause**: `useCurrentScope()` read from the workspace store (bottom bar), not from user authority.
**Fix**: Removed `useCurrentScope()`. Page now uses three queries to determine authority independently of navigation state.

### BUG-002 — Silent Wrong-Org Fallback in Invite [FIXED 2026-06-25]

**File**: `frontend/src/components/settings/settings-admin-views.tsx` (line ~1402)
**Symptom**: In global directory mode, invite would silently target `organizations[0]` — the first org alphabetically/by ID — rather than showing an error.
**Root cause**: `scopeOrganizationId = ... ?? organizations[0]?.id` fallback bypassed the existing `!scopeOrganizationId` guard.
**Fix**: Changed fallback to `null`. The guard now fires correctly and shows a clear error message.

### BUG-003 — API Call with ID 0 in membersQuery [FIXED 2026-06-25]

**File**: `frontend/src/components/settings/settings-admin-views.tsx` (line ~1380)
**Symptom**: `listWorkspaceMembers(token, 0)` could be called if `workspaceId` was undefined/null and the `enabled` guard had a race condition or was bypassed.
**Root cause**: `workspaceId ?? 0` in the `queryFn` — the `enabled` guard usually prevented execution but the fallback 0 was a silent footgun.
**Fix**: Added `if (!workspaceId) return [];` guard inside the `queryFn` before the API call.

### BUG-004 — Default Global Directory Fallback Exposed All Users [FIXED 2026-06-25]

**File**: `frontend/src/app/settings/members/page.tsx`
**Symptom**: A newly registered user with no admin roles who visited `/settings/members` was shown the full platform user list (global directory mode) because authority resolution fell through to an unconditional `return <MembersView />` at the bottom.
**Root cause**: The authority resolution chain had no forbidden/empty branch — the final `else` case passed through to global directory, which called `listUsers` and returned all platform users.
**Fix**: Replaced the default `<MembersView />` fallback with `<SettingsLayout>` + `<SettingsEmptyState title="Access Restricted" description="...">`. No `MembersView` is rendered so no member API calls are made.

### BUG-005 — /settings/members/:id Exposed Any User's Profile to Any Authenticated User [FIXED 2026-06-26]

**File**: `frontend/src/app/settings/members/[id]/page.tsx`
**Symptom**: Any authenticated user could hit `/settings/members/15` directly and see full profile, roles, and permissions of another user. Zero auth check existed.
**Root cause**: The original file was a server component that directly rendered `<MemberDetailView userId={Number(id)} />` with no guard.
**Fix**: Converted to client component. Added same 3-query authority resolution as `members/page.tsx`. No admin role → "Access Restricted" state is shown, `MemberDetailView` is never instantiated.

### BUG-006 — No Route Guard on /settings/* Routes [FIXED 2026-06-26]

**File**: `frontend/src/app/settings/layout.tsx` (created)
**Symptom**: Any authenticated user could navigate directly to any `/settings/*` URL (members, roles, organizations, permissions, etc.) and see admin-only content.
**Root cause**: No `layout.tsx` existed under `/settings/`, so every route was unguarded.
**Fix**: Created `settings/layout.tsx` as a central auth guard. Uses same authority resolution pattern as `members/page.tsx`. Non-admin users are restricted to personal routes (`/settings/profile`, `/settings/preferences`, `/settings/notifications`, `/settings/account`). All other routes show "Access Restricted".

### BUG-007 — Regular Members Saw Full Admin Dashboard on /settings [FIXED 2026-06-26]

**File**: `frontend/src/app/settings/page.tsx`
**Symptom**: Any authenticated user navigating to `/settings` (a personal route, allowed by the layout guard) saw the full admin dashboard — org/workspace/member/team cards, "Operational setup flow", "Administration hierarchy", etc.
**Root cause**: `settings/page.tsx` unconditionally rendered `<SettingsHomeView />`. The layout guard allowed personal-route access for members but did not filter what the page displayed.
**Fix**: Exported `SettingsAuthorityContext` + `useSettingsAuthority` from `settings/layout.tsx`. `settings/page.tsx` reads `authorityLevel` — members see only 4 personal cards (Profile, Preferences, Notifications, Account); all admin levels render full `<SettingsHomeView />`. Default context `null` maps to admin view so tests that render the page without the layout continue to pass.

### BUG-008 — Superuser Self-Removal Not Blocked [FIXED 2026-06-26]

**Files**: `services/core-service/app/api/v1/role_assignments.py`, `services/core-service/app/api/v1/users.py`, `services/core-service/app/services/access_control_service.py`
**Symptom**: A superuser could delete their own role assignments (when 2+ superusers exist) because the existing "last superuser" guard only blocked removal when there was exactly 1 superuser left — not self-removal in general.
**Root cause**: `_ensure_not_last_protected_assignment` and `_ensure_not_last_protected_role` check count > 1, not whether the actor is targeting themselves.
**Fix**: Added `AccessControlService.guard_superuser_self_removal(target_user_id, current_user)` → raises 400 "Superusers cannot remove their own roles." Called from `DELETE /role-assignments/{id}`, `PATCH /role-assignments/{id}`, and `DELETE /users/{user_id}/roles/{role_id}`.
**Note**: The "last superuser removal by another user" was already guarded correctly by the existing service-layer checks.

### BUG-009 — Member List Stale After Remove/Invite/Role Change [FIXED 2026-06-26]

**Files**: `frontend/src/components/settings/settings-admin-views.tsx`, `frontend/src/hooks/use-settings-mutations.ts`
**Symptom**: After removing, inviting, or changing the role of a member, the list showed stale data until a manual page reload.
**Root cause**: `invalidateSettingsAndContext()` invalidated `queryKeys.members.all` = `["members"]`, which matched `queryKeys.members.list(...)` = `["members", "list", ...]` (global directory). But the scoped member list query uses key `["settings", "members", orgId, wsId]`, which starts with `"settings"` — not matched by the `["members"]` prefix.
**Fix**: Added `["settings", "members"]` and `["settings", "global-member-role-assignments"]` to `invalidateSettingsAndContext()`. Same keys added to `useInviteMemberMutation` and `useAssignRoleMutation` in `use-settings-mutations.ts`.

### BUG-010 — "Mark All Read" Visible With Zero Notifications [FIXED 2026-06-26]

**File**: `frontend/src/components/platform/notification-center.tsx`
**Symptom**: "Mark all read" button rendered even when there were zero notifications, cluttering the empty state.
**Fix**: Wrapped button in `{allNotifications.some(n => n.unread) ? ... : null}`.

### BUG-011 — Member Selection Was Static Dropdown (Unusable With Many Users) [FIXED 2026-06-26]

**File**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: "Assign project owner", "Add project member", and "Assign member to team" dialogs used static `<select>` lists that rendered all workspace members, becoming unwieldy with many users.
**Fix**: Added `SettingsMemberSelect` component with searchable typeahead (2+ char minimum), filtered dropdown, clear button, and hidden `<input>` for form compatibility. Applied to all three dialogs.

### BUG-012 — Description Fields Single-Line (Wrong Input Type) [FIXED 2026-06-26]

**File**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: Description fields for Org, Workspace, Project, Team, Role, and Permission create/edit forms used `<Input>` (single-line `<input type="text">`), making it impractical to enter multi-sentence descriptions.
**Fix**: All 12 `<Input name="description">` replaced with `<textarea rows={3}>` using matching CSS via `DESCRIPTION_TEXTAREA_CLASS` constant. Vertically resizable, minimum 3 rows.

### BUG-013 — Non-Platform Roles in user_roles Treated as Platform-Scope [FIXED 2026-06-26]

**File**: `services/core-service/app/services/access_control_service.py`
**Symptom**: If a non-platform role (e.g., `organization_admin`, `workspace_manager`) was in the `user_roles` table, `_resolve_roles()` would treat it as having platform-level permissions — giving the user elevated access across the entire platform.
**Root cause**: `_resolve_roles()` iterated all `UserRole` rows and called `_add_role(roles, role, "platform", None)` unconditionally, regardless of `role.scope`.
**Fix**: Added `and role.scope == "platform"` guard: only platform-scoped roles from `user_roles` are applied at platform scope. Org/workspace roles are correctly scoped via `role_assignments`.

### BUG-014 — assign_user_role() Ignored scope_type/scope_id from Request Body [FIXED 2026-06-26]

**File**: `services/core-service/app/services/role_service.py`
**Symptom**: `POST /users/{id}/roles` with `{ role_id, scope_type: "organization", scope_id: 5 }` silently assigned at platform scope — the scope fields were accepted but ignored.
**Root cause**: `assign_user_role()` hardcoded `"platform"` and `None` in all permission checks, duplicate checks, context version bumps, and the `user_roles` write. `UserRoleCreate` schema also only had `role_id`.
**Fix**: Added `scope_type: str = "platform"` and `scope_id: int | None = None` to `UserRoleCreate`. Updated `assign_user_role()` to use caller-supplied scope throughout. Duplicate check now targets `role_assignments` at the specific scope.

### BUG-015 — Settings Don't Unlock Without Page Refresh After Role Assigned [FIXED 2026-06-26]

**Files**: `frontend/src/components/settings/settings-admin-views.tsx`, `frontend/src/hooks/use-settings-mutations.ts`
**Symptom**: After a role is assigned to a user, that user must manually page-refresh for settings to unlock. The authority-level indicator doesn't update.
**Root cause**: All role-assignment mutations (inline and in use-settings-mutations.ts) invalidated member list queries but NOT the authority resolution queries used by `settings/layout.tsx`: `["members-page", "platform-permissions"]` and `["members-page", "my-role-assignments", userId]`. These have `staleTime: 60_000` and never re-ran after role changes.
**Fix**: Added `queryClient.invalidateQueries({ queryKey: ["members-page"] })` (prefix covers both auth queries) and `["settings", "roles"]` to: `invalidateSettingsAndContext()`, `useInviteMemberMutation.onSuccess`, `useAssignRoleMutation.onSuccess`, `MembersView.roleMutation.onSuccess`, `MemberDetailView.assignRoleMutation.onSuccess`, and `MemberDetailView.removeRoleMutation.onSuccess`.

### BUG-016 — Invite Member Button Hidden When No Organizations Exist [FIXED 2026-06-26]

**File**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: On a fresh platform with no organizations, the Invite Member button is completely hidden. A superuser cannot invite anyone via the UI.
**Root cause**: The button was wrapped in `!isGlobalDirectory || organizations.length ? ... : undefined`. When viewing the global directory (no org/workspace scope) AND no organizations exist, both conditions are false and the button disappears.
**Fix**: Removed the ternary wrapper — `PermissionAction` already gates on `settings.member.invite` permission. Updated the info card text to clarify platform-scoped roles can be invited without an org.

### BUG-017 — Platform Member Invite Shows Wrong Scope Error [FIXED 2026-06-26]

**File**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: Selecting Platform Member in the invite modal shows "Unable to determine organization scope. Navigate to a specific organization to invite members." — a confusing error for a role that needs no org.
**Root cause**: `submitInvite` always required `effectiveOrgId` to be non-null. For platform-scoped roles in global directory mode, `effectiveOrgId = scopeOrganizationId = null`, triggering the error. The scope display also showed "No scope — navigate to an organization or workspace" instead of a positive confirmation.
**Fix**: Changed the org requirement guard to only fire when `needsOrg` (non-platform roles). Platform-scoped invites pass `organization_id: null` to the API. Changed scope display for platform roles to "Platform scope (no additional scope required)". Updated inviteMutation payload type to accept `organization_id: number | null`.

### BUG-018 — Non-Platform Roles Not Appearing in Current Roles After Assignment [FIXED 2026-06-26]

**File**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: Assigning Organization Admin or Workspace Admin from member detail "Assign Role" section doesn't appear in the Current Roles list after assignment.
**Root cause**: The "Current Roles" card read from `userRolesQuery` (`GET /users/{id}/roles` → `user_roles` table), but `assignRoleMutation` now calls `createRoleAssignment` which writes only to `role_assignments`. The two tables diverged after the dual-write change — new assignments from the frontend went to `role_assignments` only.
**Fix**: Changed "Current Roles" data source from `userRolesQuery.data` to `activeAssignments` (from `roleAssignmentsQuery`, filtered to `status === "active"`). Updated `memberRoleIds`, `availableRoles`, and `removeRoleMutation` to use `roleAssignmentsQuery` data. `removeRoleMutation` now calls `deleteRoleAssignment(assignment.id)` instead of `removeUserRole(role_id)`.

### BUG-025 — Invitation Type Mismatch: Backend "invitation.created" vs Frontend "invitation.pending" [FIXED 2026-06-29]

**Files**: `services/core-service/app/services/invitation_service.py`, `frontend/src/components/platform/notification-center.tsx`
**Symptom**: Accept/Decline buttons in notification center never appeared for invitation notifications.
**Root cause**: Backend emitted `type="invitation.created"` but frontend checked `type === "invitation.pending"`.
**Fix**: Backend changed to `type="invitation.pending"`. Frontend updated to check both types for backward compat with existing DB rows.

### BUG-026 — entity_id Missing from Mapped Core Notifications [FIXED 2026-06-29]

**File**: `frontend/src/components/platform/notification-center.tsx`
**Symptom**: Accept/Decline buttons never rendered even when type matched — `invitationId` was always null.
**Root cause**: `coreNotificationsQuery.data.map()` did not include `entity_id` in the output object.
**Fix**: Added `entity_id: item.entity_id` to mapped object. Accessed via `"entity_id" in item` TS guard since store's `NotificationItem` type doesn't declare this field.

### BUG-031 — Alembic Version Out of Sync: core-service Crash Loop on Startup [FIXED 2026-06-30]

**File**: `services/core-service/alembic/versions/0013_scoped_membership_foundation.py`
**Symptom**: `asthra-core-service` crash-looped on startup: `OperationalError: table role_assignments already exists`.
**Root cause**: `alembic_version` table showed `0012_access_control_foundation` as the last applied migration. But the actual SQLite DB (in volume `asthra_core_service_data`) already had all tables from 0013 and later — `role_assignments`, `project_memberships`, etc., with live data. Alembic tried to run 0013 upgrade → `CREATE TABLE role_assignments` → crash. The schema was fully current but alembic didn't know it.
**Fix**: `alembic stamp 0013_scoped_membership_foundation` — updates `alembic_version` to 0013 without executing any SQL. Since 0013 is the head, subsequent `alembic upgrade head` on startup is a no-op.
**Data**: 5 rows in `role_assignments` preserved intact.

### BUG-047 — God Mode Schema Panel Missing +/- Buttons on Roles Tab, Permissions Tab, Danger Zone [FIXED 2026-07-07]

**Files**: `frontend/src/lib/permission-schema.ts`, `frontend/src/app/settings/organizations/[id]/page.tsx`
**Symptom**: On `/settings/organizations/:id`, the schema panel showed all 7 elements but `roles_tab`, `permissions_tab`, and `danger_zone` had no +/- action button — they appeared as display-only rows.
**Root cause**: All three elements had `permission: null` in `PAGE_SCHEMAS`. The panel renders `{el.permission && <button>}` — null permission → no button. SchemaGate similarly passes through `!element?.permission` elements unchanged (no overlay). The danger zone was additionally not wrapped in `SchemaGate` on the page.
**Fix**:
1. `permission-schema.ts` — assigned real permission codes: `roles_tab → "settings.role.view"`, `permissions_tab → "settings.permission.view"`, `danger_zone → "settings.organization.delete"`. Changed `danger_zone` type from `"section"` to `"action"`.
2. `organizations/[id]/page.tsx` — wrapped the `<SettingsDangerZone>` in `<SchemaGate elementKey="danger_zone">` so the overlay renders in God Mode edit mode.
**Note**: `settings.role.view` and `settings.permission.view` are conceptual — they may not exist as explicit codes in the backend permission registry. In God Mode simulation they work correctly since `simulatedPermissions` is a plain string array. In normal mode, `can()` returns false for unknown codes → tabs are hidden for non-admins, which is acceptable (admins who are testing have all permissions).

## Open

### BUG-024 — Role-Permission Sync Destroys Manual Assignments [FIXED 2026-06-28]

**Files**: `services/core-service/app/services/role_service.py`, `services/core-service/app/services/access_control_service.py`, `services/core-service/app/api/v1/access_control.py`
**Symptom**: Manually assigning a permission to a role (via the admin UI or API) would be wiped on the next `ensure_role_catalog()` call (triggered by list roles, get effective permissions, server startup, etc.). The permission would silently disappear. Conversely, manually removing a permission would be re-added by the next sync.
**Root cause**: `_sync_role_template_permissions()` computed a full diff between existing DB permissions and template-desired permissions, then DELETE'd anything in `existing - wanted`. Template patterns are the only source of truth it respected — manual admin work was invisible to it.
**Additional root cause**: `ensure_role_catalog()` with `sync_permissions=True` (which triggers the expensive `sync_registry_permissions()` permission catalog scan) was called on every `list()`, `list_templates()`, and `/me/permissions` request — on EVERY API call, not just startup. This is both costly and meant the destructive sync ran constantly.
**Fix**:
1. **Removed delete block** from `_sync_role_template_permissions()`: the `for permission_id in existing_permission_ids - wanted_permission_ids: self.db.delete(mapping)` block is gone entirely. Sync is now additive-only: only adds permissions that match template patterns but are absent from DB.
2. **Updated early-exit condition**: changed `if existing_permission_ids == wanted_permission_ids` to `if wanted_permission_ids.issubset(existing_permission_ids)` — since we never remove, the only reason to enter the loop is if wanted permissions are missing.
3. **Demoted hot-path calls**: `role_service.list()`, `role_service.list_templates()`, and `access_control_service.get_effective_permissions()` now call `ensure_role_catalog(sync_permissions=False)` instead of `sync_permissions=True`. Avoids re-scanning the permission catalog on every API request.
4. **Wired admin sync trigger**: `POST /permission-registry/sync` (admin "Sync Permissions" button) now calls `RoleService(db).ensure_role_catalog(sync_permissions=False)` after syncing the permission catalog, so newly generated permissions are immediately seeded onto matching roles.
**pytest**: `test_permission_registry.py` — 11/11 passed in clean run.

### BUG-023 — Role Permission Checkbox Reverts / Removal Fails with 404 [FIXED 2026-06-28]

**File**: `frontend/src/components/settings/settings-admin-views.tsx` (`RoleDetailView`)

**Bug A — Checkbox revert after assign**: After checking an unassigned permission, the checkbox briefly shows "Assigned" then reverts. **Root cause**: `addPermissionMutation.onSuccess` invalidated `role-permissions` FIRST (step 1), then called `invalidateSettingsAndContext` (step 2) which triggered a `rolesQuery` refetch → `ensure_role_catalog()` → `_sync_role_template_permissions()` ran and potentially removed the manually-added permission from DB. But `rolePermissionsQuery` was already "fresh" from step 1 and wouldn't auto-refetch, leaving stale "Assigned" state until the next background refetch.

**Bug B — "Role permission link not found" on uncheck**: Direct consequence of Bug A. The stale `rolePermissionsQuery` showed a permission as linked when it was no longer in DB (removed by `_sync_role_template_permissions()`). DELETE called with `permission.id` → backend 404 because no matching `RolePermission` row exists.

**Fix**:
1. Swapped invalidation order in both mutations' `onSuccess`: `invalidateSettingsAndContext` first (so `ensure_role_catalog()` runs and backend reaches final DB state), then `rolePermissionsQuery` refetch (so UI reflects authoritative post-sync state).
2. Added `onMutate` optimistic updates to both mutations: immediately update `role-permissions` cache on click (instant UI feedback), rollback in `onError` (on API failure). This eliminates any visual flicker.

### BUG-021 — Role Permissions Always Read-Only (No Edit Capability for Superuser/Platform Owner) [FIXED 2026-06-27]

**File**: `frontend/src/components/settings/settings-admin-views.tsx` (`RoleDetailView`), `services/core-service/app/services/role_service.py`
**Symptom**: Role detail page showed permission checkboxes as disabled for all users — no one could add/remove permissions from any role. Superuser and Platform Owner should be able to edit permissions on any role (except Superuser role itself).
**Root cause**: `link_permission()` and `unlink_permission()` service methods blocked all roles with `is_editable=False` regardless of who is calling. Frontend disabled state also included `role.is_editable === false` unconditionally.
**Fix (backend)**: Added `_can_manage_role_permissions(user, role)` helper — returns True if user.is_superuser or has platform_owner assignment, False if role.key == "superuser". Both service methods now only block if `not is_editable AND not _can_manage_role_permissions`. Added `assign_permission_by_id()` and new `POST /roles/{role_id}/permissions/{permission_id}` endpoint.
**Fix (frontend)**: In `RoleDetailView`, detect `isSuperuserUser` via `currentUser.is_superuser`, `isPlatformOwner` via resolved roles. `canEditPermissions = canEditAnyRole || (canManageRoleMappings && is_editable !== false)`. Checkbox disabled only when `!canEditPermissions`. Superuser role always shows "Always Read-Only" card.

### BUG-020 — Assign Role + Remove Role Buttons Visible to Users Without settings.role.manage [FIXED 2026-06-27]

**File**: `frontend/src/components/settings/settings-admin-views.tsx` (`MemberDetailView`)
**Symptom**: The "Assign Role" button and all "Remove" role buttons in the member detail "Current Roles" card were visible and clickable regardless of whether the current user had `settings.role.manage` permission. Clicking would return a permission error from the API.
**Root cause**: Both buttons were plain `<Button>` components with no permission guard, unlike `MembersView` which already used `PermissionButton` and `canRemoveMembers` checks.
**Fix**: Added `canManageRoles = currentPermissions.can("settings.role.manage")`. Entire role assignment UI (role selector, org/workspace selectors, Assign Role button) hidden via `canManageRoles ? <div>...</div> : undefined` in the `actions` prop. Remove button per role row hidden via `canManageRoles ? <Button>Remove</Button> : null`.

### BUG-019 — 3 pre-existing test failures in test_access_control_rbac.py [OPEN]

**File**: `services/core-service/tests/test_access_control_rbac.py`
**Tests**:
1. `test_effective_access_debug_endpoint_returns_action_results` — asserts `source_role == "Organization Owner"` but gets `"Superuser"`. The first user's superuser role is in `role_assignments` and gets inserted into the roles dict before org-owner (which comes from org membership table), so it wins the permission source lookup.
2. `test_create_permission_catalog_record` — expects 201 creating `automation.workflow.view`, gets 409. This permission is already seeded in the permission catalog.
3. `test_permission_registry_sync_requires_permission_manage` — expects 403 from superuser on POST `/permission-registry/sync`. But superuser has all permissions (including `settings.permission.manage`), so it returns 200.
**Pre-existing**: All 3 tests existed with these assertions on `main` before this branch. Not caused by `fix/remove-user-roles` changes.
**Fix**: Update test assertions to match actual behavior, or add the `automation.workflow.view` permission to the permission seed data dedup check, or restrict sync endpoint to non-superuser roles.

### BUG-027 — Memory Button Missing From Work Mode Navigation [FIXED 2026-06-29]

**File**: `frontend/src/lib/navigation-mode.ts`
**Symptom**: Memory link disappeared from sidebar after three-mode navigation was built. Never added to `WORK_NAV`.
**Root cause**: `Intelligence` section in `WORK_NAV` only had Insights and Assistant. Memory not added during navigation rebuild.
**Fix**: Added `Brain` import; added `{ label: "Memory", href: "/memory", icon: Brain }` to Intelligence section.

### BUG-028 — Notification Bell Badge Showed Wrong Unread Count [FIXED 2026-06-29]

**File**: `frontend/src/layouts/asthra-shell.tsx`
**Symptom**: Badge on notification bell only counted Zustand seed/local notifications, not core API notifications. Most users had no seed notifications unread → badge always hidden.
**Root cause**: `unreadNotifications` only read from `useNotificationStore`. Core API notifications are fetched inside `NotificationCenter` only when panel is open — badge never saw them.
**Fix**: Added background `coreNotificationsQuery` (same key as NotificationCenter: `["core", "notifications"]`) enabled whenever accessToken exists. Combined `unreadNotifications = zustandUnread + coreUnread`. Cache shared so no duplicate fetch when panel opens.

### BUG-029 — Setup Checklist Invite + Roles Checks Used Identical Condition [FIXED 2026-06-29]

**File**: `frontend/src/components/platform/org-setup-checklist.tsx`
**Symptom**: "Invite team member" and "Assign roles" both completed at the same time (when 2+ distinct users had org assignments). Impossible to complete one without the other.
**Root cause**: Both items used `completed: hasMultipleMembers` (same variable = `uniqueUserIds.size > 1`).
**Fix**: Added `rolesQuery` to get `organization_owner` role ID. `invitedMember = assignments.some(a => a.user_id !== currentUser?.id)`. `assignedRoles = orgOwnerRoleId != null ? assignments.some(a => a.role_id !== orgOwnerRoleId) : false`.

### BUG-030 — Workspace Invite Accept Missing Org Membership + Org Role Assignment [FIXED 2026-06-29]

**Files**: `services/core-service/app/repositories/invitation_repository.py`
**Symptom**: Users who accepted workspace invitations weren't visible in org member lists and hit the onboarding gate on next login.
**Root cause**: `add_memberships()` only created `OrganizationMember` if `invitation.organization_id is not None`. Workspace invitations with `organization_id=None` (legacy/edge case) skipped org membership. Also, no org-scope `RoleAssignment` was ever created — only workspace-scoped — leaving user without a valid org role.
**Fix**: Added new block in `add_memberships()` for workspace invitations: look up workspace.organization_id, ensure OrganizationMember exists, look up `organization_member` role, create org-scope RoleAssignment if no active one exists for that user+org.

### BUG-032 — Core Migration 0013 Failed When role_assignments Already Existed [FIXED 2026-06-30]

**File**: `services/core-service/alembic/versions/0013_scoped_membership_foundation.py`
**Symptom**: Core startup failed during Alembic upgrade from `0012_access_control_foundation` to `0013_scoped_membership_foundation` with `sqlite3.OperationalError: table role_assignments already exists`. API Gateway login returned 502 because Core was unavailable.
**Root cause**: Migration 0013 unconditionally created scoped membership tables/indexes and altered `team_members`. Local SQLite dev databases can already contain those objects from model metadata/bootstrap partial startup while the Alembic version is still before 0013.
**Fix**: Added inspector-based existence guards for tables, indexes, and `team_members` columns/indexes in migration 0013. Fresh DB creation remains supported, and existing local dev DBs with pre-created scoped membership objects no longer crash.

### BUG-033 — Unified Platform Context Frontend Had Mixed Old/New Permission State [FIXED 2026-06-30]

**File**: `frontend/src/context/platformContext.tsx`
**Symptom**: Platform context still referenced stale split-query state (`permissionsQuery`) after the Unified Platform Context migration. It also had duplicate selected scope / permission-code declarations in the provider path.
**Root cause**: Feature Flag Engine additions were layered onto the old context shape while the provider had already moved to `GET /context/platform`.
**Fix**: Removed stale `permissionsQuery` references, used `contextQuery.data?.permissions`, `contextQuery.data?.feature_flags`, and `contextQuery.data?.enabled_modules` as the source of truth, and added safe defaults for module registry fields.

### BUG-034 — Unified Platform Context Returned Empty Feature Flags [FIXED 2026-06-30]

**File**: `services/core-service/app/api/v1/context.py`
**Symptom**: `GET /context/platform` returned `feature_flags: {}` even though Feature Flag Engine v1 exposed effective flags through the permissions resolver.
**Root cause**: The context endpoint had a hardcoded empty dict instead of forwarding the `feature_flags` / `enabled_modules` values returned by `AccessControlService.get_user_permissions()`.
**Fix**: Context response now forwards effective `feature_flags` and `enabled_modules`, and includes resolved Module Registry modules.

### BUG-035 — Recurring "Table Already Exists" Crash-Loop Pattern — Permanently Fixed [FIXED 2026-06-30]

**Files**: `services/core-service/app/db/migration_utils.py` (new), all 9 migration files with `op.create_table` / `op.create_index`
**Symptom**: Second occurrence of the crash-loop pattern — 0013 failed with "table role_assignments already exists", 0014 failed with "table feature_flags already exists". Every future migration creating a table or index was at risk.
**Root cause pattern**: SQLite dev volumes can reach a state where `alembic_version` is behind the actual schema (partial runs, `create_all()`, container rebuild reusing named volumes). Alembic retries the failed migration on every startup → persistent crash loop.
**Fix**: Created `app/db/migration_utils.py` with three shared helpers (`table_exists`, `index_exists`, `column_exists`). Retrofitted migrations 0001, 0005, 0006, 0008, 0010, 0011, 0013, 0014, 0015 — all `op.create_table` calls guarded with `if not table_exists(...)`, all `op.create_index` calls guarded with `if not index_exists(...)`.
**Verification**: Double-upgrade test passed — first run applied 0014+0015 cleanly, second run was a silent no-op.
**Standing rule**: All future migrations that create tables or indexes MUST use these guards. See `decisions.md`.

### BUG-040 — Direct Role Assignment Missing OrganizationMember/WorkspaceMember Records [FIXED 2026-07-02]

**Files**: `services/core-service/app/services/scoped_membership_service.py`, `services/core-service/app/repositories/organization_repository.py`, `services/core-service/app/api/v1/system.py`
**Symptom**: Users assigned a role directly via Settings → Members (i.e., `POST /role-assignments`) had a `RoleAssignment` record but no `OrganizationMember` or `WorkspaceMember` record. `/context/platform` calls `OrganizationService.list()` which queries `OrganizationMember` → user gets empty `organizations[]` and is stuck in the onboarding gate or sees an empty UI despite having a role.
**Root cause**: `ScopedMembershipService.create_role_assignment()` only created the `RoleAssignment` row. The `OrganizationMember`/`WorkspaceMember` creation happened in the invitation flow (`invitation_repository.add_memberships()`) but not in the direct assignment flow. `OrganizationRepository.list_for_user()` also only queried `OrganizationMember`, with no fallback to `role_assignments`.
**Fix (3 parts)**:
1. **Membership creation on assignment** (`scoped_membership_service.py`): Added `_ensure_memberships_for_assignment()`. For org-scope assignments: creates `OrganizationMember` if missing. For workspace-scope: creates `WorkspaceMember` + `OrganizationMember` for the workspace's org + org-scope `organization_member` `RoleAssignment` if none exists (matching BUG-030 invitation pattern).
2. **Resilient context query** (`organization_repository.py`): `list_for_user()` now unions `OrganizationMember` records + active org-scoped `RoleAssignment` records, so users with only role assignments (pre-existing or edge cases) still see their organizations.
3. **Backfill endpoint** (`system.py`): Added `POST /system/backfill-memberships` (superuser-only) to create missing `OrganizationMember`/`WorkspaceMember` records for all existing direct role assignments.
**Tests**: Added `test_direct_org_role_assignment_creates_org_member` and `test_direct_workspace_role_assignment_creates_workspace_and_org_member` to `tests/test_scoped_membership.py`. Both pass (5/5 total in file).

### BUG-041 — Settings Pages Showed "Access Restricted" for Users with Explicit Permissions [FIXED 2026-07-02]

**Files**: `frontend/src/app/settings/layout.tsx`, `frontend/src/app/settings/members/page.tsx`, `frontend/src/app/settings/organizations/[id]/page.tsx`, `frontend/src/app/settings/workspace/page.tsx`
**Symptom**: Users with explicitly granted settings permissions (e.g., `settings.member.view` on `organization_member` role) received "Access Restricted" on all non-personal settings pages, including the Members page they were meant to access.
**Root cause**: `settings/layout.tsx` checked for known admin ROLE KEYS (`PLATFORM_ADMIN_KEYS`, `ORG_ADMIN_KEYS`, `WORKSPACE_ADMIN_KEYS`) and blocked all non-personal routes for users without any of those keys — before any permission code (`can()`) check could run. `settings/members/page.tsx` had the same role-key gate duplicated.
**Fix**:
1. **Layout** (`settings/layout.tsx`): Removed the PERSONAL_ROUTES check and the blanket "Access Restricted" block. All non-superuser, non-platform, non-org-admin, non-workspace-admin users now receive `authorityLevel: "member"` and `{children}` renders. Each page controls its own access via `can()`.
2. **Members page** (`settings/members/page.tsx`): After admin role checks, added a 4th query (`memberPermQuery`) that fetches scoped permissions at the user's first org/workspace scope. If `permission_codes` includes `settings.member.view`, shows `MembersView` scoped to that org/workspace.
3. **Org settings page** (`settings/organizations/[id]/page.tsx`): Added `can("settings.organization.edit")` to `isAuthorized` so users with that permission can edit even if not an org admin by role key.
4. **Workspace settings page** (`settings/workspace/page.tsx`): Added `can("settings.workspace.edit")` to `isAuthorized`.
**Design rule**: `useSettingsAuthority()` / `authorityLevel` is kept for scope context (which org/workspace to query) and navigation mode only. Permission checks MUST use `can()` from the scoped query — never role keys alone.

### BUG-042 — Settings Pages Did Not Enforce Permission Hierarchy [FIXED 2026-07-02]

**Files**: `frontend/src/app/settings/members/page.tsx`, `frontend/src/app/settings/organizations/page.tsx`, `frontend/src/app/settings/organizations/[id]/page.tsx`, `frontend/src/app/settings/workspaces/page.tsx`, `frontend/src/app/settings/workspace/page.tsx`, `frontend/src/components/settings/settings-admin-views.tsx`, `frontend/src/lib/settings-permissions.ts` (new)
**Symptom**: Child permissions (e.g., `settings.member.view`, `settings.workspace.view`) were checked independently. A user with only `settings.member.view` but without `settings.organization.view` could potentially reach member pages. Action buttons inside `MembersView` (`canInvite`, `canChangeRoles`, `canRemoveMembers`) did not chain parent permissions.
**Root cause**: Page-level and component-level permission checks used flat `can(code)` calls without verifying that all parent permissions in the hierarchy were also granted.
**Fix**:
1. **`frontend/src/lib/settings-permissions.ts`** (new): Created `hasHierarchicalPermission(can, ...permissions)` helper — returns true only when `permissions.every(p => can(p))`.
2. **Admin bypass pattern**: All pages compute `isAdminUser = isSuperuser || authorityLevel === "platform" || authorityLevel === "org"`. Admin users bypass all hierarchy checks.
3. **`settings/organizations/page.tsx`**: Gates on `isAdminUser || hasHierarchicalPermission(can, "settings.organization.view")`.
4. **`settings/organizations/[id]/page.tsx`**: Same page-level gate; `isAuthorized` uses full `org.view + org.edit` chain; `OrgTabs` now accepts `hiddenTabs` to hide Members/Workspaces tabs when sub-permissions are absent.
5. **`settings/workspaces/page.tsx`**: Rewritten from trivial wrapper; gates on `org.view + workspace.view` hierarchy.
6. **`settings/workspace/page.tsx`**: Added page-level `canViewWorkspace` gate; `isAuthorized` chains `org.view + workspace.view + workspace.edit`.
7. **`settings/members/page.tsx`**: Updated `canViewMembers` to chain `org.view + member.view` via `memberPermQuery` scoped codes.
8. **`settings-admin-views.tsx` MembersView**: `canInvite`, `canChangeRoles`, `canRemoveMembers` now use `hasHierarchicalPermission` chaining `org.view + member.view + action-permission`.
**Permission hierarchy**: `organization.view` (root) → `member.view` / `workspace.view` (level 2) → `member.invite` / `member.remove` / `role.manage` / `workspace.create` / `workspace.edit` / `workspace.delete` (level 3).

### BUG-043 — Hard Reset Shows Onboarding Gate Instead of Redirecting to /login [FIXED 2026-07-03]

**File**: `frontend/src/layouts/asthra-shell.tsx`
**Symptom**: After a hard reset (or with an expired/invalid token), `GET /context/platform` returns 401. Instead of redirecting to `/login`, the app shows the onboarding gate (Create Your First Organization).
**Root cause**: `isAuthenticated` is persisted to localStorage — on reload with a stale/expired token, it is `true`. The existing auth redirect effect only fires when `isAuthenticated === false`, so it misses the expired-token case. With `contextIsError = true, contextLoading = false, contextLoadedAt = null, organizations = []`, the `needsOnboarding` condition evaluated to `true` (all conditions met), showing the onboarding gate.
**Fix (4 changes to `asthra-shell.tsx`)**:
1. Destructured `isError: contextIsError, error: contextError` from `usePlatformContext()`.
2. Added `!contextIsError` to `needsOnboarding` condition — prevents onboarding gate from showing when context is in any error state.
3. Added `useEffect` that detects `contextError.status === 401` and calls `logout()` (which clears all stores and redirects to `/login`).
4. Added synchronous `return null` guard between the context-loading gate and the onboarding gate — renders nothing while the useEffect redirect fires.
**Guard order after fix**: public path → hydration/auth → context loading → 401 null guard → onboarding gate.

### BUG-044 — Member Detail Sections Used Broad settings.member.view Instead of Granular Codes [FIXED 2026-07-03]

**Files**: `services/core-service/app/services/permission_registry.py`, `frontend/src/lib/permission-registry.ts`, `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: In God Mode, all four detail section cards (Scoped Role Assignments, Effective Permissions, Current Roles, Teams) were gated by the same broad `settings.member.view` code. Toggling this code in simulation hid/showed ALL sections at once — no way to independently control each section.
**Root cause**: Phase 3 wrapped each section with `PermissionGate permission="settings.member.view"` — the right approach for Phase 3, but the permission codes weren't granular enough for section-level control.
**Fix (hybrid granular model)**:
1. Added `"view.roles"`, `"view.permissions"`, `"view.teams"` to `ACTION_NAMES` in `permission_registry.py` with descriptive names.
2. Added these 3 actions to the `"member"` entry in `REGISTRY_DEFINITIONS` (produces `settings.member.view.roles`, `.view.permissions`, `.view.teams`).
3. Added 3 new entries to `PERMISSION_REGISTRY` in `permission-registry.ts` with `requires: ["settings.organization.view", "settings.member.view"]`.
4. Updated `settings.member.view` `affects` description to remove sections now covered by granular codes.
5. Updated PermissionGate codes: Scoped Role Assignments → `view.roles`, Effective Permissions → `view.permissions`, Current Roles → `view.roles`, Teams → `view.teams`.
**Design**: `settings.member.view` remains the page/list gate. Granular sub-codes gate individual sections on the detail page. They have `settings.member.view` as a required parent.

### BUG-045 — Actions Column Header Shown Even When User Has No Action Permissions [FIXED 2026-07-03]

**Files**: `frontend/src/components/settings/settings-admin-views.tsx`
**Symptom**: In `MembersView`, the "Actions" column header was always shown. When a user had no `settings.member.view`, `settings.role.manage`, or `settings.member.remove` permissions, the Actions column appeared as an empty ghost-only column (with `PermissionGate` placeholders visible but no real buttons).
**Root cause**: The columns array was hardcoded: `["Name", ..., "Actions"]`. No logic checked whether the user actually had any action permissions before showing the header.
**Fix**:
1. Added `useSimulationStore` import to `settings-admin-views.tsx`.
2. In `MembersView`: call `usePlatformContext()` to get `can()`, and `useSimulationStore` to get `isEditMode`.
3. Compute `hasAnyAction = isEditMode || can("settings.member.view") || can("settings.member.resend") || can("settings.member.cancel") || (!isGlobalDirectory && (can("settings.role.manage") || can("settings.member.remove")))`.
4. Change columns to `[..., ...(hasAnyAction ? ["Actions"] : [])]`.
5. Change invitation and member row arrays to conditionally include the actions cell via spread.
**God Mode rule**: `isEditMode` always keeps `hasAnyAction = true` so God Mode +/- overlays remain accessible even when the user has no real permissions.

### BUG-046 — Dynamic Nav Sidebar Empty After Scope Auto-Selection [FIXED 2026-07-04]

**Files**: `services/core-service/app/api/v1/context.py`, `frontend/src/services/api/core-api.ts`, `frontend/src/context/platformContext.tsx`
**Symptom**: After scope auto-selection (org/workspace IDs confirmed), the sidebar became empty — all dynamic nav items disappeared. Static fallback did not activate.
**Root cause**: Backend inferred `navigation_mode` from scope params: if `workspace_id` was present, it returned work modules regardless of the user's actual navigation mode. A superuser in platform mode with a workspace selected received `navigation_mode="work"` modules. `buildNavSections("platform")` found no matching modules → empty `ModeNavSection[]` → sidebar empty. The static fallback only triggered when `availableModules.length === 0`, but the backend returned non-empty work modules, so the fallback never activated.
**Fix**:
1. **Backend** (`context.py`): Added optional `navigation_mode` query param. Uses it if provided and valid ("platform"/"org"/"work"); falls back to inferring from scope params when not provided.
2. **API** (`core-api.ts`): Added `navigation_mode?: string` to `getPlatformContext` params type and URL serialization.
3. **Context** (`platformContext.tsx`): Added `useState<NavigationMode>` seeded from `auth-store.currentUser.is_superuser` (persisted across sessions — correct on first render without API call). Added `useEffect` to update mode once roles arrive from first response. `navigationMode` included in `queryKey` so a mode change triggers a refetch.
**First-load behavior**: Superusers: seed = "platform" → correct from render 0, no extra call. Work users: seed = "work" → correct, no extra call. Org owners: seed = "work" → one extra refetch after roles arrive and mode updates to "org". Static fallback still active when `availableModules.length === 0`.

### BUG-048 — God Mode Exit Not Returning to Real Data [FIXED 2026-07-07]

**Files**: `frontend/src/context/platformContext.tsx`, `frontend/src/lib/permission-simulator.ts`
**Symptom**: After exiting God Mode, the app showed an empty org list (or stale mock data) instead of the real user's organizations. The God Mode tracker retained previous permission registrations from the mock session.
**Root cause (3 parts)**:
1. On `isGodModeReady → false`, `effectiveOrganizations` reverted to `organizations` (real query data). But `contextQuery` was stale — 2-minute `staleTime` and no forced refetch on God Mode exit meant the cache held data from before (or during) simulation. Mock interceptor may have replaced the cache during the session.
2. Workspace store still held mock scope IDs (org 9001, workspace 9001, project 9001) set during God Mode activation. `confirmedOrganizationId` could resolve to null (9001 not in real org list) causing a null-scope refetch, but the god-mode mock orgs might still be in the Zustand `cachedOrganizations` from the last `setPlatformContext` call.
3. `useGodModeTracker` retained stale permission registrations from the God Mode session, polluting the auto-overlay panel after exit.
**Fix**:
1. **`platformContext.tsx`**: Added `prevGodModeReady = useRef(false)`. Added `useEffect` watching `isGodModeReady`: on `true → false` transition, calls `setSelectedOrganization(null)`, `setSelectedWorkspace(null)`, `setSelectedProject(null)`, then `void contextQuery.refetch()` — ensuring real scope IDs are cleared before the fresh context fetch.
2. **`permission-simulator.ts`**: In `deactivateGodMode`, call `useGodModeTracker.getState().clearAll()` before `set({ isDeactivating: true })` — clears tracker before exit animation starts.
