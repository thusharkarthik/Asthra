# Platform State

Last updated: 2026-06-25

## Branch

`feature/bootstrap-superuser-and-progress` → cleaned up and fixes committed to `fix/settings-members-authority-scope`

## Settings → Members Page

Fixed and working as of 2026-06-25.

- **`/settings/members`** — authority-based scope (superuser → global; platform admin → global; org admin → org-scoped; workspace admin → workspace-scoped). No bottom-bar dependency.
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
