# ADR 0001: Monorepo

## Status

Accepted

## Context

Asthra contains many services and shared packages that are being built together during the foundation phase. Coordinating contracts, docs, Docker setup, and shared utilities across separate repositories would slow early platform development.

## Decision

Use a monorepo with `services/`, `packages/`, `docs/`, `scripts/`, and infrastructure files in one repository.

## Consequences

- Shared standards and service foundations can evolve together.
- Cross-service docs and local orchestration are easier to maintain.
- CI and ownership rules must keep service boundaries clear.
- The monorepo must not become permission to blur data ownership.
