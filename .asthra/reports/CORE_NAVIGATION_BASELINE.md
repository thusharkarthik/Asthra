# Core Navigation Baseline

Date: 2026-08-12

## Purpose

This report is the Step 1 baseline for Asthra sidebar/navigation behavior before rebuilding Navigation Registry and future role-based navigation customization. It documents what exists today and the rules future work must preserve.

This audit is documentation-only. It does not change runtime sidebar behavior, God Mode, RBAC, bottom bar context, or navigation customization.

## 1. Current Sidebar Source Order

The live sidebar is rendered by `frontend/src/components/navigation/sidebar-nav.tsx`, mounted from `frontend/src/layouts/asthra-shell.tsx` through `PermissionAwareSidebar`.

Current source order in `SidebarNav`:

1. Core Navigation Registry from Unified Platform Context:
   - `usePlatformContext().navigation`
   - Converted by `buildNavSectionsFromNavigation(navigation, effectiveMode)` in `frontend/src/lib/module-nav-registry.ts`
   - Source is `GET /api/v1/context/platform` field `navigation`
2. Module Registry compatibility fallback:
   - `usePlatformContext().availableModules`
   - Converted by `buildNavSections(availableModules, effectiveMode)` in `frontend/src/lib/module-nav-registry.ts`
   - Source is `GET /api/v1/context/platform` field `modules`
3. Static fallback navigation:
   - `navSectionsForMode(effectiveMode)` in `frontend/src/lib/navigation-mode.ts`
   - Used when resolved navigation and module-derived navigation are empty or unavailable

The fallback chain is explicit in code and is the current behavior to preserve.

## 2. Current Platform Mode Items

Platform Mode is active for Superuser, platform-scoped roles, or auto-detected non-work/non-org routes.

Primary Core Navigation Registry platform items in `services/core-service/app/services/navigation_registry.py`:

| Item | Route | Group | Permissions / visibility |
|---|---|---|---|
| Home | `/` | Platform | Always visible, not customizable |
| Organizations | `/settings/organizations` | Platform | Any of `settings.organization.view`, `settings.organization.manage` |
| Members | `/settings/members` | Platform | Any of `settings.member.view`, `settings.member.manage` |
| Access Control | `/settings/access-control` | Platform | Any of `settings.access_control.view`, `settings.role.view`, `settings.permission.view` |
| Audit Logs | `/settings/audit-logs` | Platform | `guard.audit.view` |
| API Keys | `/settings/api-keys` | Platform | No permission requirement today |
| Platform Health | `/platform/health` | Platform | Any of `settings.organization.view`, `settings.access_control.view` |
| Settings | `/settings` | Admin | No permission requirement today |

Static fallback platform items in `frontend/src/lib/navigation-mode.ts` are similar, with these current differences:

- Organizations requires `settings.organization.view` only.
- Members requires `settings.member.view` only.
- Platform Health requires `settings.organization.view` only.
- API Keys and Settings are ungated.

## 3. Current Organization Mode Items

Organization Mode is selected for organization-scoped roles, `/settings/organizations/:id` routes, or Superuser manual/auto mode behavior.

Primary Core Navigation Registry organization items:

| Item | Route | Group | Permissions / visibility |
|---|---|---|---|
| Home | `/` | Organization | Always visible, not customizable |
| Workspaces | `/settings/workspaces` | Organization | Any of `settings.workspace.view`, `settings.workspace.manage`, `settings.workspace.create` |
| Projects | `/settings/projects` | Organization | Any of `settings.project.view`, `settings.project.manage`, `settings.project.create` |
| Members | `/settings/members` | Organization | Any of `settings.member.view`, `settings.member.manage`, `settings.member.invite` |
| Teams | `/settings/teams` | Organization | Any of `settings.team.view`, `settings.team.manage`, `settings.team.create` |
| Roles | `/settings/roles` | Organization | Any of `settings.role.view`, `settings.role.manage`, `settings.access_control.view` |
| Org Settings | `/settings/organizations` | Settings | Any of `settings.organization.view`, `settings.organization.manage`, `settings.organization.edit` |
| Preferences | `/settings/preferences` | Settings | No permission requirement today |
| Profile | `/settings/profile` | Settings | No permission requirement today |

Static fallback organization items omit `Projects` and use narrower single permission checks for Workspaces, Members, Teams, Roles, and Org Settings. Preferences and Profile remain ungated.

