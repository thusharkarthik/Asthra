# Asthra Metrics Roadmap

Asthra does not integrate Prometheus or a vendor yet. The current shared package defines a minimal metrics abstraction so services can align on names and behavior before production instrumentation.

## Current Metrics Foundation

- in-memory `MetricRecorder`
- counters
- gauges
- snapshots for tests and local inspection

## Platform Metrics To Add Later

- `http_requests_total`
- `http_request_duration_ms`
- `http_errors_total`
- `service_ready`
- `database_ready`
- `event_records_total`
- `event_delivery_failures_total`
- `ai_requests_total`
- `ai_tokens_total`

## Service Metrics

Each service should eventually expose metrics that describe its own domain without leaking business internals across service boundaries.

Examples:

- Flow: work items created
- Docs: pages updated
- Memory: documents chunked
- Event Service: delivery logs created
- Automation: workflow executions

## Dashboard Plan

The first dashboards should be operational:

- service status
- latency
- error rate
- event delivery health
- AI provider usage

Business analytics belongs in Insights, not in infrastructure metrics.
