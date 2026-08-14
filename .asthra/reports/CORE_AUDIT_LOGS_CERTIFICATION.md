# Core Audit Logs Certification

Date: 2026-08-14

## Purpose

This report certifies the current Core audit log system before deeper Core permission/member lifecycle certification. Core calls the audit trail `activity_logs`; the Settings UI presents the same data as Audit Logs.

Audit logs are traceability records only. They must not grant access, assign roles, approve requests, or mutate business state beyond writing the audit event itself.

## Current Audit Log Architecture

Backend-owned files:
- `services/core-service/app/models/activity_log.py`
- `services/core-service/app/schemas/activity_log.py`
- `services/core-service/app/repositories/activity_repository.py`
- `services/core-service/app/services/activity_service.py`
- `services/core-service/app/api/v1/activity.py`

Model fields:
- `actor_user_id`
- optional `organization_id`, `workspace_id`, `project_id`
- `action`
- `entity_type`
- optional `entity_id`
- `description`
- `summary`
- `event_metadata`
- timestamp mixin fields `created_at`, `updated_at`

Creation helper:
- `ActivityService.log_activity(...)`

The helper writes one `activity_logs` row and returns it. It does not mutate roles, permissions, feature flags, navigation config, or memberships.

## Backend API Behavior

Endpoints:
- `GET /api/v1/activity`
- `GET /api/v1/activity/{activity_id}`
- `GET /api/v1/activity/users/{user_id}`
- `GET /api/v1/activity/organizations/{organization_id}`
- `GET /api/v1/activity/workspaces/{workspace_id}`
- `GET /api/v1/activity/projects/{project_id}`

Filters supported by `GET /activity`:
- `entity_type`
- `action`
- `organization_id`
- `workspace_id`
- `project_id`
- `actor_user_id`
- `limit`
- `offset`

List ordering:
- Newest first by `created_at desc`.

Pagination:
- Offset/limit pagination is supported, with `limit` constrained to 1-200.

## Permissions and Scope Rules

Hardened in this certification:
- Audit log list/detail reads now require `guard.audit.view` for platform, organization, workspace, or project audit scopes.
- Superuser bypass remains intact through the backend permission resolver.
- Personal self-activity remains readable through `/activity/users/{current_user.id}` for unscoped personal activity and through direct detail only for personal unscoped activity.

Scope mapping:
- `project_id` -> require `guard.audit.view` at project scope.
- `workspace_id` -> require `guard.audit.view` at workspace scope.
- `organization_id` -> require `guard.audit.view` at organization scope.
- no scope filter -> require `guard.audit.view` at platform scope, including actor-filtered generic `/activity` reads.

Before this hardening, `GET /activity` with no scope filter could pass for any active non-superuser because the service only checked supplied scope filters. That was fixed in `ActivityService._ensure_filter_access(...)`.

## Frontend UI Behavior

Frontend-owned files inspected:
- `frontend/src/app/settings/audit-logs/page.tsx`
- `frontend/src/services/api/settings-api.ts`
- `frontend/src/types/core.ts`
- `frontend/src/components/settings/settings-admin-views.tsx`
- `frontend/src/lib/navigation-mode.ts`
- `frontend/src/lib/permission-schema.ts`

Settings page behavior:
- Route: `/settings/audit-logs`
- API client: `settingsApi.listActivityLogs(...)`
- Query key: `["audit-logs", scopeOrgId, actionFilter, page]`
- Page size: 25
- Action filter dropdown exists.
- Loading, error, empty, table, and pagination states exist.
- Rows display relative timestamp, actor label, action badge, description, and scope label.

Frontend gating notes:
- Sidebar/static navigation uses `guard.audit.view` for Audit Logs.
- Permission schema uses `guard.audit.view` for Audit Logs elements.
- The page currently also allows broad `authorityLevel === "org"` and global/platform authority in addition to `can("guard.audit.view")`. Backend enforcement now prevents accidental data exposure if frontend authority is broader than effective audit permission.
- The Settings home Platform section links to Audit Logs unconditionally inside admin Settings navigation; backend/page gates remain the actual protection.

No frontend code changes were required in this certification pass.

## Event Creation Behavior

`ActivityService.log_activity(...)` captures:
- actor
- action
- entity/resource type
- entity/resource id
- optional organization/workspace/project scope
- description/summary
- metadata
- created timestamp

Sensitive data handling:
- There is no central structured redaction layer in `ActivityService` today.
- Existing producers inspected generally log names, IDs, actions, and descriptions rather than raw secrets.
- API key creation returns the raw API key to the caller but logged activity only records the API key id/name/action; the raw key is not logged by `APIKeyService`.
- Future producers must not pass tokens, passwords, API keys, or secrets into `metadata` or `description`.

## Producer Coverage Matrix

