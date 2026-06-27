# Platform State

Last updated: 2026-06-26 (role_assignments unification — user_roles fully retired, platform invite scope)

## Phase

**Core Stabilization** — RBAC hardening, Settings access control, Settings UX polish, notification improvements.

## Branch

Current branch: `fix/remove-user-roles`. Uncommitted changes (9 files modified: auth_service, role_service, access_control_service, invitation model/schema/repository/service, users.py endpoints, test_access_control_rbac).

## Settings Auth Guard + Authority Context

`frontend/src/app/settings/layout.tsx` — created 2026-06-26, updated 2026-06-26.

Central auth guard for all `/settings/*` routes. Also exports `SettingsAuthorityContext` (and `useSettingsAuthority` hook) so child pages can branch on authority without duplicate API calls.

- Unauthenticated users → redirect to `/login` (belt-and-suspenders; AsthraShell also handles this)
- Superuser / platform admin/owner → full settings access, context: `authorityLevel: "superuser"/"platform"`, `orgId: null`, `workspaceId: null`
- Org admin/owner → full settings access, context: `authorityLevel: "org"`, `orgId: <scope_id>`, `workspaceId: null`
- Workspace admin/manager → full settings access, context: `authorityLevel: "workspace"`, `orgId: null`, `workspaceId: <scope_id>`
- No admin authority on personal routes → children rendered, context: `authorityLevel: "member"`
- No admin authority on all other routes → "Access Restricted" state (children never mount)

Uses same TanStack Query keys as `members/page.tsx` so one cached fetch serves layout + all settings pages.

`SettingsAuthorityValue` type exported. Default context value is `{ authorityLevel: null, ... }` — treated as "show everything" to keep tests that render pages without layout working.

## Settings Home Page (`/settings`)

`frontend/src/app/settings/page.tsx` — updated 2026-06-26.

Conditionally renders based on authority context:
- `authorityLevel === "member"` → personal cards only (Profile, Preferences, Notifications, Account)
- Any other level (including `null` default for tests without layout) → full `<SettingsHomeView />`

## Settings → Members Page

Fixed and working as of 2026-06-25 (updated 2026-06-26).

- **`/settings/members`** — authority-based scope (superuser → global; platform admin → global; org admin → org-scoped; workspace admin → workspace-scoped; no match → "Access Restricted" empty state, no member API calls). No bottom-bar dependency.
- **`/settings/members/[id]`** — authority check added 2026-06-26. Same authority resolution as members page. No admin role → "Access Restricted", no member detail rendered.
- **`/settings/organizations/:id/members`** — correctly scoped by URL param. Untouched.
- **`/settings/workspaces/:id/members`** — correctly scoped by URL param. Untouched.
- **`/settings/projects/:id/members`** — correctly scoped by URL param. Untouched.

## Frontend Access Control

`lib/rbac.ts` has been deleted (2026-06-26). `lib/role-utils.ts` replaces it with display/sorting utilities only:
- `normalizeRole()`, `roleRank()`, `ROLE_RANK`, `RoleName`, `RoleContext`
- No access control functions

`can()` from `usePlatformContext()` (backed by `lib/permissions.ts` + backend permission codes) is the **sole** frontend access control mechanism. Do not add role-rank checks for visibility/gating decisions — use `can("module.resource.action")` instead.

## RBAC Architecture

- Two role tables: `UserRole` (unscoped, no audit, kept but fully retired) and `RoleAssignment` (scoped, with status/audit, sole source of truth).
- **Phase B complete (2026-06-26)**: `role_assignments` is the **exclusive** source of truth. Nothing writes to `user_roles`. Nothing reads from `user_roles`. `_resolve_roles()` reads only from `role_assignments` + legacy membership table role fields (OrganizationMember, WorkspaceMember, etc.).
- `user_roles` table kept in schema but no code writes/reads it. Production DB would need a migration to add `nullable=True` on `organization_id` in `invitations` table.
- `platform_member` role added to `ASTHRA_ROLE_TEMPLATES` — minimal platform role for new invitees.
- Platform-scope `/me/permissions` (no query params) only returns platform-level roles. Org/workspace assignments never surface at platform scope.
- `useCurrentPermissions` hook cannot force platform scope by passing null — always falls back to store selections.
- `getCurrentPermissions(token, {})` called directly (bypassing the hook) correctly targets platform scope.

## Invitation Schema (Platform Scope Support)

`Invitation.organization_id` is now nullable (`int | None`). `organization_id is None` = platform-scoped invite. When accepted, writes directly to `role_assignments` via `_assign_platform_role()`. No org membership created.

`InvitationCreate.organization_id: int | None = None` and `InvitationRead.organization_id: int | None = None`.

Duplicate invite detection uses `.is_(None)` for NULL comparison in SQLAlchemy (not `== None`).

## First User Bootstrap

First registered user gets `is_superuser=True`, plus write to `RoleAssignment` (only) for `superuser` and `platform_owner` roles.

## Superuser Self-Removal Guard

Added 2026-06-26. `AccessControlService.guard_superuser_self_removal(target_user_id, current_user)` raises 400 if a superuser tries to modify their own roles. Called from:
- `DELETE /role-assignments/{id}` in `role_assignments.py`
- `PATCH /role-assignments/{id}` in `role_assignments.py`
- (users.py endpoints removed entirely — use /role-assignments instead)

The "last superuser" guard already existed in `ScopedMembershipService._ensure_not_last_protected_assignment()` and `RoleService._ensure_not_last_protected_role()`.

## Users API

`POST /users/{id}/roles`, `GET /users/{id}/roles`, `DELETE /users/{id}/roles/{role_id}` — **removed** from `users.py`. Role operations go through `/api/v1/role-assignments` endpoints exclusively.

## Notification Center

`frontend/src/components/platform/notification-center.tsx` — updated 2026-06-26.

"Mark all read" button now hidden when there are no unread notifications. Condition: `allNotifications.some(n => n.unread)`. Empty state shows cleanly without the button.

## Settings Forms UX

`frontend/src/components/settings/settings-admin-views.tsx` — updated 2026-06-26.

**Searchable member typeahead**: Added `SettingsMemberSelect` component (file-local). Replaces static `<select>` for:
- "Assign project owner" dialog (`owner_id`)
- "Add project member" dialog (`user_id`)
- "Assign member to team" dialog (`user_id`)
Uses hidden `<input>` for form value compatibility. Shows filtered dropdown after 2+ characters. `onMouseDown` for selection prevents blur from closing the dropdown prematurely.

**Multiline description fields**: All `<Input name="description">` replaced with `<textarea rows={3}>` using `DESCRIPTION_TEXTAREA_CLASS` constant (same CSS as Input component but without `h-9`, adds `py-2 resize-y min-h-[72px]`). Applied to 12 locations: create/edit forms for Org, Workspace, Project, Team, Role, and Permission.

## Member List Cache Invalidation

Fixed 2026-06-26. `invalidateSettingsAndContext()` in `settings-admin-views.tsx` now also invalidates `["settings", "members"]` and `["settings", "global-member-role-assignments"]` — the exact keys used by `membersQuery` in `MembersView`. Previously only `["members"]` was invalidated, which missed the `["settings", "members", orgId, wsId]` prefix.

Same keys added to `useInviteMemberMutation` and `useAssignRoleMutation` in `use-settings-mutations.ts`.
