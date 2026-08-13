# Core Navigation Certification

Date: 2026-08-13

## Purpose

This report certifies the Navigation Config foundation before any live sidebar integration. Step 5.5 adds backend and frontend QA fixtures for role navigation config behavior while preserving the current production sidebar baseline.

This certification is deliberately inspection-first. Role Navigation Config remains metadata only until a later gated integration step.

## Current Phase Status

| Step | Status | Notes |
|---|---|---|
| Step 1 Navigation Baseline | Complete | Current sidebar source order and fallback behavior documented in `CORE_NAVIGATION_BASELINE.md`. |
| Step 2 Navigation Config Foundation | Complete | `core.navigation_config.enabled` exists and defaults false; role config persistence/API exists. |
| Step 3 Navigation Settings Inspection UI | Complete | `/settings/navigation` reads registry/config/preview metadata. |
| Step 4 Navigation Settings Editor UI | Complete | Role config metadata can be edited and saved from Settings. |
| Step 5 Navigation Sidebar Preview | Complete | Settings preview simulates allowed/locked/hidden states; live sidebar unchanged. |
| Step 5.5 Navigation QA Fixtures | Complete in code | Backend certification tests and frontend pure preview-rule tests added. Local test execution is blocked by missing migrated test tooling. |
| Step 6 Live Sidebar Integration | Complete in code | Feature-flagged live consumer added; full dependency-backed validation and browser QA still required. |

## Safety Rules

- Live sidebar rendering must remain unchanged until `core.navigation_config.enabled` is explicitly enabled in a future step.
- `AsthraShell`, God Mode, bottom bar, and `/context/platform` navigation resolver must not consume role navigation config in Step 5.5.
- Role Navigation Config can hide, lock, relabel, regroup, or reorder preview metadata only.
- Role Navigation Config must never grant backend permissions or bypass route/page authorization.
- The fallback chain remains: Core Navigation Registry -> Module Registry fallback -> static fallback.

## Feature Flag Status

`core.navigation_config.enabled` is present in the Feature Flag catalog and defaults to `false`.

The Step 5.5 backend fixture checks that the flag remains active and disabled by default. No frontend code enables or consumes it for live sidebar behavior.

## Backend Certification Matrix

Backend fixture: `services/core-service/tests/test_navigation_config_certification.py`

| Area | Certified Behavior |
|---|---|
| Feature flag default | `core.navigation_config.enabled` defaults false. |
| Registry shape | Navigation items expose key, label, route, mode, group, order, and permission metadata. |
| Persistence | Role config updates persist visibility/order overrides. |
| Reset | Returning an item to `default` clears metadata overrides. |
| Validation | Invalid role, mode, nav key, and visibility are rejected with 4xx/HTTP validation. |
| Preview metadata | Backend preview reflects saved config metadata and required permissions. |
| No permission grant | Saving role config does not add effective permissions. |
| No live resolver effect | Existing live navigation resolver ignores role config, including hidden config for Superuser. |

## Frontend Certification Matrix

Frontend helper: `frontend/src/lib/navigation-config-preview.ts`

Frontend fixture: `frontend/src/lib/navigation-config-preview.test.ts`

| Area | Certified Behavior |
|---|---|
| Allowed state | Role with a required permission sees the item as allowed. |
| Locked state | Missing permission renders locked only when config is `show_locked_if_denied`. |
| Hidden state | Missing permission hides default/show-when-allowed items. |
| Explicit hidden | `hidden` config hides an item even when role permissions allow it. |
| Feature flags | Disabled required feature flag hides item even when role permissions allow it. |
| Counts | Allowed/locked/hidden preview totals are computed from the same helper used by the UI. |

The Settings -> Navigation page now imports this helper instead of embedding all preview state logic inline, so the visible preview and tests share the same rules.

## Frontend Manual QA Checklist

Run before Step 6:

1. Login as Superuser or Platform Owner.
2. Open `/settings/navigation`.
3. Select a role and each navigation mode.
4. Confirm the registry inventory still loads.
5. Set one item to `show_locked_if_denied` for a role missing that item permission.
6. Confirm the simulated sidebar shows it as locked and non-clicking.
7. Set the same item to `hidden`.
8. Confirm it moves to hidden details.
9. Reset the mode to Default.
10. Confirm the preview returns to default visibility behavior.
11. Navigate around the real app and confirm the live sidebar did not change.
12. Confirm God Mode still opens and behaves the same.
13. Confirm bottom bar user/org/workspace/project display still behaves the same.
14. Confirm `core.navigation_config.enabled` is still false.

## Live Sidebar Non-Change Guarantee

Step 5.5 does not modify:

- `frontend/src/layouts/asthra-shell.tsx`
- live sidebar rendering code
- God Mode simulation behavior
- bottom bar scope controls
- `/api/v1/context/platform` navigation resolution
- Navigation Registry live resolver behavior

