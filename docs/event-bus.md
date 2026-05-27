# Asthra Event Bus

Asthra Event Bus is the platform event layer for future notifications, activity logs, automation triggers, analytics, cache invalidation, AI indexing, and cross-service workflows.

The current foundation is intentionally simple: events are validated, stored, and matched against active subscriptions. Matching subscriptions create placeholder delivery logs only. There is no Kafka, RabbitMQ, Redis Streams, async worker, webhook delivery, or automation execution.

## Event Envelope

Every event should use this envelope:

| Field | Description |
| --- | --- |
| `event_id` | globally unique event identifier |
| `event_name` | dot-notation event name |
| `source_service` | service that emitted the event |
| `workspace_id` | optional workspace context |
| `organization_id` | optional organization context |
| `actor_user_id` | optional actor user |
| `entity_type` | optional affected entity type |
| `entity_id` | optional affected entity id |
| `payload` | JSON payload |
| `occurred_at` | event occurrence time |
| `correlation_id` | optional cross-request correlation id |
| `request_id` | optional request id |

Example:

```json
{
  "event_id": "evt-001",
  "event_name": "core.organization.created",
  "source_service": "core-service",
  "workspace_id": null,
  "organization_id": 1,
  "actor_user_id": 10,
  "entity_type": "organization",
  "entity_id": "1",
  "payload": {"name": "Asthra"},
  "occurred_at": "2026-05-27T00:00:00Z",
  "correlation_id": null,
  "request_id": "req-001"
}
```

## Naming Conventions

Events use dot notation:

- `core.organization.created`
- `core.workspace.created`
- `flow.work_item.created`
- `docs.page.updated`
- `ai.completion.generated`
- `memory.document.chunked`
- `automation.workflow.executed`

Recommended structure:

```text
<service-domain>.<entity>.<action>
```

## Event Service Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/events` | validate and store an event envelope |
| `GET` | `/api/v1/events` | list stored events |
| `GET` | `/api/v1/events/{event_id}` | read one event |
| `POST` | `/api/v1/subscriptions` | create event subscription |
| `GET` | `/api/v1/subscriptions` | list subscriptions |
| `PATCH` | `/api/v1/subscriptions/{subscription_id}` | update subscription |
| `DELETE` | `/api/v1/subscriptions/{subscription_id}` | delete subscription |
| `GET` | `/api/v1/delivery-logs` | list placeholder delivery logs |

## Current MVP Behavior

- Stores events in SQLite.
- Stores subscriptions in SQLite.
- Supports exact event patterns, wildcard `*`, and prefix patterns like `core.*`.
- Creates placeholder `pending` delivery logs for matching active subscriptions.
- Does not deliver to external systems.

## Future Roadmap

- Kafka, RabbitMQ, or Redis Streams adapter.
- Background delivery workers.
- Retry queues and dead-letter handling.
- Automation trigger integration.
- Cache invalidation events.
- AI indexing events for Docs, Memory, and Intelligence.
- Cross-service workflow orchestration.
