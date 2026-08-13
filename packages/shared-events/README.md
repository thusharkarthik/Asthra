# Asthra Shared Events

`packages/shared-events` defines the platform event naming, envelope contract, validation helpers, and lightweight event client for Asthra services.

The package is intentionally lightweight. It does not implement Kafka, RabbitMQ, Redis Streams, background workers, or external delivery.

## Modules

- `shared_events.envelope`: event envelope model and builder.
- `shared_events.constants`: common platform event names.
- `shared_events.naming`: dot-notation validation.
- `shared_events.validators`: validation exports.
- `shared_events.client`: optional `EventClient` for future Event Service publishing.

## Naming Convention

Events use dot notation:

```text
<service-domain>.<entity>.<action>
```

Current constants include:

- `core.organization.created`
- `core.workspace.created`
- `core.project.created`
- `flow.work_item.created`
- `flow.work_item.updated`
- `docs.page.created`
- `docs.page.updated`
- `ai.completion.generated`
- `memory.document.created`
- `memory.document.chunked`
- `discover.idea.created`
- `desk.ticket.created`
- `pulse.incident.created`
- `automation.workflow.executed`

## Event Envelope

Every event should include:

- `event_id`
- `event_name`
- `source_service`
- `workspace_id`
- `organization_id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `payload`
- `occurred_at`
- `correlation_id`
- `request_id`

Example:

```python
from shared_events import EventNames, build_event_envelope

event = build_event_envelope(
    event_name=EventNames.CORE_PROJECT_CREATED,
    source_service="core-service",
    workspace_id=1,
    entity_type="project",
    entity_id="10",
    payload={"name": "Launch"},
)
```

## Event Client

`EventClient` supports no-op mode when no Event Service URL is configured:

```python
from shared_events import EventClient

client = EventClient()
result = client.publish_event(event)
```

No-op result:

```json
{"success": true, "published": false, "mode": "noop", "error": null}
```

When `event_service_url` is set and `httpx` is available, the client posts to:

```text
/api/v1/events
```

Services should adopt this later during service integration work. Existing services are not required to publish events yet.

## Test

```bash
python -m pytest tests -q
```
