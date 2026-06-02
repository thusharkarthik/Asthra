# Asthra Service Communication

Asthra service communication will mature in phases.

## Current Phase

- Services expose REST APIs.
- Docker Compose provides local service discovery by container name.
- API Gateway supports selected proxy routes.
- Event Service stores events and placeholder delivery logs.

## Future Direction

- Frontend clients should use API Gateway.
- Services may use internal APIs for synchronous reads or commands.
- Services should use Event Service for asynchronous domain events.
- Shared auth context should be propagated from Core through Gateway and service-to-service calls.

## Rules

- Prefer APIs for request/response workflows.
- Prefer events for activity streams, analytics, automation triggers, cache invalidation, and AI indexing.
- Do not use direct database access for cross-service communication.
- Keep service communication observable with request IDs and correlation IDs.
