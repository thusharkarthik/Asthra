# Platform State

Last updated: 2026-06-29 (Phase B start — Unified Platform Context API)

## Phase

**Phase B Core — Intelligence Layer** — Unified Platform Context API, Feature Flag Engine, Module Registry, Memory page, AI Context Registry.

## Branch

Current branch: `feature/org-health-score`. Clean build (137 static pages, 0 TypeScript errors).

## Permission Simulator (added 2026-06-29)

**Purpose**: Superuser and Platform Owner can "View As" any role to see exactly what the UI looks like, without changing real permissions.

**Files**:
- `frontend/src/lib/permission-simulator.ts` (new) — Zustand store (`useSimulationStore`), `roleKeyToNavigationMode()` helper
- `frontend/src/components/navigation/sidebar-nav.tsx` (updated) — "View As" button + panel, active simulation indicator
- `frontend/src/layouts/asthra-shell.tsx` (updated) — simulation banner above content, `effectiveNavigationMode` passed to sidebar and bottom bar
- `frontend/src/context/platformContext.tsx` (updated) — `can()` overrides to use simulated permissions
- `frontend/src/services/api/settings-api.ts` (updated) — `simulatePermissions()` API method
- `services/core-service/app/api/v1/access_control.py` (updated) — `GET /access-control/simulate` endpoint

**How `can()` override works**:
`PlatformContextProvider` subscribes to `useSimulationStore` (isSimulating, simulatedPermissions). When `isSimulating=true`, `can(code)` returns `simulatedPermissions.includes(code)` instead of the real permissions check. Included in `useMemo` deps so context re-renders on simulation change.

**How navigation mode switches**:
Shell computes `effectiveNavigationMode = isSimulating && simulatedMode ? simulatedMode : navigationMode`. Passed to `PermissionAwareSidebar` and used for bottom bar selectors. Superuser mode switcher hidden in sidebar during simulation.

**How banner is implemented**:
In `asthra-shell.tsx`, when `isSimulating`, renders a sticky amber `<div>` above the `<main>` content area: shows role name + "Exit Simulation" button. Always visible, cannot be dismissed without exiting.

**Security**: Backend `GET /access-control/simulate` is read-only. Checks caller is superuser OR has platform_owner/platform_admin role. Real token always used for API calls. No actual permissions are modified.

**`roleKeyToNavigationMode(key)`**: Maps role key → NavigationMode. Platform keys → "platform", org keys → "org", everything else → "work".

**NOT implemented** (out of scope — settings page): "View As This User" button in `/settings/members/[id]` — settings pages are off limits per task spec. Can be added later as it just calls `simulatePermissions(token, { user_id })` + `startSimulation(...)`.

## Three-Mode Navigation (added 2026-06-29)

**Files**:
- `frontend/src/lib/navigation-mode.ts` (new) — `NavigationMode` type, detection logic, three nav configs
- `frontend/src/components/navigation/sidebar-nav.tsx` (rewritten) — mode-aware sections, indicator, superuser switcher
- `frontend/src/layouts/asthra-shell.tsx` (updated) — mode computation, bottom bar per mode

**Mode detection** (`detectNavigationMode(isSuperuser, roles)`):
- `isSuperuser=true` → Platform Mode
- `platform_owner | platform_admin | platform_support` role key → Platform Mode
- `organization_owner | organization_admin | organization_auditor | organization_member` → Org Mode
- Anything else → Work Mode

**Auto-detect for superuser** (`autoDetectModeFromPath(pathname)`):
- `/flow`, `/docs`, `/discover`, `/desk`, `/pulse`, `/automation`, `/dev`, `/connect`, `/insights`, `/collab`, `/media`, `/guard` and sub-paths → Work Mode
- `/settings/organizations/{N}...` (org detail) → Org Mode
- Everything else → Platform Mode

**Superuser mode switching**: `superuserModeOverride` (`useState<NavigationMode | null>`) in `AsthraShell`. `null` = auto-detect. Manual select in sidebar dropdown overrides. Resets on logout (component re-mounts). Regular users never see the switcher.

