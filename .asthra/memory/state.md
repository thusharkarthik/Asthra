# Platform State

Last updated: 2026-08-14 (Feature Flags certification)

## Phase

**Phase C Core — Enterprise Grade** — Policy Engine, Labels system, Global Search Registry (runtime), Organization Templates (UI), AI Context Registry (UI).




## Core Feature Flags Certification (added 2026-08-14)

**Purpose**: Core Feature Flags were certified as scope-level availability controls. They remain distinct from RBAC permissions, which continue to decide whether a user can use an enabled feature.

**Confirmed flow**:
- Default flags are seeded idempotently by `FeatureFlagService.ensure_default_flags()`.
- Effective flags resolve defaults plus platform and scoped overrides.
- Inactive and unknown flags fail closed.
- Override updates require `settings.feature_flags.manage` and bump context version.
- Unified Platform Context exposes `feature_flags` and `enabled_modules`.
- `/settings/feature-flags` consumes backend catalog/effective APIs and invalidates feature flag queries, platform context, and context version after toggles.

**Certification**:
- Added `services/core-service/tests/test_feature_flags_certification.py`.
- Created `.asthra/reports/CORE_FEATURE_FLAGS_CERTIFICATION.md`.
- `core.navigation_config.enabled` remains a system Core flag with default `false`; toggling it does not mutate role assignments or permission codes.

**Known gaps**: Workspace/project override precedence is implemented but not the main QA target for this certification; manual browser QA is still needed for the Settings Feature Flags page and Navigation page refresh path.

## Core Access Request Certification (added 2026-08-14)

**Purpose**: Request Access is now certified as a notification/workflow handoff for restricted Settings pages and locked navigation items. It does not grant access, assign roles, or mutate permission mappings.

**Current flow**:
- Frontend calls `settingsApi.sendAccessRequest(token, { page, message })`.
- Restricted Settings pages use `RequestAccessButton`.
- Locked navigation items reuse the same endpoint and include nav item, nav key, mode, role, and missing permissions inside the message body.
- Backend creates an `access_request` notification for an org admin/owner, platform admin/owner, or superuser fallback.

**Certification**:
- Added `services/core-service/tests/test_access_request_certification.py` covering auth required, valid org notification, platform fallback, no-recipient safe failure, no role/permission mutation, context preservation in notification text, and duplicate request behavior.
- Created `.asthra/reports/CORE_ACCESS_REQUEST_CERTIFICATION.md` with current-flow audit, test matrix, manual QA checklist, and known gaps.

**Known gaps**: No full approval workflow, no dedicated admin inbox, no dedupe/rate limit, no structured backend fields for scope/permission/nav metadata beyond `page` and `message`, and no workspace/project-specific recipient routing yet.

## Navigation Config Locked Access UX (added 2026-08-14)

**Purpose**: Step 8 improves the feature-flagged locked sidebar item experience. When `core.navigation_config.enabled` is true and a Role Navigation Config item resolves to `visible_locked`, the sidebar now shows a restricted affordance and opens an explanation modal on click instead of silently doing nothing.

**Behavior**:
- Locked items remain buttons, not links, and do not navigate.
- The explanation shows item label, route, mode, role, nav key, and missing permission codes when available.
- The modal reuses the existing Core notification access-request endpoint (`/notifications/access-request`) to send a real request with prefilled navigation context.
- Backend permissions remain authoritative; this UX grants no access.

**Safety**: Flag false remains the exact baseline, does not fetch live role config, and does not show locked UX. `AsthraShell`, God Mode, and bottom bar behavior remain unchanged.

## Navigation Config Locked Item Fix (added 2026-08-13)

**Issue**: Lower-permission Organization Member users did not see `organization.members` as locked when Role Navigation Config set Members to `show_locked_if_denied`. The item was absent before the live resolver ran because the primary sidebar sections from platform context were already permission-filtered.

**Fix**: When `core.navigation_config.enabled` is true and live role config is loaded, the sidebar now preserves static fallback candidates only for nav keys explicitly configured as `show_locked_if_denied`. The resolver then evaluates permissions and renders the item as locked if denied, clickable if allowed, or hidden for default/show-when-allowed.

**Safety**: Flag false remains exact baseline and does not fetch role config. The fix does not grant access, does not alter `AsthraShell`, God Mode, or bottom bar, and locked items still render as non-navigating disabled buttons.

## Navigation Config Live Consumer Certification (added 2026-08-13)

**Purpose**: Step 7 certifies the feature-flagged Role Navigation Config live consumer added in Step 6 before any richer locked/request-access UX. This pass adds tests and QA documentation only; live sidebar behavior is not expanded.

**Coverage**:
- Frontend resolver tests now explicitly cover flag-false identity, missing/unmatched config fallback, hidden behavior, locked-only-when-denied behavior, allowed `show_locked_if_denied` remaining clickable, default denied hiding, and no-grant behavior.
- Backend certification now covers `/navigation/my-role-config` for active-role access, unrelated role denial, scope mismatch denial, unauthenticated denial, admin endpoint gating, and no permission mutation.

**Manual QA recorded**: Org Owner with `hidden` hides Members when the flag is enabled. Org Owner with `show_locked_if_denied` keeps Members clickable because the permission is present. Lower-permission locked-state browser QA remains pending.

## Settings Feature Flags Admin UI (added 2026-08-13)

**Purpose**: Settings now includes `/settings/feature-flags`, a safe admin surface for inspecting existing Core feature flags and setting platform-scope overrides. This enables controlled QA for `core.navigation_config.enabled` without manual database edits.

**Frontend (`frontend/src/`)**:
- `app/settings/feature-flags/page.tsx`: New permission-gated Feature Flags settings page. Users with `settings.feature_flags.view` can inspect catalog/effective values; users with `settings.feature_flags.manage` can toggle platform overrides.
- `services/api/settings-api.ts`: Added Feature Flag catalog, effective flags, and override update client methods.
- `types/core.ts`: Added backend-shaped Feature Flag API types.
- `components/settings/settings-admin-views.tsx`: Settings home/navigation links now expose Feature Flags only to users with Feature Flag permissions.

**Design rule**: The UI does not change default flag seed values and does not wire feature flags into new runtime behavior. `core.navigation_config.enabled` remains default false; toggling it is an explicit admin QA action.

