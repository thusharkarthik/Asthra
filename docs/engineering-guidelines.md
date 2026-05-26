# Engineering Guidelines

Asthra development should stay incremental, modular, and documentation-led.

## Current Rules

- Follow the tier roadmap.
- Keep changes small and controlled.
- Do not implement backend code during the structure and documentation stage.
- Do not add RAG, agents, automation, or AI features until explicitly requested.
- Keep reusable code inside `packages/`.
- Update documentation when structure or standards change.

## Backend Expectations

When Level 2 begins, backend services should use clean FastAPI structure with separate modules for API routes, settings, database access, models, schemas, services, and tests.

## Quality Expectations

- Prefer explicit boundaries over broad shared abstractions.
- Keep naming aligned with Asthra suite terminology.
- Add tests with implementation work.
- Avoid committing local secrets, virtual environments, build outputs, or local databases.
