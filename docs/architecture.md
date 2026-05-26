# Asthra Architecture

Asthra uses a monorepo structure with clear boundaries between applications, backend services, shared packages, infrastructure, scripts, and documentation.

## Directory Model

- `apps/`: user-facing web applications.
- `services/`: backend service boundaries for each suite area.
- `packages/`: reusable shared code, configuration, schemas, auth helpers, database utilities, and API clients.
- `infrastructure/`: Docker, nginx, deployment, and monitoring assets.
- `docs/`: product and engineering documentation.
- `scripts/`: repeatable local or operational commands.

## Backend Direction

Backend implementation starts with `services/core-service` in Level 2. It should use FastAPI, SQLAlchemy, Alembic, Pydantic schemas, and JWT authentication.

Other services remain structural placeholders until their tiers are scheduled.

## Boundary Principles

- Keep suite services independent at the module boundary.
- Share code through `packages/` only when reuse is clear.
- Avoid speculative implementation.
- Keep docs updated as structure changes.