**Nav configs** (in `navigation-mode.ts`):
- `PLATFORM_NAV`: Home, Organizations, Members, Access Control, Audit Logs, API Keys, Platform Health + Settings
- `ORG_NAV`: Home, Workspaces, Members, Teams, Roles + Org Settings, Preferences, Profile
- `WORK_NAV`: Home, Flow, Discover, Docs, Collab + Desk, Pulse, Automation + Dev, Connect + Insights, Assistant + Settings

**Permission filtering in Work Mode**: Items with `permission` field → `can(permission)` from `usePlatformContext()`. False → item hidden. Items without `permission` → always shown.

**Bottom bar per mode**:
- Platform: only `<SearchBar />` + "Platform Mode" text (no org/workspace/project selectors)
- Org: `<OrganizationSwitcher />` + `<SearchBar />`
- Work: `<OrganizationSwitcher />` + `<WorkspaceSwitcher />` + `<ProjectSwitcher />` + `<SearchBar />`

**Mode indicator** (top of sidebar):
- Platform: Settings icon + "Platform Mode"
- Org: Building2 icon + selected org name (or "Organization")
- Work: Layers icon + selected workspace name (or "Workspace")

**`nav-items.ts`** kept unchanged — still consumed by `command-palette.tsx` and `app/page.tsx` quick-launch grid.

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

## Profile, Account, Preferences Pages (added 2026-06-29)

**Backend** (`services/core-service/`):
- `schemas/user.py`: Added `ChangePasswordPayload { current_password: str, new_password: str = Field(min_length=8) }` (uses `Field` from pydantic).
- `services/user_service.py`: Added `change_password()` (verifies current password via `verify_password`, rejects if same via second `verify_password` check, hashes new password, commits, logs activity). Added `deactivate_me()` (blocks last active superuser, sets `is_active=False`, commits, logs activity). Both import `hash_password, verify_password` from `app.core.security`.
- `api/v1/me.py`: Rewrote to add `GET /me` → `UserProfileRead`, `PATCH /me` → `UserProfileRead`, `POST /me/change-password` → 204, `POST /me/deactivate` → 204. Existing `GET /me/permissions` kept in place (registered last to avoid path conflicts).

**Frontend** (`frontend/src/`):
- `services/api/settings-api.ts`: Added `getMyProfile()`, `updateMyProfile()`, `changePassword()`, `deactivateMyAccount()`.
- `app/settings/profile/page.tsx`: Full implementation — Avatar (initials in deterministic color), Personal Info form (full_name editable, email read-only, job_title, timezone select, locale select), Role Assignments section (reads `listRoleAssignments` + `listRoles`, displays role name + scope badge + scope name using platform context for org/workspace lookups). On save: PATCH /me → updates auth store via `useAuthStore.setState`. Form initialized from `profileQuery.data ?? currentUser` via `useEffect`.
- `app/settings/account/page.tsx`: Full implementation — Account Info card (email, name, status badge, member since, superuser badge), Change Password form (current + new + confirm, strength meter, client-side validation before API call), Danger Zone (deactivate button → inline modal with "DEACTIVATE" confirmation input). On deactivate success: logout().
- `app/settings/preferences/page.tsx`: Replaced placeholder with theme toggle (Light/Dark/System via `next-themes`), notification toggles (in-app enabled/disabled via localStorage, email + digest as coming-soon disabled controls), language card linking to profile page.

**Key patterns**:
- Auth store update after profile save: `useAuthStore.setState((state) => ({ ...state, currentUser: updatedUser }))` — direct state mutation without a dedicated action.
- Password strength: score-based (length + uppercase + digits + special chars), 5 levels → 4 labels (Weak/Fair/Good/Strong).
- Avatar color: deterministic from `(name || email).charCodeAt(0) + charCodeAt(1)` mod 8 colors.
- Preferences persist to localStorage under key `asthra-notification-prefs`.
- Deactivation guard: backend checks `active_superuser_count ≤ 1` for superusers, returns 400 with clear message.

## Platform-Led Organization Onboarding (added 2026-06-28)

