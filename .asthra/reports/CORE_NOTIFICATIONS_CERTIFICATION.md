# Core Notifications Certification

Date: 2026-08-14

## Purpose

This report certifies the current Core notification system because Access Request and feature-flagged locked navigation now depend on it. Notifications are communication and visibility only. They must not grant access, assign roles, or bypass RBAC.

## Current Notification Architecture

Backend-owned files:
- `services/core-service/app/models/notification.py`
- `services/core-service/app/schemas/notification.py`
- `services/core-service/app/repositories/notification_repository.py`
- `services/core-service/app/services/notification_service.py`
- `services/core-service/app/api/v1/notifications.py`

Model fields:
- `user_id`
- optional `organization_id`, `workspace_id`, `project_id`
- `type`
- `title`
- `message`
- optional `entity_type`, `entity_id`
- `is_read`, `read_at`
- timestamp mixin fields `created_at`, `updated_at`

Repository ownership rule:
- Reads and read/delete mutations use `Notification.user_id == current_user.id`.
- A user cannot list, read, mark, or delete another user's notification through the API.

## Backend API Behavior

Endpoints:
- `POST /api/v1/notifications/access-request`
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/{notification_id}`
- `PATCH /api/v1/notifications/{notification_id}/read`
- `PATCH /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/{notification_id}`

Filtering supported by list:
- `is_read`
- `type`
- `organization_id`
- `workspace_id`
- `project_id`
- `limit`
- `offset`

List order is newest first by `created_at desc`.

Mark-read behavior:
- Marking an own notification read returns the notification with `is_read=true` and `read_at` set.
- Repeating mark read is effectively idempotent and remains a safe success.
- Mark all read only updates unread notifications for the current user and returns `{ "updated": count }`.

## Frontend UI Behavior

Frontend-owned files inspected:
- `frontend/src/layouts/asthra-shell.tsx`
- `frontend/src/components/platform/notification-center.tsx`
- `frontend/src/stores/notification-store.ts`
- `frontend/src/services/api/settings-api.ts`
- `frontend/src/types/core.ts`
- `frontend/src/app/settings/notifications/page.tsx`

Shell behavior:
- `AsthraShell` fetches Core notifications with query key `["core", "notifications"]` while authenticated.
- The bell count is local persisted unread notifications plus unread Core notifications.
- The query disables aggressive refetch-on-mount/window-focus/reconnect and uses `staleTime: 60_000`.

Popover behavior:
- `NotificationCenter` fetches Core notifications with the same query key when opened, so React Query can share cache with the shell badge.
- Mark one read invalidates `["core", "notifications"]`.
- Mark all read is rendered only when at least one local or Core notification is unread.
- Mark all read updates local notifications and calls Core `PATCH /notifications/read-all` when authenticated.
- Delete/dismiss invalidates Core notification cache for server notifications.
- Empty state renders `No notifications yet.`

Local notification store:
- `frontend/src/stores/notification-store.ts` still contains persisted local seed/demo notifications. These are separate from Core notifications and are included in the bell count/popover. This is not a Core backend defect, but it can make manual unread-count QA look higher than server-only counts.

## Access Request Integration

Access Request endpoint:
- `POST /api/v1/notifications/access-request`

Backend service:
- Ensures the requester is active.
- Chooses a recipient in priority order:
  1. organization owner/admin in one of the requester's organization role scopes
  2. platform owner/admin
  3. active superuser fallback
- Creates a notification with:
  - `type = access_request`
  - `title = Access Request`
  - message containing requester, requested page, and optional message/context
  - `entity_type = user_profile`
  - `entity_id = requester user id`
- Does not mutate permissions, role assignments, memberships, feature flags, or navigation config.

Locked navigation uses the same access-request endpoint and packs nav item, nav key, mode, role, and missing permissions into the message body.

## Target / Link Behavior

Backend notifications store generic `entity_type` and `entity_id`. They do not store a dedicated `href` field today.

Frontend `notificationHref(...)` maps known entities to routes:
- organization -> `/settings/organizations/:id`
- workspace -> `/settings/workspaces/:id`
- project -> `/settings/projects/:id`
- user_profile -> `/settings/members/:id`
- member/invitation/member scopes -> `/settings/members`
- role/permission/role_assignment -> `/settings/access-control`
- flow/docs/discover/desk/pulse entities -> their module detail routes

Click behavior:
- Clicking a Core notification marks it read.
- If a mapped route exists, the popover closes and navigates.
- If no mapped route exists, it only marks read and does not crash.

Safety statement:
- Target navigation is UX only. It does not bypass frontend route gates or backend API RBAC.
- Access-request notifications route to the requester profile by `user_profile`, not directly into an approval action.

## Recipient Isolation

Certified behavior:
- Users list only notifications where `notifications.user_id == current_user.id`.
- `GET /notifications/{id}`, `PATCH /notifications/{id}/read`, and `DELETE /notifications/{id}` use the same ownership guard.
- `PATCH /notifications/read-all` only updates the current user's unread notifications.

## Permission Safety Statement

Notifications do not grant access.

Certified non-mutations:
- no role assignment creation
- no role-permission changes
- no permission records changed
- no membership changes
- no feature flag changes
- no navigation config changes

Access remains denied until an authorized admin changes RBAC through existing Settings Access Control/member flows.

## Test Matrix

Backend fixture added:

`services/core-service/tests/test_notifications_certification.py`

| Area | Coverage |
|---|---|
| Auth required | List, mark read, and mark all reject unauthenticated requests. |
| Empty state | No notifications returns empty list and unread filtered list is empty. |
| Recipient isolation | User sees only own notifications and cannot mark another user's notification read. |
| Listing | Newest-first ordering and expected fields are returned. |
| Mark read | Own notification mark-read works and repeated mark-read is safe. |
| Unread count | Unread filtered list count decrements after mark-read and becomes zero after mark-all. |
| Mark all | Only current user's notifications are marked read. |
| Access request | Notification type/context are preserved and no permissions/role assignments mutate. |

## Manual QA Checklist

1. Login as lower-permission Organization Member.
2. Submit access request through locked nav.
3. Confirm success feedback.
4. Login as Org Owner/Admin.
5. Confirm unread notification count increases.
6. Open notification menu/list.
7. Confirm access request notification appears.
8. Confirm message is understandable.
9. Click notification.
10. Confirm it marks read.
11. Confirm unread count decreases.
12. Click Mark all as read if more unread exist.
13. Confirm count becomes zero.
14. Confirm Mark all is hidden/disabled when zero unread.
15. Login as another user.
16. Confirm they do not see the first user's notifications.
17. Confirm no permissions/roles changed from notifications.

## Known Gaps

- No realtime/websocket notification delivery.
- No email or push notification delivery.
- No full notification center page; Settings -> Notifications is still a preferences placeholder.
- No dedicated admin access-request inbox or approval workflow.
- Access request context is message text, not structured backend fields.
- No dedupe/rate limit for repeated access requests.
- Target validation is basic entity-type mapping in frontend; backend does not store a canonical `href`.
- Local persisted demo notifications can affect the shell unread badge independently of Core server notifications.

## Go / No-Go Criteria

Go for continued Core certification when:
- Backend tests pass in a dependency-complete environment.
- Browser QA confirms list/read/mark-all behavior.
- Access Request notifications are understandable to org/platform admins.
- Notification clicks mark read and do not bypass RBAC.
- No role or permission mutations occur from notification actions.

No-go for deeper locked-navigation rollout if:
- Users can see or mutate other users' notifications.
- Access Request grants access automatically.
- Notification targets bypass Settings route gates or backend authorization.
- Mark-read/mark-all breaks unread count refresh.