## About Asthra Product Definition Page (added 2026-08-12)

**Purpose**: The authenticated app now includes `/about`, an in-app product and vision page that explains what Asthra is, why it exists, what Core currently provides, how modules fit together, and which future phases are planned.

**Frontend (`frontend/src/`)**:
- `app/about/page.tsx`: New page covering Asthra positioning, disconnected-tool problem, differentiators, current Core foundation, module/service map, future phases, and principles.
- `app/settings/page.tsx`: Personal Settings now links to About Asthra.
- `components/settings/settings-admin-views.tsx`: Admin Settings home and Settings navigation now link to About Asthra.
- `lib/convention-help-registry.ts`: Help content added for `/about`.

**Design rule**: The About page is authenticated product context, not a public marketing redesign. Sidebar/navigation registry wiring is intentionally deferred so navigation ownership remains stable.



## Core Navigation Config Live Consumer (added 2026-08-13)

**Purpose**: Step 6 adds a feature-flagged live sidebar consumer for Role Navigation Config. When `core.navigation_config.enabled` is false, the sidebar remains on the existing baseline path. When true, the sidebar can apply saved role config item-by-item without granting access.

**Files**:
- `frontend/src/lib/navigation-config-live-resolver.ts`: Pure resolver for hidden, clickable, and locked sidebar item states.
- `frontend/src/lib/navigation-config-live-resolver.test.ts`: Resolver tests covering flag-off identity, missing config fallback, hidden, locked, show-when-allowed, no-grant behavior, and role selection ambiguity.
- `frontend/src/components/navigation/sidebar-nav.tsx`: Feature-flagged consumer. It does not fetch live config when the flag is false, skips config for Superuser and during God Mode/simulation, and falls back unchanged on missing/error/ambiguous config.
- `services/core-service/app/api/v1/navigation.py`: Added authenticated `GET /navigation/my-role-config` for a user's own effective role config. Existing admin registry/config endpoints remain permission-gated.

**Design rule**: Role Navigation Config can hide or lock navigation affordances only. It cannot make denied items clickable and cannot grant backend access. God Mode and bottom bar behavior remain outside navigation config.

## Core Navigation Config QA Fixtures (added 2026-08-13)

**Purpose**: Step 5.5 adds certification fixtures before any live sidebar integration. This keeps role navigation customization testable while preserving the current sidebar baseline.

**Files**:
- `services/core-service/tests/test_navigation_config_certification.py`: Backend certification around feature flag default, registry shape, config persistence/validation, preview metadata, no permission grant, and no live resolver effect.
- `frontend/src/lib/navigation-config-preview.ts`: Shared pure helper for simulated Settings -> Navigation preview state.
- `frontend/src/lib/navigation-config-preview.test.ts`: Frontend preview-rule tests for allowed, locked, hidden, feature-flagged, and counted states.
- `.asthra/reports/CORE_NAVIGATION_CERTIFICATION.md`: Go/no-go criteria for future Step 6 live sidebar integration.

**Design rule**: Role Navigation Config remains metadata-only. The live sidebar, God Mode, bottom bar, and `/context/platform` navigation resolver remain unchanged until a later feature-flagged integration step.

## Core Navigation Registry v1 (added 2026-07-15)

**Purpose**: Core now owns a code-defined Navigation Registry that describes where existing capabilities appear in the UI. Module Registry still defines what capabilities exist, Feature Flags define availability, and RBAC permissions define user access.

**Backend (`services/core-service/`)**:
- `services/navigation_registry.py`: Code-defined navigation item catalog plus resolver. Items carry mode, group, route, icon, order, optional module key, optional feature flag, and any-of permission requirements.
- `schemas/navigation.py`: Platform-context/API schemas for resolved navigation.
- `api/v1/navigation.py`: Added resolved navigation endpoint and admin registry endpoint.
- `api/v1/context.py`: Unified Platform Context now includes `navigation`.
- `services/permission_registry.py`: Added `settings.navigation.view` and `settings.navigation.manage` for future navigation registry/configuration management.

**Frontend (`frontend/src/`)**:
- Platform context types now accept `navigation`.
- `usePlatformContext()` exposes `navigation` with safe defaults.
- Sidebar priority is now: resolved Core Navigation Registry -> Module Registry-derived nav -> static fallback.
- No sidebar customization UI was added.

**Design rule**: Navigation controls visibility and UX only. It must not grant access; backend route/page permission checks remain authoritative.

## Branch

Current branch: `feature/core-phase-b-organization-templates` (local, ahead of main). Phase B merged to develop via PRs 165–169 + local org-templates branch. Phase B QA passed via code inspection + prior live runs. Pending: one-time live smoke test when Docker Desktop is running (start containers, confirm `GET /context/platform` returns 200 and login works).

## Phase B Core — QA Results (2026-07-01)

All 5 Phase B test suites passed via code inspection (Docker Desktop was stopped during QA session):

| Test | Method | Result |
|---|---|---|
| Unified Context API | Code inspection + prior live | PASS |
| Feature Flag Engine | Code inspection | PASS |
| Idempotent Migrations | Code + prior double-upgrade run | PASS |
| Context Version Invalidation | Code inspection | PASS |
| Phase A Regression | Code inspection | PASS |

**Key facts confirmed**:
- `GET /context/platform` returns all 14 fields including feature_flags, enabled_modules, modules, ai_context, configuration, search, organization_templates
- 10 migration files use `migration_utils.py` guards; 0016 (config registry) already followed the pattern
- `platformContext.tsx` exposes `featureFlags`, `enabledModules`, `isFeatureEnabled(flagKey)` 
- `use-context-version.ts` invalidates `platformContext.all` on all 4 version-change events
- Phase A code (navigation modes, permission simulator, context loading gate) untouched

## Phase B Core Organization Templates v1 (added 2026-07-01)

**Purpose**: Core now owns a code-defined Organization Template Registry for quickly setting up useful organization structures. V1 creates Core records only and applies Core-owned defaults; it does not create Flow, Docs, Desk, Pulse, or other service records.

