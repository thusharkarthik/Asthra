# Asthra Observability Strategy

Asthra observability will mature in phases. The current foundation gives services a common vocabulary for request tracking, health, logs, metrics, and future traces without committing to Prometheus, OpenTelemetry, or a vendor.

## Current Foundation

- `packages/shared-observability` provides lightweight helpers.
- Every service exposes `/health` and `/ready`.
- Docker Compose provides local container logs.
- The API Gateway is the future entry point for request ID and correlation ID propagation.

## Request IDs

Every inbound request should have an `X-Request-ID`.

- If a client provides one, the gateway should forward it.
- If missing, the gateway or entry service should generate one.
- Downstream service calls should preserve the same request ID.
- Error responses should include the request ID where practical.

## Correlation IDs

`X-Correlation-ID` groups related operations that may span multiple requests, events, and future background jobs.

Examples:

- a user action that creates a project and emits events
- a workflow execution that updates several services
- a future AI indexing flow that chunks, embeds, and stores documents

## Metrics Strategy

The current metrics abstraction records counters and gauges in memory for tests and service-level conventions. Future production metrics should include:

- request count by service, route, method, and status code
- request latency by service and route
- error count by service and error code
- readiness state by service
- event delivery status
- AI request token usage and latency

## Tracing Strategy

Tracing is placeholder-only today. Future tracing should use OpenTelemetry spans around:

- inbound HTTP requests
- downstream service calls
- event publishing and delivery
- database calls
- AI provider calls
- future background jobs

## Dashboard Strategy

Initial dashboards should cover:

- service health and readiness
- request volume
- error rate
- p95 latency
- event delivery health
- database readiness
- AI provider latency and token usage

## Adoption Plan

1. Keep current service-specific logging and health endpoints stable.
2. Adopt shared request/correlation ID helpers in the API Gateway first.
3. Add shared logging conventions to services.
4. Add Prometheus/OpenTelemetry only after the platform surface is stable.
