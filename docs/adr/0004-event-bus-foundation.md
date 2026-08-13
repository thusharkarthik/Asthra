# ADR 0004: Event Bus Foundation

## Status

Accepted

## Context

Asthra will need asynchronous workflows for notifications, activity, automation triggers, analytics, cache invalidation, and AI indexing. A full broker is premature during foundation development.

## Decision

Introduce `event-service` and `packages/shared-events` as the event foundation. Store event envelopes, subscriptions, and placeholder delivery logs without Kafka, RabbitMQ, Redis Streams, or workers.

## Consequences

- Services get a stable event envelope and naming convention.
- Future broker-backed delivery can be added behind a known contract.
- Current behavior is simple and testable.
- Events are not yet a real-time delivery mechanism.
