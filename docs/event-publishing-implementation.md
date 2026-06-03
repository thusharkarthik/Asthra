# Asthra Event Publishing Implementation

Phase 2 adds fail-safe event publishing helpers to selected services. Event Service is not mandatory.

## Current Event Publishers

| Service | Events |
| --- | --- |
| core-service | `core.organization.created`, `core.workspace.created`, `core.project.created` |
| flow-service | `flow.work_item.created`, `flow.work_item.updated` |
| docs-service | `docs.page.created`, `docs.page.updated` |
| ai-service | `ai.completion.generated` |
| memory-service | `memory.document.created`, `memory.document.chunked` |

## No-Op Behavior

Publishing is disabled by default.

If `EVENT_PUBLISHING_ENABLED=false`, `EVENT_SERVICE_URL` is empty, or `shared-events` is not installed, the helper returns a no-op response and the main business action continues.

If publishing fails, the helper catches the exception and returns a safe failure result. Business actions still succeed.

## Configuration

Selected services now support:

```text
EVENT_SERVICE_URL=
EVENT_PUBLISHING_ENABLED=false
```

For Docker Compose, the future internal URL is:

```text
EVENT_SERVICE_URL=http://event-service:8000
```

## Current Limits

- Event publishing is synchronous when enabled.
- There are no retries yet.
- Event Service is not a hard dependency.
- No automation triggers consume these events yet.

## Future Roadmap

- shared event publisher adoption across all services
- request and correlation ID propagation into event envelopes
- retry queue
- broker-backed delivery using Kafka, RabbitMQ, or Redis streams
- automation trigger subscriptions
- AI indexing subscriptions
