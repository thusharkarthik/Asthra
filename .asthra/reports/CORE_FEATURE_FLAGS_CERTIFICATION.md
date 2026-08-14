# Core Feature Flags Certification

Date: 2026-08-14

## Scope

This certification audits the existing Core Feature Flag Engine and the Settings Feature Flags inspection/management UI. It does not add runtime sidebar behavior, does not enable any flag by default, and does not change RBAC behavior.

## Flow Found

Backend flow:
- `FeatureFlagService.ensure_default_flags()` idempotently seeds system flags from `DEFAULT_FEATURE_FLAGS`.
- `FeatureFlagService.get_effective_feature_flags(scope_type, scope_id)` resolves defaults, then platform overrides, then organization/workspace/project overrides when in scope.
- Inactive flags resolve to `false`.
- Unknown flags read through `is_feature_enabled()` fail closed as `false`.
- `FeatureFlagService.set_feature_flag_override()` requires `settings.feature_flags.manage`, upserts an override, bumps context version, and commits.

API flow:
- `GET /api/v1/feature-flags` returns catalog and overrides and requires `settings.feature_flags.view`.
- `GET /api/v1/feature-flags/effective` returns effective flags for a requested scope to authenticated users.
- `PUT /api/v1/feature-flags/overrides` updates scoped overrides and is protected by `settings.feature_flags.manage` in the service layer.
- `GET /api/v1/context/platform` includes `feature_flags` and `enabled_modules` from the permission/access context.

Frontend flow:
- `/settings/feature-flags` uses backend catalog/effective APIs.
- Visibility is gated by `settings.feature_flags.view` or `settings.feature_flags.manage` from platform context.
- Toggle controls require `settings.feature_flags.manage`.
- Toggle success invalidates feature-flag queries, platform context, and context version.
- `core.navigation_config.enabled` is surfaced for QA but remains default `false`.

## Certified Defaults

`core.navigation_config.enabled` is present as a system Core flag and defaults to `false`.

Known module defaults remain unchanged:
- Enabled by default: Flow, Docs, Discover, Memory, Assistant.
- Disabled by default: Desk, Pulse, Collab, Automation, Connect, Insights, beta registry flags, and Role Navigation Config.

## Permissions Behavior

Feature flags do not grant user permissions. They only determine whether a feature/capability is available for a scope. RBAC remains the authority for whether a user can use the feature.

Certification tests assert that toggling `core.navigation_config.enabled` does not mutate role assignments and does not change existing effective permission codes.

## Platform Context Behavior

Platform context exposes:
- `feature_flags`
- `enabled_modules`

After an authorized override, platform context reflects the effective value. Context version is bumped by the override service so frontend invalidation can refresh safely.

## Tests Added

Added `services/core-service/tests/test_feature_flags_certification.py` covering:
- default flag seeding and idempotency
- `core.navigation_config.enabled` default false
- unknown and inactive flags failing closed
- platform and organization override precedence
- catalog/effective/override API authorization
- platform context feature flag exposure
- no RBAC mutation after flag toggle
- invalid scope and unknown flag validation errors

## Known Gaps

- No dedicated audit event was confirmed beyond context version bumping.
- Workspace/project override precedence is implemented by the service, but this certification focuses on platform and organization scope because current QA need is platform-scope navigation config toggling.
- The Navigation Settings page contains older preview copy that says live sidebar config is enabled in a later step; live consumer behavior now exists behind the flag. This is copy drift, not a feature flag engine defect.

## Certification Status

Feature Flags Engine: certified by code audit and added targeted tests.

Manual QA still required in a running local app:
1. Login as Superuser/Platform Owner.
2. Open `/settings/feature-flags`.
3. Confirm `core.navigation_config.enabled` is visible and effective value is false.
4. Toggle it true and confirm Settings -> Navigation shows live sidebar config enabled after refresh/refetch.
5. Toggle it false and confirm Settings -> Navigation shows disabled.
6. Confirm sidebar, God Mode, bottom bar, and backend RBAC behavior remain unchanged except for explicitly feature-flagged navigation config behavior.
