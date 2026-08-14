# Core Access Request Certification

Date: 2026-08-14

## Purpose

This report certifies the current Core Request Access flow used by restricted Settings pages and feature-flagged locked navigation items. Request Access is a handoff workflow only: it creates a notification for an appropriate admin. It must not grant permissions, assign roles, or bypass backend authorization.

## Current Flow

### Frontend Entry Points

- Restricted Settings pages render `RequestAccessButton` from `frontend/src/app/settings/layout.tsx`.
- Current restricted page usages include organizations, organization detail, members, member detail, workspaces, workspace settings, navigation settings, and feature flags settings.
- Feature-flagged locked navigation items render from `frontend/src/components/navigation/sidebar-nav.tsx` when Role Navigation Config resolves an item to `visible_locked`.
- Locked navigation items remain buttons, not links. Clicking opens an `Access restricted` modal and can submit a request through `settingsApi.sendAccessRequest(...)`.

### Frontend Payload

The frontend API client is:

```ts
settingsApi.sendAccessRequest(token, { page, message })
```

The backend currently accepts only:

- `page`
- optional `message`

Locked navigation packs richer context into `message`:

- navigation item label
- navigation key
- current mode
- source role when available
- missing permission codes when available
- explanation that navigation visibility is not access

Restricted Settings pages currently send the restricted page route and an optional user-entered message.

### API Endpoint

`POST /api/v1/notifications/access-request`

Backend route:

- `services/core-service/app/api/v1/notifications.py`

Schema:

- `services/core-service/app/schemas/notification.py::AccessRequestCreate`

Service:

- `services/core-service/app/services/notification_service.py::send_access_request(...)`

## Backend Behavior

The endpoint requires authentication through `get_current_user`.

On success, `NotificationService.send_access_request(...)`:

1. Verifies the requester is active.
2. Finds one admin recipient.
3. Creates a `notifications` row with:
   - `type = access_request`
   - `title = Access Request`
   - message containing requester, target page, and optional message/context
   - `entity_type = user_profile`
   - `entity_id = requester user id`
4. Returns `{ "sent": true }`.

It does not mutate:

- permissions
- role permissions
- role assignments
- memberships
- feature flags
- navigation config

## Recipient Targeting

Current recipient priority:

1. Organization Owner/Admin in any organization where the requester has an active organization-scoped role assignment.
2. Platform Owner/Admin.
3. Any active Superuser.

If no recipient is found, the request fails safely with `404` and no access-request notification is created.

Workspace/project-specific recipient targeting is not implemented yet. A workspace/project restricted request may still route to an org/platform/superuser recipient based on the current requester role assignments.

## Notification Behavior

Access-request notifications are normal Core notifications.

- They appear through `GET /api/v1/notifications` for the recipient.
- They can be marked read through `PATCH /api/v1/notifications/{id}/read`.
- They can be deleted through `DELETE /api/v1/notifications/{id}`.
- The notification target is `entity_type=user_profile`, `entity_id=<requester id>`, which avoids routing the recipient directly into a restricted page.

No dedicated admin access-request inbox exists yet.

## Permission Safety Statement

Certified intent:

- Request Access does not grant access.
- Request Access does not auto-assign roles.
- Request Access does not alter role-permission mappings.
- Request Access does not approve itself.
- Backend permissions remain the source of truth.
- The requester remains denied until an authorized admin explicitly changes role/permission assignments through existing RBAC flows.

## Test Matrix

Backend fixture added:

`services/core-service/tests/test_access_request_certification.py`

| Case | Coverage |
|---|---|
| Auth required | Unauthenticated access-request request is rejected. |
| Valid org request | Authenticated organization member can submit a request and the org owner receives a notification. |
| Context preservation | Notification message preserves page, nav item, nav key, and missing permission context sent in the message. |
| No access grant | Effective permissions and role assignment count are unchanged after request. |
| Platform fallback | If no org admin applies, a platform admin/owner can receive the request. |
| No recipient | If the requester is the only admin/superuser and no other recipient exists, the request fails with 404 and creates no notification. |
| Duplicate behavior | Duplicate requests are currently allowed and create separate notifications. |

Validation attempted on 2026-08-14:

- `cd services/core-service && python3 -m pytest tests/test_access_request_certification.py -vv` blocked because local Python has no `pytest` installed.
- `cd services/core-service && python3 -m pytest tests/test_app_imports.py -vv` blocked because local Python has no `pytest` installed.
- Syntax compile passed via `PYTHONDONTWRITEBYTECODE=1 compile(...)` for `tests/test_access_request_certification.py`.

## Frontend Certification Notes

No additional frontend code changes were required in this certification pass beyond the existing locked-nav Step 8 implementation.

Current frontend behavior is acceptable for v1 because the backend schema only supports `page` and `message`, and the locked-navigation modal sends rich context in the message.

Frontend gaps:

- `sendAccessRequest` has no typed fields for `scope_type`, `scope_id`, `permission_codes`, `nav_key`, `route`, or `item_label` because the backend schema does not expose them yet.
- Restricted page `RequestAccessButton` sends page plus user message only; it does not automatically include permission-code context.

## Known Gaps

- No full approval workflow exists yet.
- No dedicated admin access-request inbox exists yet.
- No dedupe/rate-limit/spam suppression exists yet; duplicate requests create duplicate notifications.
- Backend schema does not model structured request context beyond `page` and `message`.
- Workspace/project-specific recipient routing is not implemented yet.
- Notification text is useful but not structured for reporting/search beyond the message body.
- Access request does not write an activity/audit event today; normal notification read/delete operations do log activity.

## Manual QA Checklist

Locked navigation request:

1. Login as lower-permission Organization Member.
2. Enable `core.navigation_config.enabled` only for locked-navigation QA.
3. Configure Organization Member / Organization mode / Members = `show_locked_if_denied`.
4. Click locked Members.
5. Confirm modal opens.
6. Submit access request.
7. Confirm user sees success feedback.
8. Login as Org Owner/Admin.
9. Confirm notification appears.
10. Open notification.
11. Confirm notification context is understandable.
12. Confirm no permission was granted automatically.
13. Confirm Organization Member still cannot access Members until role/permission is explicitly changed.

Restricted page request:

1. Login as a user lacking a page permission.
2. Open a restricted Settings page.
3. Click Request Access.
4. Submit a short message.
5. Confirm success feedback.
6. Login as the target admin.
7. Confirm notification appears and references the restricted page.
8. Confirm no permission/role assignment changed automatically.

## Go / No-Go Criteria

Go for current certification when:

- Access request tests pass in a dependency-complete environment.
- Manual QA confirms locked nav and restricted page entry points create notifications.
- Manual QA confirms no automatic access change.
- Duplicate notification behavior is accepted or a future dedupe task is scheduled.

No-go for expanding rollout if:

- Request submission mutates permissions or roles.
- Notification recipient cannot understand the requested route/context.
- Locked navigation becomes clickable or navigates to restricted pages.
- Feature flag false baseline changes.