**Backend**:
- New schema: `PlatformOnboardCreate { name, description, owner_user_id }` in `schemas/organization.py`
- `OrganizationRead` gains `owner_name: str | None = None` (populated by service, defaults to None for ORM compat)
- New endpoint: `POST /organizations/platform-onboard` → `OrganizationService.platform_onboard()`
- `platform_onboard()`: requires `settings.organization.create` at platform scope, validates owner exists + active, creates org with `created_by_id=current_user`, adds owner as `OrganizationMember(member_role="owner")` + `RoleAssignment(organization_owner)`, sends notification to owner, logs activity
- `list()` enriched via `_attach_owner_names()`: single batch query joining `RoleAssignment + User + Role` filtered by `scope_type="organization"`, `role.key="organization_owner"`, `status="active"`. Sets `org.owner_name` attribute on each SQLAlchemy model instance (Pydantic `from_attributes` picks it up)

**Frontend**:
- `types/core.ts`: added `owner_name?: string | null` to `Organization`
- `settings-api.ts`: added `platformOnboardOrganization()` → `POST /organizations/platform-onboard`
- `OrganizationsView` (settings-admin-views.tsx):
  - `canPlatformOnboard = currentUser.is_superuser || roles.some(r => platform_owner/platform_admin)`
  - "Onboard Organization" `<Button variant="outline">` shown when `canPlatformOnboard`, separate from existing "Create Organization"
  - Users loaded via lazy query (enabled only when onboardOpen + canPlatformOnboard)
  - Onboard modal: name + description + `SettingsMemberSelect` for owner (required), info note, FormActions
  - `platformOnboardMutation.onSuccess(org, variables)`: reads `variables.owner_user_id` to get owner name for toast
  - Org table: added "Owner" column showing `owner_name` or `"No owner assigned"` in muted text

**Key distinction**: `POST /onboard` is for self-serve (authenticated user creates their own org, no permission check). `POST /platform-onboard` is for platform admins creating orgs for others (requires `settings.organization.create` at platform scope, takes `owner_user_id`).

## Invite Modal Role Filtering (fixed 2026-06-28)

`MembersView` in `settings-admin-views.tsx` now uses `groupedInviteModalRoles` in the invite dialog role dropdown:
- **Global directory context** (`isGlobalDirectory = true`): only platform-scope roles visible (Platform Owner, Platform Admin, Platform Support)
- **Org/workspace context** (`organizationId` or `workspaceId` provided): platform-scope roles completely excluded, only org/workspace/project/team/functional roles shown
- Computed as an IIFE replacing the old `groupedAllRoles` which showed all roles without scope filtering
- "Change role" dialog (already used `groupedInviteRoles`) was already correct — not changed

## Onboarding Skip + Restricted Shell (added 2026-06-28)

`OnboardingGate` now accepts `onSkip?: () => void`. The "Skip for now" text link only renders when the prop is provided.

Shell skip state is in `asthra-shell.tsx` (`skippedOnboarding: useState<boolean>(false)`). When skipped:
- `isSkippedUser = needsOnboarding && skippedOnboarding` (true when user still has no org but skipped)
- `useEffect` watches `isSkippedUser + pathname` — redirects to `/` if path not in `["/", "/settings", "/settings/profile", "/settings/preferences", "/settings/notifications", "/settings/account"]`
- Sidebar receives `skippedUser={isSkippedUser}` → `SidebarNav` filters items to only `href === "/"` or `href === "/settings"`
- After org is created, `needsOnboarding` becomes false, `isSkippedUser` becomes false, all restrictions lifted automatically

## Motivational Home for No-Org Users (added 2026-06-28)

`page.tsx` detects `isNoOrgUser = organizations.length === 0 && !currentUser?.is_superuser`. When true, renders an early-return motivational layout:
- Header: "You're one step away from unlocking everything"
- 4 benefit cards: Manage Work (Briefcase), Document Everything (FileText), Discover Ideas (Lightbulb), Collaborate (Users)
- Primary CTA: "Create Your Organization" → opens `CreateOrgDialog`
- Secondary note with links to Profile and Preferences
- `CreateOrgDialog` (new export from `platform-setup-guide.tsx`) is a modal wrapper around the shared `OrgCreateForm` function component. On success, invalidates `organizations.all` + `permissions.all`.
- `OrgCreateForm` is an internal function component (not exported) that powers both `OnboardingGate` and `CreateOrgDialog`.

