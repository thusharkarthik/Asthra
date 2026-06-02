# Asthra Tracing Roadmap

Tracing is placeholder-only today. The current shared package provides a small span object so code can be structured around tracing concepts without introducing OpenTelemetry yet.

## Current Foundation

- `TraceSpan`
- `start_trace_span()`
- request and correlation ID helpers

## Future OpenTelemetry Adoption

Asthra should add OpenTelemetry after the API Gateway, Event Service, and service boundaries are stable.

Trace spans should cover:

- API Gateway inbound requests
- downstream service proxy calls
- service database operations
- event publish and delivery attempts
- AI provider calls
- memory chunking and embedding work
- future automation executions

## Trace Context

Trace context should preserve:

- request ID
- correlation ID
- source service
- route or operation name
- entity type and ID when safe

## Rules

- Do not add vendor-specific tracing code inside business logic.
- Keep tracing wrappers near infrastructure boundaries.
- Avoid recording secrets, raw prompts, JWTs, API keys, or private document contents.
