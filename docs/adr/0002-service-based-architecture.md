# ADR 0002: Service-Based Architecture

## Status

Accepted

## Context

Asthra spans work management, documentation, AI, memory, service management, reliability, developer visibility, governance, analytics, media, integrations, collaboration, and automation. These domains have different data models and scaling paths.

## Decision

Use service boundaries for each major Asthra suite area. Each service owns its domain, models, tests, API, and persistence.

## Consequences

- Teams can reason about domain boundaries.
- Services can mature independently.
- Cross-service workflows need explicit APIs or events.
- Direct database access across services is not allowed.