**Backend (`services/core-service/`)**:
- `schemas/organization_template.py`: Added template catalog, preview/apply report, action, summary, request, and platform metadata schemas.
- `services/organization_templates.py`: Code-defined template catalog plus preview/apply service. Templates are conservative and idempotent: existing workspaces/projects/teams are skipped by name within scope, no records are deleted, and apply returns an action report.
- `api/v1/organization_templates.py`: Added `GET /organization-templates`, `GET /organization-templates/{template_key}`, `POST /organization-templates/{template_key}/preview`, and `POST /organization-templates/{template_key}/apply`.
- `api/v1/context.py`: Unified Platform Context now includes lightweight `organization_templates` metadata with endpoint, template count, and categories.
- `services/permission_registry.py`: Added `settings.organization_templates.view` and `settings.organization_templates.apply`.
- `services/role_service.py`: Organization Owner/Admin templates can apply organization templates and the feature/config overrides used by template application.

**Default templates**:
- `startup`
- `software_team`
- `healthcare`
- `support_desk`
- `agency`
- `enterprise_it`

**Frontend (`frontend/src/`)**:
- Platform context types now accept optional `organization_templates` metadata.
- `usePlatformContext()` exposes `organizationTemplates` with safe defaults.
- No Organization Template UI, onboarding redesign, sidebar, or navigation behavior changed.

**Phase B Core status**: Complete pending manual QA.

## Phase B Core Global Search Registry v1 (added 2026-06-30)

**Purpose**: Core now owns a central search registry and Core-owned search provider for future universal search / CMD+K. V1 uses simple permission-safe SQL/string matching only — no embeddings, no vector search, no external search service, and no CMD+K UI.

**Backend (`services/core-service/`)**:
- `schemas/search.py`: Added searchable entity, result, response, scope, registry, and platform metadata schemas.
- `services/global_search_registry.py`: Code-defined searchable entity registry plus Core search providers for organizations, workspaces, projects, teams, members, roles, modules, and settings.
- `api/v1/search.py`: Added `GET /search` and `GET /search/registry`.
- `api/v1/context.py`: Unified Platform Context now includes lightweight `search` metadata with endpoint, registry endpoint, categories, entity types, and shortcut.

**Frontend (`frontend/src/`)**:
- Platform context types now accept optional `search` metadata.
- `usePlatformContext()` exposes `search` with safe defaults.
- No CMD+K UI, global shortcut, sidebar, navigation, or search box behavior changed.

**Next Phase B item**: Organization Templates.

## Phase B Core Configuration Registry v1 (added 2026-06-30)

**Purpose**: Core now owns a unified settings registry for platform/module behavior configuration. Feature flags determine availability, RBAC determines authority, and configuration determines behavior for enabled features/modules.

**Backend (`services/core-service/`)**:
- `models/configuration.py`: Added `ConfigurationDefinition` and `ConfigurationValue` for typed setting definitions and scoped overrides.
- `alembic/versions/0016_configuration_registry.py`: Adds `configuration_definitions` and `configuration_values` with idempotent table/index guards.
- `services/configuration_registry.py`: Seeds default configuration definitions, validates values, resolves effective configuration, and applies platform -> organization -> workspace -> project inheritance.
- `api/v1/configuration.py`: Added `GET /configuration/definitions`, `GET /configuration/effective`, `GET /configuration/effective/{config_key}`, and `PUT /configuration/values`.
- `services/access_control_bootstrap.py`: Seeds default configuration definitions at startup.
- `services/permission_registry.py`: Added `settings.configuration.view` and `settings.configuration.manage`.
- `api/v1/context.py`: Unified Platform Context now includes lightweight `configuration` metadata with endpoint, definition count, categories, source modules, and inheritance order.

**Frontend (`frontend/src/`)**:
- Platform context types now accept optional `configuration` metadata.
- `usePlatformContext()` exposes `configuration` with safe defaults.
- No UI, sidebar, navigation, Settings page, Assistant, or module behavior changed.

**Next Phase B item**: Global Search Registry.

## Phase B Core AI Context Registry v1 (added 2026-06-30)

**Purpose**: Core now exposes structured, compact context blocks for future Assistant/AI use. This is context assembly only — no LLM provider, chat UI, RAG, embeddings, or external AI calls.

**Backend (`services/core-service/`)**:
- `schemas/ai_context.py`: Added context block, registry, response, scope, summary, and platform metadata schemas.
- `services/ai_context_registry.py`: Code-defined context registry and resolver. Core contributors cover user, scope, access, feature flags, modules, notifications, recent activity, and onboarding.
- `api/v1/ai.py`: Added `GET /ai/context` and `GET /ai/context/registry`.
- `api/v1/context.py`: Unified Platform Context now includes lightweight `ai_context` metadata with endpoint, block count, categories, and source modules.

**Frontend (`frontend/src/`)**:
- Platform context types now accept optional `ai_context` metadata.
- `usePlatformContext()` exposes `aiContext` with safe defaults.
- No UI, sidebar, Assistant, or navigation behavior changed.

**Next Phase B item**: Configuration Registry.

## Phase B Core Module Registry v1 (added 2026-06-30)

**Purpose**: Core now owns central module/navigation metadata. Feature flags decide module availability, RBAC permissions decide user access, and the Module Registry describes how modules appear.

**Backend (`services/core-service/`)**:
- `models/module_registry.py`: Added `ModuleRegistry` with module key, label, route, icon, navigation mode, required feature flag, required permissions, sort order, and active/system flags.
- `alembic/versions/0015_module_registry.py`: Adds `module_registry`.
- `services/module_registry.py`: Default Asthra module catalog, idempotent seeding, module resolver, navigation-mode filtering, feature flag checks, permission checks, and superuser permission bypass.
- `api/v1/modules.py`: Added `GET /modules` for catalog and `GET /modules/available` for user/context-visible modules.
- `api/v1/context.py`: Unified Platform Context now includes effective `modules` alongside `feature_flags` and `enabled_modules`.
- `services/access_control_bootstrap.py`: Seeds default module definitions on startup.

**Frontend (`frontend/src/`)**:
- Platform context types now accept `modules` / `availableModules`.
- `usePlatformContext()` exposes `availableModules` and `hasModule(moduleKey)` with safe defaults.
- Sidebar filtering was intentionally not changed in this pass to avoid blank navigation until dynamic navigation is QA-verified.

**Next Phase B item**: AI Context Registry.

## Phase B Core Feature Flag Engine v1 (added 2026-06-30)

**Purpose**: Feature flags decide whether modules/capabilities are available for a scope. RBAC permissions still decide whether a user may use an available feature.

