# Bug Registry

## Fixed

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

## Open

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
