# Database Design

Asthra persistence begins in Level 2 with the core service foundation.

## Direction

- Use SQLAlchemy for ORM models and database access.
- Use Alembic for schema migrations.
- Keep database ownership aligned with service boundaries.
- Start with core platform records before adding suite-specific data.

## Level 2 Core Entities

The first database design pass will cover:

- Users.
- Organizations.
- Workspaces.
- Teams.
- Roles.
- Projects.
- Activity logs.

## Deferred Data Systems

Vector stores, AI memory stores, automation history, analytics warehouses, and integration sync stores are deferred until their roadmap tiers.
