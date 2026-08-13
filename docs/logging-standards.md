# Asthra Logging Standards

Asthra logs should be service-friendly, searchable, and safe. The current standard is intentionally lightweight and can run with plain Python logging.

## Required Fields

Logs should include:

- timestamp
- level
- service name
- module or logger name
- request ID when available
- correlation ID when available
- message

## Request Context

Services should preserve:

- `X-Request-ID` for a single request path
- `X-Correlation-ID` for related work across requests, events, and jobs

The API Gateway should become the primary place that creates missing IDs.

## Sensitive Data

Never log:

- passwords
- raw API keys
- JWTs
- provider API keys
- private documents or prompts unless explicitly redacted

## Local Development

During local Docker Compose development, container logs are the source of truth:

```bash
docker compose logs api-gateway
docker compose logs core-service
```

## Future Direction

Future production logging should add:

- structured JSON logs
- centralized collection
- retention policies through Guard
- log-based alerting
- trace ID linkage when OpenTelemetry is adopted
