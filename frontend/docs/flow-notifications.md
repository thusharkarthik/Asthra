# Flow Notifications

## Purpose

Flow notifications surface work item events that need attention without requiring realtime infrastructure.

## Events

Notifications are created when:

- a work item is assigned
- a comment is added
- status changes
- priority changes
- due date changes

## API

The frontend uses:

```text
GET /api/flow/api/v1/notifications
PATCH /api/flow/api/v1/notifications/{id}/read
PATCH /api/flow/api/v1/notifications/read-all
DELETE /api/flow/api/v1/notifications/{id}
```

## UI

Flow notifications are available at:

```text
/flow/notifications
```

The Flow sub-navigation shows an unread count for the selected project. The page supports marking one notification read, marking all project notifications read, and deleting a notification.

## Manual Test

1. Open a work item.
2. Change its status, priority, assignee, or due date.
3. Add a comment.
4. Open `/flow/notifications`.
5. Verify notifications appear.
6. Mark one notification read.
7. Mark all notifications read.
8. Delete a notification.

## Current Gaps

- Notifications are polling/query based, not realtime.
- `workspace_id` is nullable until Flow receives workspace context directly.
- Delivery preferences and email/push notifications are not implemented yet.
