# Notification System

The Notification System provides in-app beta notifications without realtime delivery.

## Supported Types

- mentions
- comments
- work item updates
- approvals
- incidents
- AI assistant updates

## Contract

Notification item fields:

- `id`
- `type`
- `title`
- `message`
- `href`
- `unread`
- `created_at`

## API Gateway Endpoints

- `GET /api/platform/notifications`
- `PATCH /api/platform/notifications/{notification_id}/read`
- `DELETE /api/platform/notifications/{notification_id}`

## Frontend Behavior

- Top nav unread badge
- Notification dropdown
- Mark individual notification read when opened
- Mark all read

## Future Backend Direction

Future versions should use event-service and user preference storage. Realtime delivery is explicitly deferred.