**Backend (`services/core-service/`)**:
- `models/feature_flag.py`: Added `FeatureFlag` and `FeatureFlagOverride`.
- `alembic/versions/0014_feature_flag_engine.py`: Adds `feature_flags` and `feature_flag_overrides`.
- `services/feature_flags.py`: Default catalog seed, effective flag resolver, `is_feature_enabled`, and override upsert.
- `api/v1/feature_flags.py`: Added `GET /feature-flags`, `GET /feature-flags/effective`, `PUT /feature-flags/overrides`.
- `api/v1/me.py` / `AccessControlService.get_user_permissions()`: Current permissions response now includes `feature_flags` and `enabled_modules`, so existing platform context consumers get feature availability without a separate request.
- `services/access_control_bootstrap.py`: Seeds default flags idempotently on startup.
- `services/permission_registry.py`: Added `settings.feature_flags.view` and `settings.feature_flags.manage` via the `settings.feature_flags` registry resource.

**Default flags**:
- Enabled: `module.flow.enabled`, `module.docs.enabled`, `module.discover.enabled`, `module.memory.enabled`, `module.assistant.enabled`
- Disabled: `module.desk.enabled`, `module.pulse.enabled`, `module.collab.enabled`, `module.automation.enabled`, `module.connect.enabled`, `module.insights.enabled`
- Disabled beta flags: `beta.module_registry.enabled`, `beta.ai_context_registry.enabled`, `beta.global_search.enabled`, `beta.organization_templates.enabled`

**Resolution order**:
1. `FeatureFlag.default_enabled`
2. Platform override
3. Organization override
4. Workspace/project override fields are supported for future use
5. Inactive flag always resolves `false`

**Frontend (`frontend/src/`)**:
- `types/core.ts`: `CurrentUserPermissions` accepts optional `feature_flags` and `enabled_modules`.
- `context/platformContext.tsx`: Exposes `featureFlags`, `enabledModules`, and `isFeatureEnabled(flagKey)` with safe defaults. Sidebar/module navigation behavior was not changed in this pass.

**Next Phase B item**: Module Registry — completed 2026-06-30. Current next item: AI Context Registry.

## Permission Schema System (added 2026-07-07)

**Purpose**: Declarative, single-source-of-truth schema for every page's permission-gated elements. `GodModeSchemaPanel` shows ALL schema elements — including ones never rendered because they're hidden — while `GodModeAutoOverlay` only shows what was actually can()-checked.

**Files**:
- `frontend/src/lib/permission-schema.ts` (new) — `SchemaElementType`, `PageSchemaElement` (key, label, permission, type, description?), `PageSchema` (route, label, elements), `PAGE_SCHEMAS` (9 pages: /settings, /settings/organizations, /settings/organizations/:id, /settings/members, /settings/workspaces, /settings/workspaces/:id, /settings/projects, /settings/roles, /settings/permissions), `findSchemaForRoute(pathname)` using same `:param` → `[^/]+` regex as interceptor.
- `frontend/src/hooks/use-page-permissions.ts` (new) — `usePagePermissions()` hook. Returns `{ schema, visible }`. `visible(key)` → true if no permission OR `can(permission)`. `useEffect` when `isGodModeReady && isEditMode`: proactively calls `registerPermissionCheck` for ALL schema elements with a permission — so panel shows them even if they were never rendered.
- `frontend/src/components/platform/schema-gate.tsx` (new) — `SchemaGate({ elementKey, children, fallback?, className? })`. Looks up permission from schema via `findSchemaForRoute(usePathname())`. No permission found → pass-through. Has permission → behaves identically to `PermissionGate` (+/- overlay in edit mode, ghost placeholder when denied).
- `frontend/src/components/platform/god-mode-schema-panel.tsx` (new) — `GodModeSchemaPanel`. Position: `fixed right-4 top-16 z-50 w-72 max-h-[80vh]`. Calls `usePagePermissions()`. Shows all schema elements with type icons (Button→MousePointer, Tab→FileText, Section→Box, Action→MousePointer, Link→Link2), Eye/EyeOff for visible/hidden status, +/- buttons for permissioned elements. Only renders when `isGodModeReady && isEditMode && schema != null`.
- `frontend/src/layouts/asthra-shell.tsx` (updated) — imports and mounts `<GodModeSchemaPanel />` alongside `<GodModeAutoOverlay />`.
- `frontend/src/app/settings/organizations/[id]/page.tsx` (migrated) — replaced `PermissionGate` with `SchemaGate` for OrgTabs (all 5 tabs unified under `SchemaGate elementKey={tab.key+"_tab"}`), save buttons use `SchemaGate elementKey="edit_general"` / `elementKey="edit_settings"`. Added `usePagePermissions()` call.
- `frontend/src/app/settings/members/page.tsx` (migrated) — added `usePagePermissions()` call.
- `frontend/src/app/settings/organizations/page.tsx` (migrated) — added `usePagePermissions()` call.

**Key difference from auto-overlay**: Schema panel knows about elements with `permission: null` (always visible) and elements that were never rendered (because a prior `can()` returned false and the component short-circuited). Auto-overlay only shows permissions that were actually called.

**Coexistence**: Auto-overlay (`top-20`) and schema panel (`top-16`) are both mounted. They serve complementary purposes. `GodModeSchemaPanel` also calls `usePagePermissions` which proactively registers schema elements — this is additive to the tracker (idempotent).

## God Mode Mock Data Interceptor (added 2026-07-06)

**Purpose**: When God Mode is active (`isGodModeReady`), all API GET requests that would return real data instead return rich "Acme Engineering" demo data. Write operations (POST/PATCH/PUT/DELETE) are blocked with a toast notification. Every settings page shows realistic placeholder content without exposing real customer data.

**Architecture**: Single intercept point at `apiRequest` in `client.ts` — covers all API calls from both `settings-api.ts` and `core-api.ts` without modifying either.

