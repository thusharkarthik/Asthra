# ADR 0003: API Gateway

## Status

Accepted

## Context

Frontend and client traffic need a stable platform entry point. Directly exposing every service to clients would scatter routing, auth forwarding, request IDs, and future policy enforcement.

## Decision

Introduce `api-gateway` as the future client entry point. The MVP provides health, readiness, service registry, request IDs, and selected proxy routes.

## Consequences

- Frontend clients can eventually target one gateway surface.
- Auth validation, rate limits, service discovery, and routing policies can centralize later.
- Existing services remain independently runnable.
- Gateway routing must avoid hiding service ownership boundaries.
