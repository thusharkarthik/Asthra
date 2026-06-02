# Asthra Performance Layer Plan

Asthra does not currently implement Redis, cache invalidation, or advanced performance infrastructure.

## Current State

- Services use local SQLite for foundation development.
- Docker Compose runs one container per service.
- No cache layer exists yet.
- No broker-backed invalidation exists yet.

## Future Performance Layer

Future work may introduce:

- Redis or compatible cache
- API Gateway response caching
- service-local read caches
- event-driven cache invalidation
- background job coordination
- rate limiting and quota counters

## Rules

- Do not add caching before ownership and invalidation rules are clear.
- Cache must not become source of truth.
- Cache keys must include tenant/workspace scope where needed.
- Event Service should eventually support invalidation events.