**Files**:
- `frontend/src/lib/god-mode-mock-responses.ts` (new) — Acme Engineering demo data: 4 users (Alex Chen, Jordan Lee, Morgan Smith, Sam Taylor), 1 org, 2 workspaces, 3 projects, org/workspace members, 2 teams+members, 2 API keys, 3 notifications, 5 audit logs, org/workspace settings, org health. All IDs in 9000+ range.
- `frontend/src/lib/god-mode-interceptor.ts` (new) — URL pattern matcher using `:param` → `[^/]+` regex. `shouldPassThrough()` lets auth, platform context, permissions registry, access-control tools, and roles endpoints pass through to real API. All other GETs matched against `MOCK_REGISTRY`. All writes (POST/PATCH/PUT/DELETE) → toast + throw `ApiError(403, "GOD_MODE_BLOCKED")`.
- `frontend/src/services/api/client.ts` (updated) — `apiRequest` calls `interceptGodModeRequest(path, method)` before the fetch. If intercepted + not blocked: waits 40ms (artificial latency for loading state realism), returns `data as T`. If blocked: throws ApiError.
- `frontend/src/lib/god-mode-mock-context.ts` (updated) — Names updated from "Demo Organization/Workspace/Project" to "Acme Engineering / Engineering Hub / Asthra Platform" (in sync with interceptor mock data).

**Passthrough routes** (real API always used):
- `PREFIX/context/` — platform context polling (critical)
- `PREFIX/auth/` — auth endpoints
- `PREFIX/me/` (sub-paths) — `/me/permissions`, `/me/change-password`, etc.
- `PREFIX/access-control/` — simulate, debug, inventory, registry sync
- `PREFIX/roles` (and sub-paths) — God Mode toolbar needs real roles for role switcher
- `PREFIX/role-templates`, `PREFIX/role-assignments` — permissions management
- `PREFIX/permissions` — 313-permission registry and management

**Intercepted GET patterns** (mock data):
Organizations, workspaces, projects, org/workspace members, teams+members, API keys, invitations, notifications, users, audit activity logs, org/workspace settings, org health, `GET /me` (profile page).

**Write blocking**: All non-GET/HEAD requests get a toast ("God Mode: write blocked") and throw 403 ApiError. Components using `useMutation` will see the error in `onError`. No state is changed.

**Gate**: `isGodModeReady` (same as mock context). Interceptor is inactive during animation, passthrough resumes immediately after God Mode exit.

## God Mode Auto-Overlay: Tracked can() System (added 2026-07-06)

**Purpose**: In God Mode edit mode, every `can("permission.code")` call is automatically tracked and surfaced in a "PAGE PERMISSIONS" panel. Zero developer work needed — any component that calls `can()` gets full God Mode coverage. Was 41 manually-wrapped permissions; now any of the 313 permissions are trackable automatically.

**Files**:
- `frontend/src/lib/god-mode-tracker.ts` (new) — Zustand store. Tracks `Record<code, { code, route }>`. Deduplicates by code (same code + route = no-op). Actions: `registerPermissionCheck(code, route)`, `clearForRoute(route)`, `clearAll()`.
- `frontend/src/context/platformContext.tsx` — `can()` now calls `useGodModeTracker.getState().registerPermissionCheck(code, pathnameRef.current)` when `isGodModeReady && isEditMode`. Uses `pathnameRef` (not `pathname` in closure) to avoid adding `pathname` to useMemo deps. Subscribes to `isEditMode` from simulation store; adds it to useMemo deps.
- `frontend/src/components/platform/god-mode-auto-overlay.tsx` (new) — Panel: `fixed right-4 top-20 z-50 w-72`. Filters tracker by current `pathname`. For each tracked code: shows label (from dynamic or static registry), granted/denied status (computed fresh from `simulatedPermissions`), +/- button (calls `markForAddition`/`markForRemoval`/`undoChange`).
- `frontend/src/layouts/asthra-shell.tsx` — Imports `GodModeAutoOverlay` + `useGodModeTracker`. Mounts `<GodModeAutoOverlay />` in content area. Two effects: clear tracker on `pathname` change (fresh detection per page), clear all on `!isGodModeReady` (cleanup on exit).
- `frontend/src/components/platform/permission-gate.tsx` — Added JSDoc note pointing to tracked can() as the preferred approach for new code.

**How tracking works**:
1. User enters God Mode → enters Edit mode → `isGodModeReady && isEditMode = true`
2. Page components render → call `can("some.permission")` → `can()` in platformContext executes
3. `registerPermissionCheck("some.permission", "/current/path")` called via `getState()` (no React subscription, no re-render of provider)
4. Tracker store updated (dedup: same code+route = no-op)
5. `GodModeAutoOverlay` re-renders (subscribed to tracker) → shows permission in panel
6. User clicks −/+ → `markForRemoval`/`markForAddition` → `simulatedPermissions` changes → context re-renders → `can()` called again → tracker updated → overlay reflects new status

**`getState()` pattern**: `useGodModeTracker.getState().registerPermissionCheck(...)` inside `can()` avoids making the platform context provider subscribe to the tracker store (which would cause provider re-renders on every tracker update).

**pathnameRef pattern**: `pathnameRef.current = pathname` (updated each render). `can()` reads `pathnameRef.current` — avoids adding `pathname` to useMemo deps, so navigating doesn't recreate the entire context value.

**Convention going forward**: New components should use `{can("code") && <Component />}` instead of `<PermissionGate>`. God Mode coverage is automatic. PermissionGate still works and stays for existing code.

## God Mode UX + Mock Context (added 2026-07-04, mock context added 2026-07-06)

**Purpose**: God Mode is a distinct powerful mode with dramatic entry/exit animations, a purple toolbar, a purple shell border, and mock platform context data so the sandbox shows exactly what the simulated role sees — with no real org/workspace/project names leaking through.

