# Architectural Decisions

## 2026-06-28 — Role-Permission Sync Is Now Additive Only; Manual Assignments Are Permanent Truth

**Decision**: `_sync_role_template_permissions()` no longer deletes any existing `RolePermission` rows. It only adds permissions that match template patterns but are absent from the DB. Manual permission assignments made via the admin UI persist permanently across restarts and syncs.

**Why**: The previous destructive behavior wiped manual role-permission assignments on every `ensure_role_catalog()` call. The RBAC lifecycle intention is: template patterns are the *starting point* for seeding initial permissions, not an enforced constraint that must be maintained forever. Once an admin assigns a permission to a role, that is the living truth. Sync should only bring in *new* permissions added by new services — it must never remove what an admin deliberately put there (or kept absent).

**How to apply**: When adding new permissions via `REGISTRY_DEFINITIONS` in `permission_registry.py`, they will be auto-seeded onto matching roles the next time the admin clicks "Sync Permissions" or on server restart. Existing role-permission data is never touched by sync. If a permission needs to be removed from a role, an admin must explicitly uncheck it in the role detail UI.

**Call frequency change**: `ensure_role_catalog()` with `sync_permissions=True` now only runs: (a) first-user registration (in `auth_service.py`), (b) server startup (in `access_control_bootstrap.py`, already used `sync_permissions=False`), (c) explicit admin "Sync Permissions" button (`POST /permission-registry/sync`). Normal API calls (`list roles`, `list templates`, `/me/permissions`) use `sync_permissions=False` to avoid triggering the expensive `sync_registry_permissions()` on every request. The additive-only role-permission sync (`_sync_role_template_permissions`) still runs on those calls (via `ensure_role_catalog(sync_permissions=False)`) to ensure roles stay seeded, but since it never deletes, it is safe and cheap.

**Admin sync trigger**: `POST /permission-registry/sync` now does both: (1) syncs the permission catalog (creates/updates permissions from `REGISTRY_DEFINITIONS`), then (2) calls `ensure_role_catalog(sync_permissions=False)` to seed any newly-created permissions onto roles matching template patterns.

---

## 2026-06-27 — Functional Roles Deactivated; Role Permission Editing Unlocked

**Decision 1 — Deactivate Functional Roles**: Functional roles (scrum_master, product_owner, engineering_manager, release_manager, incident_commander, knowledge_manager) are job title labels masquerading as permission roles. They have been set to `is_active: False` in `ASTHRA_ROLE_TEMPLATES` so they are deactivated on every `ensure_role_catalog()` call. They are NOT deleted — permission mappings preserved. Plan to replace with a Labels system in Phase B.

**Decision 2 — Role Permission Editing for Elevated Users**: Superuser and Platform Owner can now add/remove permissions from any system role via the role detail page. Implementation: `_can_manage_role_permissions(user, role)` helper bypasses the `is_editable=False` guard in `link_permission()` and `unlink_permission()`. The Superuser role itself is permanently locked (no one can edit it). Platform Admin can only edit non-system roles — unchanged behavior.

**Why not change is_editable on system roles**: `is_editable` guards the role's name/scope/description fields too. Changing it would allow renaming system roles. The bypass lives only in the permission link/unlink methods so the role definition stays protected.

**Phase B Labels plan**: When Labels system ships, functional roles can be deleted or migrated. Deactivating rather than deleting preserves the assignment history and permission mappings.

---

## 2026-06-27 — platform_member Retired; organization_member Added

**Decision**: Remove `platform_member` (platform-scoped) from the role catalog. Add `organization_member` (organization-scoped) as the base org membership role.

**Rationale for removing platform_member**: The role was a temporary fallback for invited users before the "authenticated, no org" onboarding state was implemented. It served no architectural purpose once the platform invite flow was reworked. Keeping it created confusion in role dropdowns — users would see a platform role that doesn't grant any meaningful access.

**Rationale for adding organization_member**: A base org-level role was missing for users who belong to an org but have not yet been assigned to a workspace. This fills the hierarchy gap between "has no role" and "Organization Auditor". It grants minimal visibility (profile, notifications, preferences, org view) without allowing any management or workspace access.

**Implementation**:
- Removed from `ASTHRA_ROLE_TEMPLATES` in `role_service.py`
- `ensure_role_catalog()` now deactivates `platform_member` in DB on first call after deploy (sets `is_active = False`, does not delete)
- `organization_member` added to `ASTHRA_ROLE_TEMPLATES` after `organization_auditor`
- Frontend: removed `platformMemberRole` variable and its use as the default invite role; updated info card text; `is_active !== false` filter in `groupedAllRoles` automatically excludes the now-inactive platform_member

---

## 2026-06-26 — user_roles Fully Retired; role_assignments is Sole Source of Truth

**Decision**: `user_roles` table is fully retired — nothing writes to it, nothing reads from it. `role_assignments` is the exclusive authority for all role information across all scopes.