| Action area | Current audit status | Evidence | Risk | Recommendation |
|---|---|---|---|---|
| Auth login/logout | not audited | `auth_service.py`, `api/v1/auth.py` inspected; no `log_activity` calls | Medium | Add auth security events later without logging credentials/tokens. |
| Organization create/update/archive/restore | audited | `organization_service.py` logs `organization.created`, `organization.updated`, `organization.deactivated`, `organization.reactivated` | Low | Keep lifecycle action names aligned with UI filters. |
| Workspace create/update/archive/restore | audited | `workspace_service.py` logs `workspace.created`, `workspace.updated`, `workspace.archived`, `workspace.restored` | Low | Keep coverage in workspace lifecycle tests. |
| Project create/update/archive/restore | audited | `project_service.py` logs `project.created`, `project.updated`, `project.archived`, `project.restored` | Low | Keep restore/archive coverage in Owner QA. |
| Member invite/add/remove/archive/restore | partial | `invitation_service.py`, `membership_service.py`, `team_service.py` log invite/member/team membership actions | Medium | Normalize member lifecycle action names and confirm org/workspace removal producers in lifecycle tests. |
| Role assignment add/remove | audited/partial | `role_service.py` logs `role.assigned`; `scoped_membership_service.py` has role revoke logging path | Medium | Certify current role assignment endpoints in the next RBAC lifecycle pass. |
| Role/permission edit | audited | `role_service.py` logs role create/update/delete and permission assigned/removed; `permission_service.py` logs permission creation | Low | Add tests for role permission edit events. |
| Feature flag override | not audited | `feature_flags.py` updates overrides and bumps context; no `log_activity` | Medium | Add audit event for feature flag override changes in a future hardening pass. |
| API key create/revoke | audited | `api_key_service.py` logs created/updated/revoked/deleted without raw key | Low | Keep raw key out of log metadata. |
| Access request submit | not audited | `notification_service.py::send_access_request` creates notification only | Medium | Add `access_request.submitted` event when structured access-request model exists. |
| Notification read/delete/mark all | audited | `notification_service.py` logs `notification.read`, `notification.deleted`, `notification.all_read` | Low | Keep notification read/delete audit lightweight. |
| Navigation config edit | not audited | `role_navigation_config.py` inspected; no `log_activity` | Medium | Add audit event for role navigation config updates before broad rollout. |
| Organization template apply | audited | `organization_templates.py` logs `organization_template.applied` | Low | Include template action report summary in future metadata if safe. |
| Configuration registry update | not audited | `configuration_registry.py` inspected; no `log_activity` | Medium | Add audit event for config value updates; avoid secret values. |

## Read / Filter / Pagination Behavior

Certified behavior:
- Auth required for activity API reads.
- `guard.audit.view` required for platform/org/workspace/project audit scopes.
- Superuser can view platform/global events.
- Organization auditor can view allowed org events and is denied unrelated org events.
- Newest-first ordering works.
- Filtering by action and entity type works.
- Offset/limit pagination works.
- Event metadata is returned as `event_metadata`.

## Security and Sensitive Data Handling

Certified safety:
- Audit log reads do not grant permissions.
- Audit log creation does not create role assignments.
- Audit log reads do not mutate business records.
- Backend audit read access now relies on `guard.audit.view`, not frontend-only page checks.

Known sensitivity gap:
- `ActivityService` does not centrally redact metadata. Producers are responsible for not passing secrets.
- No automated test currently scans every producer for secret fields.

## Test Matrix

Backend fixture added:

`services/core-service/tests/test_audit_logs_certification.py`

| Area | Coverage |
|---|---|
| Auth required | Unauthenticated list/detail rejected. |
| Permission required | User without `guard.audit.view` cannot list global, org, or actor-filtered generic audit logs. |
| User activity isolation | Ordinary users can read their own unscoped personal activity through `/activity/users/{current_user.id}` and cannot read another user without audit permission. |
| Scope isolation | Org auditor sees allowed org logs and is denied unrelated org logs. |
| Platform/superuser | Superuser can view platform/global audit logs. |
| Event creation | Service-created audit event appears in API list/detail. |
| Ordering/filtering | Newest-first, action filter, entity type filter, and pagination are tested. |
| Safety | Audit create/read does not mutate role assignment count. |
| Personal activity | Own unscoped personal activity remains readable without audit permission; scoped audit rows and unrelated user details stay denied. |

## Manual QA Checklist

1. Login as Superuser/Platform Owner.
2. Open Settings -> Audit Logs.
3. Confirm page loads.
4. Confirm events are listed or empty state is clear.
5. Perform one admin action that is known to be audited, such as organization update or API key create/revoke.
6. Refresh Audit Logs.
7. Confirm new audit event appears.
8. Confirm timestamp/action/resource/actor are understandable.
9. Try action filter and pagination if enough events exist.
10. Login as user without audit permission.
11. Confirm Audit Logs page is hidden or access restricted.
12. Confirm direct `/api/v1/activity` access returns 403 for that user.
13. Confirm audit logs did not grant any permission or role.
14. Confirm no sensitive tokens/secrets are visible.

## Known Gaps

- Not all admin/security-relevant actions produce audit events yet.
- No immutable append-only enforcement at the database/service layer.
- No retention policy or cleanup workflow.
- No export UI/API despite `settings.audit.export` existing in registry definitions.
- No advanced search beyond exact action/entity/scope filters.
- No central sensitive-field redaction in `ActivityService`.
- Feature flag overrides, access request submit, navigation config edit, configuration registry updates, and auth login/logout are not audited today.
- Frontend Audit Logs page has useful filters/table/empty state but no free-text search and no metadata drilldown.

## Go / No-Go Criteria

Go for continued Core certification when:
- Backend audit tests pass in a dependency-complete environment.
- Manual QA confirms authorized audit users can view logs.
- Manual QA confirms unauthorized users cannot view logs directly or through Settings.
- Known producer gaps are accepted or scheduled.
- No secret values appear in audit log descriptions or metadata.

No-go for deeper member/RBAC lifecycle rollout if:
- Audit reads expose cross-org data.
- Audit logs grant or mutate access.
- Role/member lifecycle actions proceed without traceability for critical mutations.
- Producers log raw secrets, tokens, passwords, or API keys.
