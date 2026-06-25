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

## Open

_(none currently tracked)_