**Key files**:
- `frontend/src/lib/permission-simulator.ts` — Zustand store. `isActivating`, `isDeactivating`, `isGodModeReady` flags. `activateGodMode()` sets role data + `isSimulating=true` immediately; delays `isGodModeReady=true` by 1800ms (waits for animation). `deactivateGodMode()` delays full reset by 1200ms.
- `frontend/src/lib/god-mode-mock-context.ts` — Fixed mock constants: `GOD_MODE_MOCK_ORG` (id 9001, "Acme Engineering"), `GOD_MODE_MOCK_WORKSPACE` (id 9001, "Engineering Hub"), `GOD_MODE_MOCK_PROJECT` (id 9001, "Asthra Platform", key "ASTH"). IDs in 9000+ range to avoid collision with real records.
- `frontend/src/context/platformContext.tsx` — Subscribes to `isGodModeReady`. When true: overrides `organizations`, `workspaces`, `projects`, `selectedOrganization`, `selectedWorkspace`, `selectedProject`, and `currentScope` with mock data. `can()` and all other fields use real data.
- `frontend/src/components/platform/god-mode-overlay.tsx` — Full-screen z-[9999] overlay with phase-based entry (1800ms) and exit (1200ms) animations.
- `frontend/src/components/platform/god-mode-toolbar.tsx` — `bg-purple-950` toolbar: ⚡ GOD MODE label, role dropdown switcher (switches without animation via `startSimulation`), 🎭 Demo data active indicator, View/Edit toggle, changes badge, Save to Role, ℹ route hints, Exit God Mode.
- `frontend/src/components/platform/god-mode-activation.tsx` — Role selection modal. Calls `activateGodMode()` on confirm.
- `frontend/src/components/navigation/sidebar-nav.tsx` — ⚡ God Mode button (replaces old "View As"). Active indicator shows during animation phases.
- `frontend/src/layouts/asthra-shell.tsx` — Purple `ring-2 ring-purple-500/50 ring-inset` during any God Mode state. Bottom bar: shows static purple mock labels (🎭 Acme Engineering / Engineering Hub / Asthra Platform) instead of interactive switchers when `isGodModeReady`.

**Mock context gate**: `isGodModeReady` (not `isSimulating`). During the 1800ms entry animation, `isSimulating=true` but `isGodModeReady=false` — real context data still shows. Mock data activates only after the animation ends.

**Mock data restoration**: Automatic — no cleanup needed. When `isGodModeReady` becomes false (after exit animation), the `effectiveXxx` values revert to real context data.

**`prebuild`/`predev` non-fatal generation**: `npm run generate:api || true` in both hooks so the dev server and production build proceed even when core-service is not reachable.

## Convention-Based Help Registry (added 2026-07-04)

**Purpose**: Contextual help (Info button modal) is now driven by a convention-based registry. New backend modules auto-appear in help with placeholder content. Human-written content is preserved and never gets out of sync.

**Architecture**:
- `frontend/src/lib/convention-help-registry.ts` (new) — `HELP_CONTENT` (24 routes, human-written), `buildHelpRegistry(availableModules)` (merges HELP_CONTENT + auto-placeholders for unseen routes), `findHelpContent(registry, pathname)` (exact → parent chain → root → generic fallback)
- `frontend/src/lib/help-registry.ts` (deprecated) — re-exports `HelpContent`, `HelpStep`, `HELP_REGISTRY` (= HELP_CONTENT) for backward compat; file kept, marked for future deletion
- `frontend/src/components/platform/contextual-help.tsx` (updated) — imports `buildHelpRegistry`/`findHelpContent` from convention registry; uses `usePlatformContext().availableModules`; builds `helpRegistry` via `useMemo` (stable across re-renders), resolves `content` via `useMemo`

**Routes with human content** (24): `/`, `/flow`, `/flow/backlog`, `/flow/boards`, `/docs`, `/discover`, `/desk`, `/pulse`, `/collab`, `/dev`, `/insights`, `/guard`, `/automation`, `/assistant`, `/memory`, `/settings`, `/settings/members`, `/settings/roles`, `/settings/permissions`, `/settings/organizations`, `/settings/workspaces`, `/settings/access-control`, `/settings/audit-logs`, `/settings/api-keys`

**Convention**: Route in backend module_registry but missing from HELP_CONTENT → auto-placeholder + `console.info` warning in development. No silent gaps.

**Stop-motion animation**: Unchanged. All timer/animation logic in `ContextualHelpModal` is untouched.

## OpenAPI TypeScript Client Generation (added 2026-07-04)

**Purpose**: Auto-generate typed TypeScript client from the core service OpenAPI spec so downstream features can use typed service calls and types instead of hand-writing fetch wrappers.

**Generator**: `@hey-api/openapi-ts@0.49.0` (Node 18 compatible; v0.6+ requires Node 22). Uses built-in `fetch` client (not `@hey-api/client-fetch` — that package has incompatible API with v0.49).

**Config**: `frontend/openapi-ts.config.ts` — reads from `http://localhost:8000/openapi.json`, outputs to `src/services/api/generated/`. Client: `'fetch'` (built-in).

**Files generated** (gitignored, recreated by `npm run generate:api`):
- `src/services/api/generated/index.ts` — barrel re-export
- `src/services/api/generated/types.gen.ts` — TypeScript types for all 98 endpoints
- `src/services/api/generated/services.gen.ts` — typed service functions
- `src/services/api/generated/schemas.gen.ts` — JSON schemas
- `src/services/api/generated/core/` — OpenAPI config, CancelablePromise, request helper

**Barrel export**: `src/services/api/index.ts` re-exports everything from `generated/`.

**Scripts**: `generate:api` (run manually or via prebuild/predev), `prebuild`, `predev` (both auto-run generate:api — requires core-service at localhost:8000).

**Constraint**: `prebuild`/`predev` require core-service to be running. In offline environments, run `npm run build` without the hooks or pre-generate and commit a snapshot.

## Visual Permission Editor — Phase 2 (added 2026-07-03)

**Purpose**: Full God Mode coverage across all settings pages. Every permission-gated UI element is visible and editable in simulator edit mode.

**Files changed**:
- `frontend/src/lib/permission-registry.ts` (new) — `PERMISSION_REGISTRY` (40+ definitions), `getPermissionDefinition(code)`, `getPermissionsForRoute(pathname)`
- `frontend/src/components/platform/permission-gate.tsx` (updated) — `label` prop now optional; auto-resolved from PERMISSION_REGISTRY; richer tooltip: `${label}\n${code}\nAffects: ${definition.affects}`
- `frontend/src/components/settings/settings-admin-views.tsx` (updated) — PermissionGate import added; Invite Member, Change Role, Remove Member in MembersView wrapped; Create Organization in OrganizationsView wrapped; Create Workspace in WorkspacesView wrapped
- `frontend/src/app/settings/workspace/page.tsx` (updated) — Save General, Save Settings, and Archive danger zone wrapped in PermissionGate (replaced `{isAuthorized &&}` conditionals for those elements)
- `frontend/src/layouts/asthra-shell.tsx` (updated) — Route-aware permission hints panel: ℹ icon in simulation banner opens dropdown listing all permissions registered for the current route

