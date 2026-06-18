# Flow Audit Trail

## Scope

Flow now records project and work-item audit events for traceability across common execution actions:

- work item created, updated, and archived
- status, priority, assignee, and due date changes
- comments added, edited, and deleted
- attachments uploaded and deleted
- work item relations added and removed
- cross-module links linked and unlinked

## Backend API

Project feed:

```http
GET /api/v1/audit-events
```

Work item feed:

```http
GET /api/v1/work-items/{work_item_id}/audit-events
```

Supported filters:

- `project_id`
- `work_item_id`
- `actor_id`
- `action`
- `created_from`
- `created_to`
- `search`
- `limit`
- `offset`

## Frontend Experience

Work item detail includes an **Audit Trail** section showing actor, action, timestamp, and before/after values.

Flow project activity is available at:

```text
/flow/activity
```

The activity page groups events by day and supports search plus action and actor filters.

## Remaining Gaps

- Actor display uses `actor_name` when present, otherwise falls back to user ID.
- Workspace ID is nullable until Flow receives workspace context from Core/API Gateway consistently.
- Audit events are stored locally in Flow; platform-wide aggregation should later use Event Service.