The only frontend runtime change is the Settings -> Navigation inspection/preview page using a shared pure helper for simulated preview state.

## Go / No-Go Criteria For Step 6

Do not start Step 6 unless all criteria are satisfied:

- Current live sidebar is visually unchanged.
- God Mode works.
- Bottom bar user/context display works.
- Role config editor persists values.
- Preview shows allowed/locked/hidden correctly.
- Backend certification tests pass, or documented environment-safe validation passes when local tooling is unavailable.
- Frontend preview helper tests pass, or documented environment-safe validation passes when local tooling is unavailable.
- `core.navigation_config.enabled` remains false by default.
- Fallback behavior is clearly defined and preserved.

## Known Gaps

- Live sidebar application is not enabled yet.
- Locked navigation request-access workflow is not implemented yet.
- Role-based config is not consumed by the real sidebar.
- Organization/workspace/user-level navigation overrides are not implemented yet.
- Local migrated checkout is missing standard test tooling at time of certification; use container or restored dependencies for full test execution.

## Rollback Plan

If preview/certification code causes issues before Step 6:

1. Remove `/settings/navigation` preview helper usage and return the page to backend metadata display only.
2. Keep backend role config tables/API if already migrated; they are inert while the feature flag is false.
3. Confirm `/context/platform` and live sidebar still ignore role config.
4. Keep `core.navigation_config.enabled` false.

## Validation Results

Local migrated checkout validation on 2026-08-13:

- `cd frontend && ./node_modules/.bin/tsc --noEmit` could not run because `frontend/node_modules/.bin/tsc` is missing.
- `cd frontend && ./node_modules/.bin/vitest run src/lib/navigation-config-preview.test.ts` could not run because `frontend/node_modules/.bin/vitest` is missing.
- `cd services/core-service && python3 -m pytest tests/test_navigation_config_certification.py -vv` could not run because system Python has no `pytest` installed.
- Direct Python syntax compile for `services/core-service/tests/test_navigation_config_certification.py` passed using `compile(...)`.
- `git diff --check` passed.

Run full targeted backend/frontend tests after restoring project dependencies or inside the project containers.

## Certification Result

Step 5.5 is ready for dependency-backed validation. It adds QA fixtures and documentation without changing live sidebar behavior.


## Step 6 Certification Addendum

Step 6 adds the first live consumer behind `core.navigation_config.enabled`. The flag remains default false.

Certified code paths added:

- `frontend/src/lib/navigation-config-live-resolver.ts` returns original section references when the feature flag is false or config is missing.
- `frontend/src/components/navigation/sidebar-nav.tsx` does not fetch live role config when the feature flag is false.
- Live config is skipped for Superuser and during God Mode/simulation/edit/activation/deactivation states.
- Ambiguous effective role selection falls back to baseline behavior.
- Locked items render as disabled buttons and do not navigate.
- Config cannot grant access: denied items become hidden or locked, never clickable.
- `GET /api/v1/navigation/my-role-config` exposes only the current user's own effective role config for the requested scope.

Step 6 browser QA is still required with the flag false baseline and a local flag-true controlled test before moving to Step 7.


## Step 6 Validation Results

Local migrated checkout validation on 2026-08-13:

- `cd frontend && ./node_modules/.bin/tsc --noEmit` could not run because `frontend/node_modules/.bin/tsc` is missing.
- `cd frontend && ./node_modules/.bin/vitest run src/lib/navigation-config-live-resolver.test.ts` could not run because `frontend/node_modules/.bin/vitest` is missing.
- `cd services/core-service && python3 -m pytest tests/test_navigation_config_certification.py -vv` could not run because system Python has no `pytest` installed.
- Direct Python syntax compile for `services/core-service/app/api/v1/navigation.py` and `services/core-service/tests/test_navigation_config_certification.py` passed using `compile(...)`.
- `git diff --check` passed.

Full Step 6 acceptance still requires dependency-backed frontend typecheck, resolver tests, backend test execution, and browser QA for flag-false and flag-true scenarios.


## Feature Flags QA Control Addendum

Settings now includes `/settings/feature-flags` as a controlled admin UI for existing Core feature flags. The page is gated by `settings.feature_flags.view` and `settings.feature_flags.manage`, uses the existing Feature Flag API, and highlights `core.navigation_config.enabled` for Step 6 flag-true browser QA.

This addendum does not change the default seed value: `core.navigation_config.enabled` remains false by default. The UI only writes explicit platform-scope overrides when an authorized admin toggles a flag. Live sidebar behavior remains governed by the existing feature-flagged Step 6 consumer and is unchanged by the page itself.

Manual Step 6 flag-true QA can now be performed without direct database edits:

1. Open `/settings/feature-flags` as Superuser or Platform Owner.
2. Toggle `core.navigation_config.enabled` to true.
3. Refresh `/settings/navigation` and confirm the flag status reads true.
4. Run the live sidebar flag-true checks.
5. Toggle `core.navigation_config.enabled` back to false after QA.
