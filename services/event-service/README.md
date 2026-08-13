# Asthra Event Service

Asthra Event Service is the platform event foundation for future notifications, activity logs, automation triggers, analytics, cache invalidation, AI indexing, and cross-service workflows.

This MVP stores events and subscriptions in SQLite and creates placeholder delivery logs. It does not use Kafka, RabbitMQ, Redis Streams, background workers, webhooks, or automation execution.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | service health |
| `GET` | `/ready` | database readiness |
| `GET` | `/api/v1/system/info` | service metadata |
| `POST` | `/api/v1/events` | publish event envelope |
| `GET` | `/api/v1/events` | list events |
| `GET` | `/api/v1/events/{event_id}` | get event by event id |
| `POST` | `/api/v1/subscriptions` | create subscription |
| `GET` | `/api/v1/subscriptions` | list subscriptions |
| `PATCH` | `/api/v1/subscriptions/{subscription_id}` | update subscription |
| `DELETE` | `/api/v1/subscriptions/{subscription_id}` | delete subscription |
| `GET` | `/api/v1/delivery-logs` | list placeholder delivery logs |

## Event Envelope

```json
{
  "event_id": "uuid-or-external-id",
  "event_name": "core.organization.created",
  "source_service": "core-service",
  "workspace_id": null,
  "organization_id": 1,
  "actor_user_id": 10,
  "entity_type": "organization",
  "entity_id": "1",
  "payload": {},
  "occurred_at": "2026-05-27T00:00:00Z",
  "correlation_id": null,
  "request_id": null
}
```

## Run

```bash
uvicorn app.main:app --reload
```

Docker Compose:

```bash
docker compose up --build event-service
```

## Tests

```bash
python -m pytest tests -q
```

## Future Work

- Kafka/RabbitMQ/Redis Streams adapter.
- Async delivery workers.
- Automation trigger integration.
- Cache invalidation events.
- AI indexing events.
- Event replay and dead-letter handling.
