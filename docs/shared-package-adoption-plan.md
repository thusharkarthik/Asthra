# Asthra Shared Package Adoption Plan

Shared packages should be adopted gradually. Phase 2 does not refactor every service.

## Packages

| Package | Adoption Target |
| --- | --- |
| shared-platform | response helpers, errors, pagination |
| shared-auth | forwarded auth headers and lightweight user context |
| shared-events | event envelope and no-op publishing client |
| shared-config | env parsing and service config helpers |
| shared-db | DB session and health helper patterns |
| shared-schemas | generic response, health, and status schemas |
| shared-utils | datetime, JSON, strings, ID helpers |
| shared-observability | request IDs, correlation IDs, metrics, tracing placeholders |

## Staged Adoption

1. API Gateway adopts request tracking and auth header forwarding standards.
2. Services adopt shared config helpers in new work only.
3. Services adopt shared response/error helpers one endpoint group at a time.
4. Services adopt shared-events for selected high-value events.
5. Services adopt shared-observability for logs and request context.
6. DB helpers are adopted only where they reduce duplication without changing model ownership.

## Rules

- Do not move business schemas into shared packages.
- Do not move service models into shared packages.
- Do not change service database ownership.
- Do not refactor entire services only for style.
- Keep adoption focused on new or actively touched code.

## First Recommended Adoptions

- API Gateway: `shared-observability`, `shared-auth`
- Event Service publishers: `shared-events`
- New service docs/tests: `shared-schemas`, `shared-utils`