## Contextual Help Modal (upgraded to stop-motion explainer 2026-06-28)

- `frontend/src/lib/help-registry.ts`: `HelpStep = { label: string; icon?: string }`. `HelpContent.steps` is `HelpStep[]`. All 17 routes enriched with emoji icons. `matchHelpContent(pathname)` unchanged.
- `frontend/src/components/platform/contextual-help.tsx`: Stop-motion explainer animation. State: `headerVisible`, `visibleSteps`, `arrowsVisible: boolean[]`, `ctaVisible`.
- **Animation sequence** (per step): base delay = `700 + index * 850ms`. Arrow `index-1` revealed at `base` (200ms CSS width transition). Card `index` revealed at `base + 200ms` (300ms CSS transition: opacity + translateX + scale). CTA/footer fades in 300ms after last step. Title/description fade in on open (300ms/200ms + 150ms stagger).
- `AnimatedArrow`: `overflow-hidden` container transitions `width: 0 → 32px` + `opacity: 0 → 1`. Contains `div.h-px.flex-1` line + `→` arrowhead.
- `StepCard`: Active card = `bg-primary text-primary-foreground scale(1.05) opacity-1`. Past cards = `bg-muted text-muted-foreground opacity-0.65`. Hidden card = `opacity-0 translateX(1rem)`. Icon (emoji) shown at text-base, fallback is numbered circle.
- Modal width upgraded from `max-w-sm` → `max-w-xl` to fit 5-step chain horizontally.
- Steps use `flex flex-wrap gap-y-3` — wraps naturally if too wide, arrows still animate.
- All state resets on close; reopening restarts animation from beginning.
- Routes with no steps (e.g. `/`): `ctaVisible` set immediately, "Got it" button visible from open.
- `asthra-shell.tsx`: `HelpCircle` button wires to `helpOpen` state; modal rendered at end of shell JSX.

## Self-Serve Onboarding Gate (added 2026-06-28)

New users with no organization membership are blocked from the main app and shown a full-screen onboarding screen to create their first organization.

**Backend** (`POST /organizations/onboard`):
- Authentication-only (no permission check required)
- Checks that user has no active `role_assignments` with `scope_type in [organization, workspace, project, team]` — returns 400 if they do
- Creates org via `create_with_owner()` (which also creates `OrganizationMember` and activity log)
- Creates `RoleAssignment` for `organization_owner` role at the new org scope
- Creates welcome `Notification`
- Publishes `core.organization.created` event with `via: "onboarding"`

**Frontend gate logic** (`asthra-shell.tsx`):
```ts
const hasPlatformRole = (permissions?.roles?.length ?? 0) > 0;
const needsOnboarding = !isPublicPath && !contextLoading && !currentUser?.is_superuser && !hasPlatformRole && organizations.length === 0;
```
- Superusers bypass (is_superuser check)
- Platform owners/admins bypass (hasPlatformRole check — permissions resolved at platform scope)
- Org/workspace members bypass (organizations.length > 0)
- Gate only shown after context queries resolve (contextLoading guard prevents false positives during initial fetch)

**`OnboardingGate` component** (`platform-setup-guide.tsx`):
- Full-screen centered layout, Asthra logo, welcome heading
- Form: org name (required) + description (optional)
- Calls `settingsApi.onboardOrganization()` → `POST /organizations/onboard`
- On success: invalidates `queryKeys.organizations.all` and `queryKeys.permissions.all`
- After invalidation, `organizations` refetches and becomes non-empty → gate check fails → normal shell renders

## RBAC Architecture