**PermissionGate API (updated)**:
- `<PermissionGate permission="code">children</PermissionGate>` — label now optional, auto-looked up from registry
- Tooltip: `Label\ncode\nAffects: description`

**PERMISSION_REGISTRY structure**:
```typescript
type PermissionDefinition = {
  code: string;
  label: string;
  category: string;
  affects: string;
  requires?: string[];  // hierarchy chain
  routes?: string[];    // route patterns (supports [id] segments)
};
```
Categories: Organizations, Members, Workspaces, Roles & Permissions, Projects, Teams, Audit & Compliance.
38 permissions defined. `getPermissionsForRoute` does pattern-based matching for dynamic segments.

**Route hints panel**:
- ℹ button in amber/blue simulation banner (to the right of View/Edit toggle)
- Click opens dropdown listing permission code + label + affects for current route
- Close via ✕ or clicking ℹ again

**Convention (Rules)**:
1. Use `PermissionGate` for all UI elements gated by a permission code — never `{can(x) && <Button>}`
2. Label optional — if in PERMISSION_REGISTRY, auto-resolved
3. For hierarchy-gated elements, use the leaf permission code (e.g. `settings.workspace.edit`, not all 3 parents)
4. Existing `PermissionAction`/`PermissionButton` can stay inside `PermissionGate` as inner layer
5. `getPermissionsForRoute` drives hints panel — update PERMISSION_REGISTRY when adding new gated routes
6. Do not duplicate PERMISSION_REGISTRY in any component — import from `@/lib/permission-registry`

