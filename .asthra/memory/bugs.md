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

## Open

_(none currently tracked)_