- Two role tables: `UserRole` (unscoped, no audit, kept but fully retired) and `RoleAssignment` (scoped, with status/audit, sole source of truth).
- **Phase B complete (2026-06-26)**: `role_assignments` is the **exclusive** source of truth. Nothing writes to `user_roles`. Nothing reads from `user_roles`. `_resolve_roles()` reads only from `role_assignments` + legacy membership table role fields (OrganizationMember, WorkspaceMember, etc.).
- `user_roles` table kept in schema but no code writes/reads it. Production DB would need a migration to add `nullable=True` on `organization_id` in `invitations` table.
- `platform_member` role **removed** from `ASTHRA_ROLE_TEMPLATES` (2026-06-27). Deactivated in DB on next `ensure_role_catalog()` call. No replacement platform role needed — onboarding uses "authenticated, no org" state instead.
- `organization_member` role **added** to `ASTHRA_ROLE_TEMPLATES` (2026-06-27) — scope: organization, minimal perms: settings.profile.view, settings.notifications.view, settings.preferences.view, settings.organization.view. Sits below Organization Auditor in hierarchy.
- 6 functional roles (product_owner, scrum_master, engineering_manager, release_manager, incident_commander, knowledge_manager) **deactivated** (2026-06-27). `is_active: False` added to their `ASTHRA_ROLE_TEMPLATES` entries. `ensure_role_catalog()` enforces deactivation in DB on every startup. Roles are NOT deleted — they can be reactivated when Labels system ships in Phase B.
- Role permission editing available (2026-06-27) for Superuser and Platform Owner: `_can_manage_role_permissions()` bypasses the `is_editable=False` guard in `link_permission()` / `unlink_permission()`, except the Superuser role itself is always locked. Platform Admin can only edit non-system roles (existing `is_editable` check applies).
- `POST /roles/{role_id}/permissions/{permission_id}` endpoint added — path-based permission assignment, calls `assign_permission_by_id()` → `link_permission()`.
- **Role-permission sync is additive-only (2026-06-28)**: `_sync_role_template_permissions()` no longer deletes any existing `RolePermission` rows. It only adds permissions that are in template patterns but missing from the DB. Manual permission assignments persist permanently. Manual permission removals also persist (sync never re-adds what an admin removed).
- **`ensure_role_catalog()` call frequency reduced (2026-06-28)**: `list()`, `list_templates()` in `role_service.py`, and `/me/permissions` resolution in `access_control_service.py` now call `ensure_role_catalog(sync_permissions=False)` instead of the full `sync_permissions=True`. The expensive `ensure_permission_catalog()` / `sync_registry_permissions()` call is no longer triggered on every API request.
- **Admin sync trigger (2026-06-28)**: `POST /permission-registry/sync` (admin "Sync Permissions" button) now calls `RoleService(db).ensure_role_catalog(sync_permissions=False)` after syncing the permission catalog, so newly generated permissions are immediately seeded onto roles matching template patterns.
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

## Settings Action Button Visibility

Updated 2026-06-27. `MemberDetailView` in `settings-admin-views.tsx` now guards role management buttons:
- `canManageRoles = currentPermissions.can("settings.role.manage")`
- "Assign Role" button + org/workspace scope selectors: hidden when `!canManageRoles` (entire `actions` prop becomes `undefined`)
- "Remove" button per role row: hidden when `!canManageRoles`

`MembersView` was already guarded:
- Invite Member: `PermissionAction` with `settings.member.invite`
- Change Role: `PermissionButton` with `settings.role.manage`
- Remove Member: `canRemoveMembers = permissions.can("settings.member.remove")`
- Resend/Cancel Invite: `PermissionButton` with respective action keys

## Permission Transparency (added 2026-06-29)

Users who hit an "Access Restricted" state now see WHY and can request access with one click.

**Backend**:
- `notification_service.py`: Added `send_access_request(page, message, current_user)` → creates `type="access_request"` notification to the appropriate admin. `_find_admin_for_user()` resolves admin via 3-priority chain: org admin/owner in user's orgs → platform admin/owner → any active superuser.
- `schemas/notification.py`: Added `AccessRequestCreate { page: str, message: str | None }`.
- `api/v1/notifications.py`: Added `POST /notifications/access-request` endpoint (before `GET ""` to avoid route collision).