## 4. Current Work Mode Items

Work Mode is selected for work/module routes such as `/flow`, `/docs`, `/discover`, `/desk`, `/pulse`, `/automation`, `/dev`, `/connect`, `/insights`, `/collab`, `/media`, and `/guard`, or for non-platform/non-org role modes.

Primary Core Navigation Registry work items:

| Item | Route | Group | Feature flag | Permissions / visibility |
|---|---|---|---|---|
| Home | `/` | Work | None | Always visible, not customizable |
| Flow | `/flow` | Work | `module.flow.enabled` | Any of `flow.work_item.view`, `flow.board.view` |
| Discover | `/discover` | Work | `module.discover.enabled` | `discover.idea.view` |
| Docs | `/docs` | Work | `module.docs.enabled` | Any of `docs.page.view`, `docs.space.view` |
| Collab | `/collab` | Work | `module.collab.enabled` | `collab.thread.view` |
| Desk | `/desk` | Operations | `module.desk.enabled` | `desk.ticket.view` |
| Pulse | `/pulse` | Operations | `module.pulse.enabled` | `pulse.incident.view` |
| Automation | `/automation` | Operations | `module.automation.enabled` | `automation.rule.view` |
| Dev | `/dev` | Engineering | None | `dev.release.view` |
| Connect | `/connect` | Engineering | `module.connect.enabled` | `connect.integration.view` |
| Insights | `/insights` | Intelligence | `module.insights.enabled` | `insights.report.view` |
| Memory | `/memory` | Intelligence | `module.memory.enabled` | No permission requirement today |
| Assistant | `/assistant` | Intelligence | `module.assistant.enabled` | No permission requirement today |
| Settings | `/settings` | Admin | None | No permission requirement today |

Static fallback work items match the general grouping but use single `permission` values and have Memory, Assistant, Home, and Settings ungated.

## 5. Current Settings / About / Profile / Preferences Behavior

Settings-related behavior is currently split between sidebar navigation and Settings pages:

- Sidebar Settings item is broad/ungated in Platform Mode and Work Mode fallback, and exists as `/settings` in Core Navigation Registry.
- Organization Mode has `Preferences` and `Profile` ungated as personal settings links.
- `/settings` page behavior is controlled by `frontend/src/app/settings/page.tsx` and `frontend/src/app/settings/layout.tsx`, not by sidebar customization.
- Member-level Settings users see personal cards only: Profile, Preferences, Notifications, Account, and About Asthra.
- Admin-level Settings users see `SettingsHomeView`, which includes About Asthra as a card and link.
- `/about` exists as an authenticated product definition page but is intentionally not wired into Core Navigation Registry or static sidebar fallback in the current baseline.

## 6. Current God Mode Behavior

God Mode is owned by the frontend simulation system, not by Navigation Registry customization.

Current behavior:

- `SidebarNav` shows the God Mode entry only when the user is Superuser or has a platform owner/admin role key in `permissions.roles`.
- The God Mode activation modal fetches roles only when opened and when the user can simulate.
- During simulation, `AsthraShell` sets `effectiveNavigationMode` to `simulatedMode` when present.
- During God Mode edit mode, `SidebarNav.shouldShowItem()` returns `true` for permission-gated items so overlays can display them.
- `PermissionGate` wraps sidebar items with a single `permission` in edit mode and shows visual add/remove controls.
- Items with `permissions[]` are checked through `can(...)` for visibility, but only the first `permission` field is wrapped by `PermissionGate` in sidebar edit mode. God Mode automatic tracking still observes `can()` calls.
- `GodModeSchemaPanel` or `GodModeAutoOverlay` are mounted from `AsthraShell` based on route schema availability.
- God Mode replaces bottom-bar scope selectors with static mock scope labels when ready.

Future navigation customization must not remove, hide, or bypass these God Mode affordances.

## 7. Current Bottom Bar Behavior

The bottom dock is rendered in `frontend/src/layouts/asthra-shell.tsx` and is separate from sidebar item selection.

Current behavior:

- Left side shows `AsthraLogo` and the sidebar collapse/expand button.
- Center area renders organization/workspace/project selectors based on `effectiveNavigationMode`:
  - Platform Mode: no org/workspace/project selectors; shows `Platform Mode` text.
  - Organization Mode: shows organization selector only.
  - Work Mode: shows organization, workspace, and project selectors.
