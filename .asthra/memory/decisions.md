# Architectural Decisions

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
