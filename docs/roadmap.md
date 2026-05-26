# Asthra Roadmap

Asthra is built in tiers so the platform foundation stays stable before higher-level intelligence and workflow capabilities are added.

## Level 0: Monorepo Foundation

Status: in progress

- Establish app, service, package, infrastructure, docs, and script boundaries.
- Add root project files.
- Keep directories ready for future implementation without adding runtime code.

## Level 1: Documentation and Standards

Status: in progress

- Define the suite map.
- Document architecture direction.
- Document API, database, and engineering standards.
- Keep all implementation decisions aligned with the product direction.

## Level 2: Core Service Foundation

Status: not started

Planned scope:

- FastAPI `services/core-service`.
- Users, organizations, workspaces, teams, roles, projects, and activity logs.
- SQLAlchemy persistence.
- Alembic migrations.
- JWT authentication.

## Deferred Scope

The following remain out of scope until explicitly scheduled:

- RAG.
- Agents.
- Automation runtime.
- AI memory implementation.
- Advanced analytics.
- Production integrations.