- Organization selector uses `OrganizationSwitcher`, reading organizations and `currentScope.organizationId` from `usePlatformContext()`.
- Workspace selector uses `WorkspaceSwitcher`, reading visible workspaces and `currentScope.workspaceId`.
- Project selector uses `ProjectSwitcher`, reading visible projects and `currentScope.projectId`.
- During God Mode ready state, selectors are replaced with static mock labels for organization/workspace/project.
- Search bar remains in the bottom dock center.
- Right side shows notifications, theme toggle, Help, current user name/email, user menu, and logout.
- The current user display uses `currentUser.full_name ?? currentUser.email` and `currentUser.email` from `usePlatformContext()`.

Bottom bar identity and scope display must never depend on role navigation configuration.

## 8. Current Permission Gates Used By Sidebar

Sidebar item visibility uses backend permission codes through `usePlatformContext().can(permissionCode)`.

Current rules in `SidebarNav.shouldShowItem()`:

- If skipped onboarding user, only `/` and `/settings` are allowed.
- If an item has `permissions[]`, any permission is enough.
- If an item has `permission`, that single permission is required.
- If permission-gated and edit mode is active, item is shown so God Mode overlays can represent it.
- If permissions are loading, permission-gated items remain visible instead of flashing denied.
- If no permissions are required, item is visible.

The sidebar does not authorize by role names for normal item visibility. Role keys are only used for:

- Choosing navigation mode in `detectNavigationMode(...)`.
- Determining whether the God Mode simulator is available to platform owner/admin roles.

Backend route/page guards remain authoritative.

## 9. Current Module Registry Involvement

Module Registry exists and remains the compatibility fallback after Core Navigation Registry.

Backend:

- `services/core-service/app/services/module_registry.py` defines default module metadata.
- `ModuleRegistryService.resolve_modules_for_context(...)` filters active modules by navigation mode, feature flags, and any required backend permission codes.
- Superuser bypasses required permission filtering inside module resolution.

Frontend:

- `usePlatformContext()` exposes `availableModules` from `/context/platform` `modules`.
- `buildNavSections(availableModules, effectiveMode)` maps Module Registry items into `ModeNavSection[]`.
- Module-derived nav item permissions come from `required_permissions` and are checked again in `SidebarNav.shouldShowItem()`.

Module Registry does not override backend permissions or grant access.

## 10. Current Navigation Registry Status

Navigation Registry v1 exists.

Backend files:

- `services/core-service/app/services/navigation_registry.py`
- `services/core-service/app/schemas/navigation.py`
- `services/core-service/app/api/v1/navigation.py`

Backend API:

- `GET /api/v1/navigation` returns resolved navigation for a user/scope.
- `GET /api/v1/navigation/registry` returns the registry catalog and requires `settings.navigation.view`.
- `GET /api/v1/context/platform` includes a `navigation` field of shape:
  - `version: number`
  - `modes: Record<string, { items: NavigationItemRead[] }>`

Permissions:

- `settings.navigation.view` exists in the permission registry.
- `settings.navigation.manage` exists in the permission registry.

Current dependency behavior:

- Navigation Registry resolver uses `AccessControlService.get_user_permissions(...)`.
- It uses `FeatureFlagService.get_effective_feature_flags(...)`.
- It uses `ModuleRegistryService.resolve_modules_for_context(...)` to confirm module-key availability.
- Navigation item visibility is filtered by `default_visible`, required feature flag, visible module key, and required any-of permission codes.

`core.navigation_config.enabled` now exists and defaults to false. Role Navigation Config foundation exists as backend catalog/config metadata, but it is not applied to live `/context/platform` navigation resolution or the frontend sidebar.

## 11. Current Fallback Behavior

Current fallback behavior is explicit and must be preserved:

1. If `navigation.modes[effectiveMode].items` produces sections, the sidebar uses Core Navigation Registry data.
2. If that is empty, but `availableModules` can produce sections for the mode, the sidebar uses Module Registry-derived navigation.
3. If that is also empty, the sidebar uses static fallback constants from `frontend/src/lib/navigation-mode.ts`.
4. Static fallback keeps the shell usable while context is loading, when backend fields are missing, or when older APIs are in use.
5. Permission loading does not render immediate denied state for permission-gated sidebar links.
6. Skipped onboarding users are restricted to `/` and `/settings` in sidebar visibility.

