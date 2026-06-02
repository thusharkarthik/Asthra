# Asthra Shared DB

`packages/shared-db` provides reusable database utilities for Asthra services.

## Purpose

The package standardizes low-level persistence helpers:

- SQLAlchemy engine creation
- session factory creation
- FastAPI-style DB dependency generation
- database health checks
- generic model mixins
- shared JSON type aliases

## What Belongs Here

- Common SQLAlchemy setup helpers.
- Common `created_at` and `updated_at` mixins.
- Generic primary key mixins.
- Generic soft-delete/activity flags.
- Database readiness helpers.

## What Must Not Belong Here

- Business models.
- Service-specific repository logic.
- Alembic migrations.
- Cross-service joins.
- Tenant-specific authorization rules.
- Production database credentials.

Each Asthra service owns its own models, schema boundaries, migrations, and data lifecycle.

## Adoption Plan

Services can adopt this package later by:

1. Adding `asthra-shared-db` as a local dependency.
2. Replacing local engine/session helpers where safe.
3. Using shared mixins for new models.
4. Keeping existing models stable unless a migration is explicitly planned.

## Service Database Ownership Rules

- Each service owns its database tables.
- Services should not import another service's SQLAlchemy models.
- Cross-service workflows should use APIs or future event bus messages.
- Shared DB utilities must stay generic and infrastructure-focused.