**Changes (branch: fix/remove-user-roles)**:
- `auth_service._assign_first_user_platform_roles()`: writes only to `RoleAssignment`, not `UserRole`
- `role_service.assign_user_role()`: returns `RoleAssignment` instead of `UserRole`, raises 409 on duplicate (no silent refresh), no `user_roles` write
- `access_control_service._resolve_roles()`: removed `UserRole` loop entirely; reads from `role_assignments` + legacy membership role fields
- `invitation_repository.add_memberships()`: writes `RoleAssignment` after membership creation; no `role_id` written to `OrganizationMember`/`WorkspaceMember`
- `users.py`: removed `POST/GET/DELETE /users/{id}/roles` endpoints — use `/role-assignments` instead
- `Invitation.organization_id`: nullable for platform-scope invites; `invitation_service` routes to `_assign_platform_role()` when `organization_id is None`

**Constraint**: `user_roles` table is NOT dropped (data is preserved). Production DB needs a migration for `invitations.organization_id` nullable change.

---

## 2026-06-26 — role_assignments is Primary Write Path; user_roles is Backward-Compat Only

**Decision**: `POST /users/{id}/roles` now dual-writes to both `user_roles` (for backward compat) and `role_assignments` (primary, scoped). `role_assignments` is the authoritative source of truth for scoped role data.

**Rationale**: The `user_roles` table is unscoped — unique on `(user_id, role_id)` only. It cannot represent the same role assigned at multiple scopes (e.g., workspace_admin at workspace 1 AND workspace 2). `role_assignments` has `(user_id, role_id, scope_type, scope_id)` uniqueness and supports this naturally.

**Constraints (Phase A)**:
- `user_roles` table is NOT dropped. Still written to for backward compat with any code reading from it.
- `_resolve_roles()` in `access_control_service.py` now only applies `user_roles` entries where `role.scope == "platform"`. Non-platform roles get their correct scope from `role_assignments`.
- Phase B (future): consolidation pass to stop writing to `user_roles` entirely and migrate read paths to `role_assignments` exclusively.

**`platform_member` role** added to `ASTHRA_ROLE_TEMPLATES`: minimal platform-scoped role for newly invited users (settings.profile.view, settings.notifications.view, settings.preferences.view). Default selection in invite modal.

---

## 2026-06-25 — Settings Members Page: Authority-Based Scope

**Decision**: `/settings/members` derives scope from the logged-in user's own roles, not from the bottom bar.

**Rationale**: The bottom bar reflects the user's current navigation context (which workspace they're working in), not their administrative authority. An org admin who has their bottom bar set to a workspace should still see org-scoped members when managing members, not workspace-scoped members. Tying the admin page to navigation state creates a confusing, fragile UX where the page content changes silently when the user switches workspaces.

**Implementation**: Three `useQuery` calls in `page.tsx` (disabled for superusers) — platform-scope permissions, user's active role assignments, and roles list. Cross-reference role IDs to keys to determine authority tier.

**Alternatives rejected**:
- Using `useCurrentPermissions` hook with `null` override — doesn't work; hook falls back to store selections.
- Fetching org-scope permissions for each org — requires knowing which orgs to query first.
- Relying on `UserRole` table for org/workspace authority — `UserRole` is unscoped and only used for platform roles.

## 2026-06-25 — scopeOrganizationId: No Silent Fallback

**Decision**: Remove `organizations[0]?.id` fallback from `scopeOrganizationId` in `MembersView`. Use `null` instead.

**Rationale**: The fallback silently selected the wrong organization when multiple orgs exist or when the user is in global directory mode. The existing `!scopeOrganizationId` guard in `submitInvite` is the correct safety net — the fallback was defeating it.

## 2026-06-26 — rbac.ts Check Functions Removed; can() Is Now Sole Frontend Access Control

**Decision**: Deleted `lib/rbac.ts` Category B functions (`hasAtLeastRole`, `canView`, `canManageMembers`, `canManageRoles`, `canManageProjects`, `canEditWork`, `canManagePlatform`, `canManageOrganization`, `canManageWorkspace`, `canManageProject`, `canManageTeam`, `canInviteMembers`, `canViewAudit`). Renamed file to `lib/role-utils.ts` containing only display/sorting utilities (`normalizeRole`, `roleRank`, `ROLE_RANK`, `RoleName`, `RoleContext`).

**Rationale**: The Category B functions use role-name/rank comparisons for access control decisions. This contradicts Asthra's permission-code system (`can()` from `platformContext.tsx` via `lib/permissions.ts`). Having two systems causes confusion about which to use for new code, and the role-rank approach can't express the granular action-level permissions the backend enforces. `can()` is the correct mechanism.

**Outcome**: `lib/rbac.ts` no longer exists. `lib/role-utils.ts` is the file for display/sorting only. `can()` from `usePlatformContext()` (or the `useCan()` hook) is the sole frontend access control mechanism.

**Investigation finding**: None of the Category B functions were actually imported or called outside `rbac.ts` itself. The one consumer (`settings-admin-views.tsx`) only imported `normalizeRole` (Category A), so no call-site replacements were needed.