## 12. Known Risks

- Navigation Registry is already the primary sidebar source, so future customization work can accidentally replace the fallback chain if not carefully gated.
- Static fallback and Core Navigation Registry are not perfectly identical. For example, Organization Mode registry includes Projects, while static fallback does not.
- API Keys, Settings, Preferences, Profile, Memory, Assistant, Home, and some broad shell utilities are ungated today.
- Multi-permission sidebar items use any-of visibility. God Mode visual wrapping in the sidebar only wraps `item.permission`, while auto-tracking covers `can()` calls from `permissions[]` checks.
- Superuser mode switching and route auto-detection are intertwined. A customization layer must not override Superuser access to Platform/Admin navigation.
- Bottom bar scope selectors are not navigation items. Treating them as role navigation config would risk breaking work-module context.
- Role keys are still used for navigation mode detection and God Mode availability, even though runtime access uses permission codes.
- `/about` is reachable through Settings but is not currently a sidebar registry item.
- Role Navigation Config now has a feature-flagged live sidebar consumer. It is inactive by default because `core.navigation_config.enabled` defaults false; while false, the existing fallback baseline remains the active behavior and the sidebar does not fetch live role config.

## 13. Rules For Future Implementation

1. Existing sidebar behavior is the baseline.
2. Navigation Registry must be additive first.
3. If Navigation Registry is missing, invalid, empty, disabled, or fails, frontend must fall back to existing sidebar behavior.
4. Role Navigation Config must not apply to the real sidebar until feature flag `core.navigation_config.enabled` is enabled.
5. Superuser and God Mode must never lose platform/admin navigation because of missing role nav config.
6. Bottom bar current user/org/workspace/project display must never depend on role navigation config.
7. Navigation customization can hide, show, lock, reorder, or group nav items.
8. Navigation customization cannot grant access.
9. Backend permissions and route/page guards remain authoritative.
10. New modules/services should register nav items automatically, but real sidebar rendering must remain fallback-safe.

Additional implementation guidance:

- Preserve the current source chain: Core Navigation Registry -> Module Registry fallback -> static fallback.
- Preserve `SidebarNav.shouldShowItem()` semantics unless a dedicated QA pass updates them.
- Preserve God Mode edit-mode visibility for permission-gated nav items.
- Preserve Superuser manual mode override and route auto-detection behavior.
- Preserve skipped-onboarding restrictions.
- Preserve bottom dock layout and selector rules.
- Treat Navigation Registry and Role Navigation Config as UI/UX layers only, never authorization layers.

## 14. Step 2 Navigation Configuration Foundation (2026-08-13)

Step 2 added persistent backend foundation only. Live sidebar behavior remains unchanged.

Added backend foundation:

- Feature flag `core.navigation_config.enabled`, default `false`.
- Table/model `role_navigation_configs` with role ID, navigation mode, `nav_key`, visibility, order/label/group overrides, active flag, and timestamps.
- Visibility values: `default`, `hidden`, `show_when_allowed`, `show_locked_if_denied`.
- Permission-gated APIs:
  - `GET /api/v1/navigation/role-config?role_id=<id>&mode=<mode>` requires `settings.navigation.view`.
  - `PUT /api/v1/navigation/role-config` requires `settings.navigation.manage`.
  - `GET /api/v1/navigation/role-config/preview?role_id=<id>&mode=<mode>` requires `settings.navigation.view`.
- Preview metadata merges registry items with stored config, but preview is informational only.

Explicit non-changes:

- Role Navigation Config is not read by `NavigationRegistryService.resolve_navigation_for_context(...)`.
- `/api/v1/context/platform` navigation output is unchanged.
- Frontend sidebar source order is unchanged: Core Navigation Registry -> Module Registry fallback -> static fallback.
- `AsthraShell`, God Mode, and bottom bar behavior are unchanged.
- Role Navigation Config cannot grant access; backend permissions and route/page guards remain authoritative.

Future Step 3/4/5 work should build read-only UI/preview and QA before enabling any live consumer behind `core.navigation_config.enabled`.

## 15. Step 3 Navigation Settings Inspection UI (2026-08-13)

Step 3 added a frontend inspection surface only. Live sidebar behavior remains unchanged.

Added frontend inspection UI:

- Route `/settings/navigation`.
- Settings home card/link gated by `settings.navigation.view` or `settings.navigation.manage`.
- Typed frontend API methods for:
  - `GET /api/v1/navigation/registry`
  - `GET /api/v1/navigation/role-config?role_id=<id>&mode=<mode>`
  - `GET /api/v1/navigation/role-config/preview?role_id=<id>&mode=<mode>`
- Read-only Navigation page sections:
  - Status: Navigation Registry active, Role Navigation Config foundation active, live sidebar config disabled, `core.navigation_config.enabled` value.
  - Registry overview: item counts by mode/group, gated item count, customizable item count.
  - Registry item tables grouped by mode and group.
  - Role Config Preview: role selector, mode selector, stored config count, preview item count, preview visibility, label/group/order metadata.

Explicit non-changes:

- No live sidebar consumer was added.
- No `AsthraShell`, God Mode, bottom bar, or sidebar source-order changes were made.
- `core.navigation_config.enabled` remains disabled by default.
- Role Navigation Config remains metadata/preview only and cannot grant access.
- Editing/saving role navigation config from the frontend is deferred to Step 4.

Future Step 4 should add a safe editor workflow, still behind explicit warnings, before any live sidebar application is considered.

## 16. Step 4 Role Navigation Config Editor (2026-08-13)

Step 4 added a safe editor workflow to the existing Navigation settings page. Live sidebar behavior remains unchanged.

Added frontend editor workflow:

- `/settings/navigation` now supports role selection, mode selection, role search, saved config loading, preview loading, and per-item metadata editing.
- Visibility options are: `default`, `hidden`, `show_when_allowed`, and `show_locked_if_denied`.
- Optional order overrides can be saved per role/mode/nav item. Label/group overrides remain preserved as API fields but are not exposed as primary editing controls in this pass.
- Save writes to `PUT /api/v1/navigation/role-config` through typed frontend API methods.
- Reset mode to Default rewrites the selected mode's items back to default metadata. This is metadata only and does not remove backend permissions or registry items.
- Preview shows backend-computed role navigation metadata counts and item-level effective visibility/order.

Permission behavior:

- Page visibility remains gated by `settings.navigation.view` or `settings.navigation.manage`.
- Editing and saving require `settings.navigation.manage`. View-only users can inspect registry and preview metadata, but save controls are disabled.
- Role Navigation Config remains a UX metadata layer only. It cannot grant access; backend permissions and route/page guards remain authoritative.

Explicit non-changes:

- No live sidebar consumer was added.
- `AsthraShell`, SidebarNav live rendering, God Mode, bottom bar, and `/context/platform` resolved navigation behavior were not changed.
- `core.navigation_config.enabled` remains disabled by default.
- Existing sidebar behavior remains the fallback baseline.

Validation:

- `git diff --check` passed.
- `cd frontend && ./node_modules/.bin/tsc --noEmit` could not run because this migrated checkout is missing `frontend/node_modules/.bin/tsc`.

Future Step 5 should add a QA/static preview pass and only then consider an explicitly approved, feature-flagged live sidebar consumer.

## 17. Step 5 Sidebar Preview (2026-08-13)

Step 5 added a simulated sidebar preview to the existing Navigation settings page. Live sidebar behavior remains unchanged.

Added frontend preview workflow:

- `/settings/navigation` now includes a `Sidebar Preview` card for the selected role and navigation mode.
- The preview uses the existing backend role navigation config preview endpoint plus the current editor state, so unsaved changes are reflected locally and marked with an `Unsaved changes` badge.
- The preview fetches backend role permissions and backend permission records for the selected role to approximate role-level access for registry items.
- Preview states are shown as Allowed, Locked, or Hidden.
- Hidden items are counted and can be expanded for reason/details.
- Locked preview items render as disabled/restricted and never navigate.
- The panel clearly states that it is preview-only and that the live sidebar remains unchanged until a later explicitly approved step enables `core.navigation_config.enabled`.

Preview rules:

- `hidden` role config hides the item.
- Missing required feature flag/module availability hides the item.
- Missing required permissions hides default/show-when-allowed items.
- Missing required permissions show a locked preview item only when config is `show_locked_if_denied`.
- Items with no required permissions are allowed unless hidden by config, registry default, or feature availability.

Explicit non-changes:

