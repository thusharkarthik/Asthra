# Platform State

Last updated: 2026-06-26

## Branch

`feature/bootstrap-superuser-and-progress` → cleaned up and fixes committed to `fix/settings-members-authority-scope`

## Settings Auth Guard

`frontend/src/app/settings/layout.tsx` — created 2026-06-26. Central auth guard for all `/settings/*` routes.

- Unauthenticated users → redirect to `/login` (belt-and-suspenders; AsthraShell also handles this)
- Superuser / platform admin/owner → full settings access (renders children)
- Org admin/owner, workspace admin/manager → full settings access (renders children)
- No admin authority:
  - Personal routes (`/settings`, `/settings/profile`, `/settings/preferences`, `/settings/notifications`, `/settings/account`) → allowed
  - All other routes → "Access Restricted" state

Uses same TanStack Query keys as `members/page.tsx` so one cached fetch serves layout + page.

## Settings → Members Page

Fixed and working as of 2026-06-25 (updated 2026-06-26).

- **`/settings/members`** — authority-based scope (superuser → global; platform admin → global; org admin → org-scoped; workspace admin → workspace-scoped; no match → "Access Restricted" empty state, no member API calls). No bottom-bar dependency.
- **`/settings/members/[id]`** — authority check added 2026-06-26. Same authority resolution as members page. No admin role → "Access Restricted", no member detail rendered.
- **`/settings/organizations/:id/members`** — correctly scoped by URL param. Untouched.
- **`/settings/workspaces/:id/members`** — correctly scoped by URL param. Untouched.
- **`/settings/projects/:id/members`** — correctly scoped by URL param. Untouched.

## RBAC Architecture

- Two role tables: `UserRole` (unscoped, no audit) and `RoleAssignment` (scoped, with status/audit).
- Platform-scope `/me/permissions` (no query params) only returns platform-level roles. Org/workspace assignments never surface at platform scope.
- `useCurrentPermissions` hook cannot force platform scope by passing null — always falls back to store selections.
- `getCurrentPermissions(token, {})` called directly (bypassing the hook) correctly targets platform scope.

## First User Bootstrap

First registered user gets `is_superuser=True`, plus dual-write to both `UserRole` and `RoleAssignment` for `superuser` and `platform_owner` roles.
