# Asthra Event Adoption Plan

Event publishing is not wired into all services yet. Phase 2 defines the event adoption path so future integration is staged and safe.

## Publishing Pattern

Services should publish events through `shared-events` using a no-op mode when `EVENT_SERVICE_URL` is missing.

Basic flow:

1. Complete local transaction.
2. Build an event envelope.
3. Publish to Event Service.
4. Log publish failure without rolling back the already completed business operation.

## Event Envelope

Events should use:

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

## Initial Events By Service

| Service | Events To Publish Later |
| --- | --- |
| core-service | `core.organization.created`, `core.workspace.created`, `core.project.created` |
| flow-service | `flow.work_item.created`, `flow.work_item.updated` |
| docs-service | `docs.page.created`, `docs.page.updated` |
| ai-service | `ai.completion.generated` |
| memory-service | `memory.document.created`, `memory.document.chunked` |
| discover-service | `discover.idea.created` |
| desk-service | `desk.ticket.created` |
| pulse-service | `pulse.incident.created` |
| automation-service | `automation.workflow.executed` |
| connect-service | `connect.integration.created`, `connect.webhook.received` |
| guard-service | `guard.audit_event.created`, `guard.risk_finding.created` |
| insights-service | `insights.metric_snapshot.created`, `insights.report_run.created` |
| media-service | `media.asset.created`, `media.processing_job.created` |

## Failure Handling

- Event publishing failures should be logged.
- Business writes should not fail solely because event delivery failed in the MVP.
- Event Service delivery logs remain placeholders until async broker support exists.

## Future Async Broker Plan

Later phases can introduce:

- Kafka, RabbitMQ, or Redis streams
- durable retry queues
- background delivery workers
- dead-letter queues
- event replay
- automation trigger subscriptions
- AI indexing subscriptions
