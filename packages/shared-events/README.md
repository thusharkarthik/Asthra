# Asthra Shared Events

`packages/shared-events` defines the platform event naming and envelope contract used by Asthra services.

The package is intentionally lightweight. It does not publish to Kafka, RabbitMQ, Redis Streams, or any external broker.

## Naming Convention

Events use dot notation:

- `core.organization.created`
- `core.workspace.created`
- `flow.work_item.created`
- `docs.page.updated`
- `ai.completion.generated`
- `memory.document.chunked`
- `automation.workflow.executed`

Recommended format:

```text
<service-domain>.<entity>.<action>
```

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
