# Asthra Shared Utils

`packages/shared-utils` contains lightweight, business-agnostic utility helpers for Asthra services.

## Purpose

The package provides reusable helpers for:

- UTC datetime generation
- ISO datetime formatting
- string normalization
- slug generation
- UUID generation
- safe JSON serialization/deserialization
- simple validation
- limit/offset clamping

## Utility Rules

- Keep helpers small.
- Use only the Python standard library unless a dependency is clearly justified.
- Keep functions deterministic where possible.
- Avoid service-specific assumptions.
- Avoid hidden network, database, or filesystem behavior.

## What Belongs Here

- Generic string helpers.
- Generic datetime helpers.
- Generic ID helpers.
- Generic JSON helpers.
- Generic validation helpers.

## What Must Not Belong Here

- Business logic.
- Service-specific domain behavior.
- Authorization rules.
- Database access.
- API calls.
- AI, RAG, automation, or cache behavior.

## Future Adoption Plan

Services can adopt this package later by:

1. Adding `asthra-shared-utils` as a local dependency.
2. Replacing duplicated utility helpers where safe.
3. Keeping endpoint behavior unchanged.
4. Expanding tests before replacing service-local helpers.