- No live sidebar consumer was added.
- `AsthraShell`, SidebarNav live rendering, God Mode, bottom bar, and `/context/platform` resolved navigation behavior were not changed.
- `core.navigation_config.enabled` remains disabled by default.
- Navigation configuration remains a UX metadata layer and cannot grant access.

Validation:

- `git diff --check` passed.
- `cd frontend && ./node_modules/.bin/tsc --noEmit` could not run because this migrated checkout is missing `frontend/node_modules/.bin/tsc`.

Future Step 6 should add QA fixtures/certification for preview behavior, then consider an explicitly approved feature-flagged live consumer only after certification.


## 14. Step 5.5 Navigation QA Fixtures

Step 5.5 added certification fixtures before any live sidebar integration.

Files added/updated:

- `services/core-service/tests/test_navigation_config_certification.py`
- `frontend/src/lib/navigation-config-preview.ts`
- `frontend/src/lib/navigation-config-preview.test.ts`
- `.asthra/reports/CORE_NAVIGATION_CERTIFICATION.md`

Certified guardrails:

- `core.navigation_config.enabled` remains disabled by default.
- Role Navigation Config persists and previews metadata.
- Invalid role config inputs are rejected.
- Role config does not grant effective permissions.
- Live Navigation Registry resolver ignores role config.
- Settings preview computes allowed/locked/hidden states from backend permission codes, feature flags, registry defaults, and saved/editor config.

No live sidebar behavior, God Mode behavior, bottom bar behavior, or `/context/platform` navigation resolver behavior changed in this step.


## 15. Step 6 Feature-Flagged Live Consumer

Step 6 adds a live sidebar Role Navigation Config consumer behind `core.navigation_config.enabled`.

Runtime behavior:

- When `core.navigation_config.enabled=false`, the sidebar uses the existing baseline path unchanged and does not fetch live role navigation config.
- When `core.navigation_config.enabled=true`, `SidebarNav` attempts to identify one unambiguous effective role for the current navigation mode.
- If no single role can be selected, if the user is Superuser, if the app is in God Mode/simulation/edit mode, if config is missing/loading/erroring, or if config does not match current nav keys, the sidebar falls back to the existing baseline behavior.
- Matching config is applied item-by-item: `hidden` hides, `show_when_allowed` keeps existing permission behavior, `show_locked_if_denied` shows denied items as disabled locked items, and `default` keeps existing behavior.
- Locked items are buttons, not links, and do not navigate.

Backend read path:

- Existing admin endpoints remain gated by `settings.navigation.view` / `settings.navigation.manage`.
- New `GET /api/v1/navigation/my-role-config` is authenticated and returns config only when the requested role id is present in the current user's effective roles for the requested scope.

Unchanged areas:

- `AsthraShell` behavior is unchanged.
- God Mode behavior is unchanged.
- Bottom bar behavior is unchanged.
- `/context/platform` navigation resolver is unchanged.
- Module Registry and static fallback remain in the source chain.
- `core.navigation_config.enabled` still defaults false.

## 13. Step 7 Live Consumer Certification Notes

### Locked Candidate Preservation Fix

Manual lower-permission QA found that `show_locked_if_denied` could not show `organization.members` as locked when the current sidebar candidates came from already permission-filtered platform context navigation. The flag-enabled live path now merges in static fallback candidates only for nav keys explicitly configured as `show_locked_if_denied`, then the resolver applies permission evaluation.

This preserves the baseline rules:

- Flag false uses the original sections and skips `/navigation/my-role-config`.
- Denied items are not globally shown.
- `default` and `show_when_allowed` denied items remain hidden.
- Locked candidates are disabled buttons and do not navigate.


Step 7 is tests/docs certification only. It does not change sidebar rendering rules, God Mode, bottom bar, or the fallback chain. The certified live consumer rules are:

- `core.navigation_config.enabled=false` returns baseline sections unchanged and does not fetch `/navigation/my-role-config`.
- Missing, unmatched, ambiguous, or failed role config falls back unchanged.
- `hidden` hides a configured item even when permission is present.
- `show_locked_if_denied` shows a locked item only when the user lacks the item permission.
- If the user has permission, `show_locked_if_denied` remains clickable; this is expected.
- Role Navigation Config cannot grant clickable access for a denied item.
- Superuser and God Mode bypass live role config at the sidebar integration boundary.
- Bottom bar scope selectors and identity display are outside Role Navigation Config.