**NOT wrapped** (by design):
- `audit-logs/page.tsx` — no leaf action buttons to wrap (page gate exists, no per-element buttons)
- `api-keys/page.tsx` — personal settings page (user's own keys, no org permission codes)
- Onboard Organization button — platform-admin-only superuser check, not a `can()` code

## Visual Permission Editor — Phase 1 (added 2026-07-02)

**Purpose**: God Mode foundation — makes every permission-gated UI element visible and editable while in simulator edit mode. Admins can click [+/-] to add/remove permissions from the simulated role and save changes back to the role permanently.

**Files**:
- `frontend/src/components/platform/permission-gate.tsx` (new) — `PermissionGate` component
- `frontend/src/components/platform/visual-permission-editor.tsx` (new) — floating save bar
- `frontend/src/lib/permission-simulator.ts` (extended) — edit mode state + instant preview
- `frontend/src/layouts/asthra-shell.tsx` (updated) — banner with View/Edit mode toggle + VPE mount
- `frontend/src/components/navigation/sidebar-nav.tsx` (updated) — passes `roleId` to `startSimulation`
- `frontend/src/app/settings/organizations/[id]/page.tsx` (migrated) — OrgTabs and save buttons

**PermissionGate API**:
- `<PermissionGate permission="code" label="Human Name" fallback={...}>children</PermissionGate>`
- Normal/View: `can(permission) ? children : fallback ?? null` (no DOM change)
- Edit mode visible: thin green ring + absolute minus button top-right (blue ring if pending addition)
- Edit mode hidden: dashed ghost placeholder with label + permission code + plus button (orange if pending removal)
- Clicking +/- updates `simulatedPermissions` immediately for instant preview

**Store additions to `useSimulationStore`**:
- `simulatedRoleId: number | null` — needed for API save
- `isEditMode`, `enterEditMode`, `exitEditMode`
- `originalSimulatedPermissions` — baseline for discard
- `pendingAdditions`, `pendingRemovals`, `hasUnsavedChanges`, `pendingChangeCount`
- `markForAddition(p)`, `markForRemoval(p)`, `undoChange(p)`, `clearPendingChanges()`, `commitChanges()`

**Save flow**: `VisualPermissionEditor` calls `listPermissions()` to resolve codes→IDs, then `addRolePermission`/`removeRolePermission` per change. On success: `commitChanges()` makes new permissions the baseline.

**Banner**: Amber (view mode) ↔ Blue (edit mode). Toggle row shows View Mode / Edit Mode buttons with pending count badge. Exit button always visible.

**Migrated**: `organizations/[id]/page.tsx` — OrgTabs Members/Workspaces tabs use PermissionGate (replaced `hiddenTabs` prop); edit form save buttons wrapped in PermissionGate.

**Backend API methods** (all pre-existing, none added):
- `settingsApi.listPermissions(token)` → `GET /permissions` (all permissions with IDs)
- `settingsApi.addRolePermission(token, roleId, permId)` → `POST /roles/{roleId}/permissions`
- `settingsApi.removeRolePermission(token, roleId, permId)` → `DELETE /roles/{roleId}/permissions/{permId}`

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

## Dynamic Permission Registry (added 2026-07-03)

**Purpose**: Replace static handwritten 41-entry `permission-registry.ts` with a dynamic registry that auto-syncs from the backend (313 permissions). New backend permissions appear in God Mode automatically without any frontend code changes.

**Architecture**:
- `frontend/src/stores/permission-registry-store.ts` (new) — Zustand store. Holds all 313 backend permissions, enriched with metadata from the static registry. Lazy: only loads when God Mode (`isSimulating`) opens. Cached for the session. `loadRegistry(token)` guarded by `isLoaded || isLoading` checks.
- `frontend/src/hooks/use-permission-registry.ts` (new) — convenience hook. `usePermissionRegistry()` auto-triggers load when token + simulation are active. `usePermissionDefinition(code)` for single-code lookups.
- Static `permission-registry.ts` kept as the **enrichment layer** — not deleted. Maps permission codes → `{ label, category, affects, requires, routes }`. Only contains permissions that have `PermissionGate` wrappers (41 of 313). Backend is source of truth for ALL 313.

**Enrichment model**:
Backend `PermissionRegistryItem` (code, name, description, module, resource, action, scope, risk_level, exists, status) is merged with the static `PermissionDefinition` (label, category, affects, requires, routes) to produce `EnrichedPermissionDefinition`. `hasUIGate: true` when a static entry exists for that code.

**Coverage tracking**: `getCoverageStats()` returns `{ total, withUIGate, coverage }`. Coverage panel in God Mode shows live stats (e.g. 41/313 = 13%).

**Files changed**:
- `frontend/src/stores/permission-registry-store.ts` (new)
- `frontend/src/hooks/use-permission-registry.ts` (new)
- `frontend/src/components/platform/permission-gate.tsx` (updated) — uses dynamic registry for label/affects/risk_level in tooltip; falls back to static registry; tooltip now includes `Risk: {risk_level}` from backend
- `frontend/src/components/platform/visual-permission-editor.tsx` (extended) — added Permission Coverage side panel (all 313 permissions by module, collapsible, ✓/○ for UI gate status); floating bar now shows coverage button `📊 41/313 13%` always during simulation (not only when edits pending); save bar still shows only when `isEditMode && hasUnsavedChanges`
- `frontend/src/layouts/asthra-shell.tsx` (updated) — triggers `loadRegistry` when God Mode opens; hints panel (`ℹ`) now shows all route permissions from backend (falls back to static when registry not loaded); VPE now mounted for entire simulation (not just edit mode)

**Coverage workflow**:
When a developer adds a new `PermissionGate`:
1. Add entry to `permission-registry.ts` (enrichment: label, affects, routes)
2. Permission code already exists in backend registry
3. Dynamic store picks up the enrichment on next load
4. `hasUIGate: true` for that code — coverage % increases
5. Coverage panel in God Mode shows green ✓ instead of ○

## Dynamic Navigation Registry (added 2026-07-04)

**Purpose**: Sidebar navigation is now driven by `availableModules[]` from `GET /context/platform`. New backend modules automatically appear in the correct sidebar section without any frontend code changes.

**Architecture**:
- `frontend/src/lib/module-nav-registry.ts` (new) — `ICON_MAP` (snake_case icon string → LucideIcon), `CATEGORY_TO_LABEL` (backend category → section label), `MODULE_KEY_SECTION_OVERRIDE` (per-key section overrides for org settings pages), `SECTION_ORDER`, `buildNavSections(modules, mode)` → `ModeNavSection[]`
- `frontend/src/components/navigation/sidebar-nav.tsx` (updated) — uses `buildNavSections(availableModules, effectiveMode)` when modules loaded; falls back to `navSectionsForMode()` (static) when empty; wraps permission-gated items in `<PermissionGate>` during edit mode
- `frontend/src/lib/navigation-mode.ts` (updated) — static nav constants marked as fallback only via comment block

**Fallback chain**: `availableModules.length > 0` → `buildNavSections()` (dynamic) / empty → `navSectionsForMode()` (static PLATFORM_NAV / ORG_NAV / WORK_NAV)

**God Mode integration**: In edit mode, `shouldShowItem` returns `true` for all permission-gated items (PermissionGate handles overlay). Item rendering wraps permission items in `<PermissionGate permission={item.permission} label="{item.label} (sidebar)">` when `isEditMode`.

**Icon mapping**: Backend stores icon names in snake_case Lucide naming (e.g. `scroll_text`, `book_open`, `bar_chart3`). `ICON_MAP` in `module-nav-registry.ts` maps these to PascalCase Lucide components. To add a new icon: add snake_case key to `ICON_MAP`.

**Section override**: All org-mode modules share `category="organization"` but display in "Organization" or "Settings" sections. `MODULE_KEY_SECTION_OVERRIDE` maps `org_settings`, `preferences`, `profile` → "Settings". Add keys here for any future per-module section overrides.

## Navigation Configuration Foundation Step 2 (added 2026-08-13)

Core now has the Step 2 foundation for future role-based navigation customization:

- `core.navigation_config.enabled` feature flag exists and defaults to `false`.
- `role_navigation_configs` model/table/migration exists for per-role/per-mode nav metadata.
- Backend navigation APIs can read, update, and preview role nav config with `settings.navigation.view/manage`.
- Live sidebar rendering is unchanged. Role Navigation Config is not consumed by `/context/platform`, `AsthraShell`, or `SidebarNav` yet.
- Existing sidebar baseline remains: Core Navigation Registry -> Module Registry fallback -> static fallback.

Next navigation step: build admin preview/read UI and QA matrix before any live sidebar consumer is enabled.

## Navigation Settings Inspection UI Step 3 (added 2026-08-13)

Frontend now has `/settings/navigation`, a read-only admin inspection page for Core Navigation Registry and Role Navigation Config foundation data.

- Shows navigation registry status, counts, and grouped item tables.
- Shows role/mode config preview metadata from backend role navigation config APIs.
- Adds a Settings home/card link gated by `settings.navigation.view` or `settings.navigation.manage`.
- Does not modify live sidebar rendering, `AsthraShell`, God Mode, bottom bar, or navigation source order.
- `core.navigation_config.enabled` remains default `false`; live application is still deferred.

Next navigation step: Step 4 safe role navigation config editor/QA, still without enabling live sidebar behavior until explicitly approved.

## Navigation Config Editor Step 4 (added 2026-08-13)

Frontend `/settings/navigation` now includes a safe role navigation config editor for future sidebar customization metadata. Admins with `settings.navigation.manage` can select a role/mode, edit per-item visibility metadata and optional order overrides, save via the backend role navigation config API, reset a mode to default metadata, and inspect backend preview output. Users with only `settings.navigation.view` remain read-only.

Live sidebar behavior is unchanged. `AsthraShell`, SidebarNav, God Mode, bottom bar, `/context/platform` resolved navigation, and `core.navigation_config.enabled` remain untouched; the feature flag still defaults false. Role Navigation Config is still metadata/QA only and cannot grant access.

Next navigation step: Step 5 QA/static preview, then an explicitly approved feature-flagged live consumer only after certification.

## Navigation Sidebar Preview Step 5 (added 2026-08-13)

Frontend `/settings/navigation` now includes a simulated sidebar preview for the selected role and mode. The preview combines backend role navigation config preview metadata, current editor state, selected role permissions, current feature flag availability, and registry defaults to show Allowed, Locked, and Hidden item states. Hidden items are counted and expandable; locked preview items are disabled and do not navigate. Unsaved editor changes are reflected locally and clearly marked.

Live sidebar behavior remains unchanged. `AsthraShell`, SidebarNav live rendering, God Mode, bottom bar, `/context/platform` navigation, and `core.navigation_config.enabled` remain untouched. Navigation configuration still cannot grant access; backend permissions and route/page guards remain authoritative.

Next navigation step: Step 6 preview QA/certification, followed only later by an explicitly approved feature-flagged live sidebar consumer.
