# Asthra Shared Observability

`packages/shared-observability` contains lightweight helpers for platform observability standards.

It is intentionally small and does not integrate Prometheus, OpenTelemetry, log collectors, or external observability vendors yet.

## Includes

- request ID helpers
- correlation ID helpers
- in-memory metrics abstraction
- tracing placeholder spans
- health aggregation helpers
- simple logging configuration

## Does Not Include

- production metrics scraping
- distributed tracing exporters
- vendor SDKs
- service business logic
- alerting rules

## Test

```bash
python -m pytest tests -q
```

## Adoption Plan

Services should adopt these helpers later, starting with API Gateway request tracking, then service logging, then metrics and tracing once production observability requirements are clear.