**Frontend**:
- `app/settings/layout.tsx`: Exported `RequestAccessButton` component — self-contained modal with page label, optional message textarea, Cancel/Send buttons. On success shows confirmation. Uses `settingsApi.sendAccessRequest()`.
- `app/settings/members/page.tsx` and `app/settings/members/[id]/page.tsx`: Updated restricted state `action` prop to `<RequestAccessButton page="/settings/members" />`.
- `app/settings/layout.tsx` restricted state: `action={<RequestAccessButton page={pathname} />}`.

**Notification routing**: `entity_type="user_profile"` + `entity_id=str(current_user.id)` → admin clicking the notification navigates to `/settings/members/{user_id}`.

## Invitation Accept/Decline from Notification Center (added 2026-06-29)

**Backend**:
- `invitation_service.py`: Changed `type="invitation.created"` → `type="invitation.pending"` for invitee notifications. Added `accept_in_app(invitation_id, current_user)` — same as `accept()` but skips email token check (user already authenticated; email match still verified).
- `api/v1/invitations.py`: Added `POST /{invitation_id}/accept-in-app` endpoint.

**Frontend** (`notification-center.tsx`):
- Added `entity_id: item.entity_id` to coreNotification map (accessed via `"entity_id" in item` TypeScript guard).
- Added `acceptInvitationMutation` → `POST /invitations/{id}/accept-in-app`. On success: invalidates `["core", "notifications"]`, `["members-page"]`, `["organizations"]`, `["permissions.all"]`; shows success toast; closes panel.
- Added `declineInvitationMutation` → calls existing `revokeInvitation`. Shows decline toast.
- Type check: `item.type === "invitation.pending" || item.type === "invitation.created"` (backward compat for existing DB records).

## Checklist Invite Auto-Open (added 2026-06-29)

**`org-setup-checklist.tsx`**: Invite item href changed to `/settings/members?action=invite&orgId={orgId}`.

**`settings-admin-views.tsx` (MembersView)**:
- `useSearchParams` from `next/navigation` added.
- `useEffect` on mount: if `?action=invite` → `setInviteOpen(true)`. If `?orgId=N` → `setInviteOrgId(N)`.

## Notification Center

`frontend/src/components/platform/notification-center.tsx` — updated 2026-06-26, 2026-06-29.

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

## Organization & Workspace Settings Pages (added 2026-06-29)

Extended settings infrastructure to support org + workspace detail configuration.

**Backend (`services/core-service/`)**:
- `schemas/settings.py`: Extended `OrganizationSettingsRead/Update` with domain, website_url, industry, logo_url, primary_color, locale, date_format. Extended `WorkspaceSettingsRead/Update` with visibility, locale, enabled_modules (list[str]).
- `services/settings_service.py`: Updated `DEFAULT_ORGANIZATION_SETTINGS` and `DEFAULT_WORKSPACE_SETTINGS` dicts to include all new fields. JSON column persists/reads new fields transparently — no DB migration needed.

**Frontend (`frontend/src/`)**:
- `services/api/settings-api.ts`: Added `OrgSettingsRecord` and `WorkspaceSettingsRecord` types. Added `getOrganizationSettings()`, `updateOrganizationSettings()`, `getWorkspaceSettings()`, `updateWorkspaceSettings()` API methods.
- `app/settings/organizations/[id]/page.tsx`: Full client component (uses `useParams`, no server wrapper). Tabs navigation (Overview/Members/Workspaces/Roles/Permissions) built inline with `Link`. Sections: Overview card (slug, status, workspace count, domain, website, industry), General (name/description → PATCH /organizations/{id}), Identity & Contact (domain/website/industry), Branding (logo URL + color picker), Localization (timezone/locale/date format) — settings sections → PATCH /organizations/{id}/settings. Danger Zone: deactivate with inline confirm. Read-only when not authorized.
- `app/settings/workspace/page.tsx`: Client component using `useWorkspaceStore` for selected workspace. Empty state if none selected. Sections: General (name/description), Access & Localization (visibility/timezone/locale), Module Visibility (7 toggleable modules: flow/docs/discover/desk/pulse/collab/automation). Danger Zone: archive. Two save buttons — one per form (general vs settings).

**Authorization**: `isAuthorized` computed from `useSettingsAuthority().authorityLevel` — superuser/platform/org authority grants edit; workspace auth grants edit for the specific workspace. Backend enforces actual permissions.

