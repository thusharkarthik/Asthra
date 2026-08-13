# Asthra Event-Driven Architecture

Asthra Event Bus is the future backbone for asynchronous platform workflows.

## Current Foundation

`event-service` stores event envelopes, subscriptions, and placeholder delivery logs. `packages/shared-events` defines event names, envelope helpers, and a no-op capable event client.

## Event Uses

- notifications
- activity logs
- automation triggers
- analytics
- cache invalidation
- AI indexing
- cross-service workflow coordination

## Rules

- Event names use dot notation: `<domain>.<entity>.<action>`.
- Events must include source service, entity context, payload, and request/correlation context when available.
- Services should not rely on events for immediate transactional consistency.
- No broker is implemented yet.

## Future Roadmap

Future work may add Kafka, RabbitMQ, Redis Streams, async workers, retry queues, and dead-letter handling.