## API Key Management (added 2026-06-29)

`frontend/src/app/settings/api-keys/page.tsx` — full implementation (replaced placeholder re-export).

**Backend** (all pre-existing, nothing changed):
- `POST /api-keys` → creates key, returns raw key once in `APIKeyCreateResponse.api_key`. Key format: `ak_{token_urlsafe(32)}`, prefix = first 12 chars, stored as SHA256 hash.
- `GET /api-keys` → list user's own keys (never returns raw key). Filters by `user_id` via repo.
- `GET /api-keys/{id}` → single key detail.
- `PATCH /api-keys/{id}` → update name only (name strip enforced in service).
- `DELETE /api-keys/{id}` → hard delete.
- `POST /api-keys/{id}/revoke` → sets `is_active=False`, logs `api_key.revoked`.
- Logs: `api_key.created`, `api_key.updated`, `api_key.revoked`, `api_key.deleted`.

**Frontend**:
- `settings-api.ts`: Added `expires_at?: string | null` to `createApiKey` payload.
- `api-keys/page.tsx`: Full self-contained implementation. Scopes: read/write/admin. Expiry: 30d/90d/1yr/Never (computed as ISO datetime on frontend). Status: Active (green)/Expired (amber)/Revoked (rose) computed from `is_active` + `expires_at`. Table: Name, Prefix (with `…` suffix), Scope, Created, Expires (relative with tooltip), Last Used, Status, Actions. Key reveal modal: raw key shown once after create, copy-to-clipboard button, "I have saved" checkbox, close disabled until copied. Revoke: confirmation dialog with destructive button.

**Key detail**: Raw key is only ever in `APIKeyCreateResponse.api_key` — subsequent `APIKeyRead` responses never include it. Frontend stores revealed key in React state (`revealedKey`) and clears on modal close.

## Audit Log Consistency (added 2026-06-29)

All Core service actions now emit structured audit logs via `ActivityService.log_activity()`. Every log includes: `actor_user_id`, `action`, `entity_type`, `entity_id`, `organization_id` (where applicable), `workspace_id` (where applicable), and a human-readable `description` with actor name.

**Action naming convention**: `{entity}.{verb}` — e.g. `organization.created`, `member.invited`, `role.assigned`.

**Services updated**:
- `organization_service.py` — `create`, `onboard`, `platform_onboard`, `update` (archived/reactivated/updated), `delete`. Note: `create()` was missing `self.db.commit()` — fixed.
- `workspace_service.py` — `create`, `update` (archived/restored/updated), `delete`.
- `project_service.py` — `create`, `update` (archived/restored/updated), `delete`. Uses `project.workspace.organization_id` for org scope.
- `team_service.py` — `create`, `update`, `delete`, `add_member` (`member.added`), `remove_member` (`member.removed`). Uses `team.workspace.organization_id`.
- `invitation_service.py` — Existing logs renamed: `invitation.*` → `member.*` (member.invited, member.invitation_accepted, member.invitation_cancelled, member.invitation_resent). Descriptions improved to include actor names.
- `role_service.py` — Added: `role.updated`, `role.deleted`, `role.assigned` (assign_user_role), `permission.assigned` (link_permission), `permission.removed` (unlink_permission). `assign_user_role` uses `self.db.flush()` before logging to ensure assignment.id is populated.
- `user_service.py` — `update_me` description improved to include actor name + changed field names.

**Frontend (Audit Logs Settings Page)**:
- `settings-api.ts`: Added `ActivityLogRecord` type + `listActivityLogs()` method → `GET /api/core/api/v1/activity` with query params.
- `app/settings/audit-logs/page.tsx`: Full implementation. Filters by action (predefined dropdown). Table: Timestamp (relative, absolute on hover), Actor (resolved from users list), Action (color badge by entity prefix), Description, Scope. Pagination: 25 per page, prev/next buttons. Access: `can("guard.audit.view")` OR org/platform authority. Scope: global for superuser/platform, org-scoped otherwise. Uses `SettingsLayout` + `SettingsSectionHeader`.
