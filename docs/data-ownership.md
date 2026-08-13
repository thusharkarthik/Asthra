# Asthra Data Ownership

Each Asthra service owns its data. Ownership includes schema design, persistence rules, migrations, tests, and API contracts.

## Rules

- No direct cross-service database access.
- No cross-service SQL joins.
- No shared business tables across services.
- Shared packages must not define business models.
- Services expose data through APIs or future event streams.

## Source of Truth

- `core-service`: users, organizations, workspaces, teams, memberships, roles, permissions, projects.
- `flow-service`: work items, boards, labels, comments, attachments metadata.
- `docs-service`: spaces, pages, page versions, comments, tags, attachments metadata.
- `ai-service`: providers, prompt templates, conversations, request logs.
- `memory-service`: knowledge sources, documents, chunks, embedding records, retrieval logs.
- `event-service`: event records, subscriptions, delivery logs.

## Replication and Denormalization

Future services may store copied identifiers or snapshots for performance, reporting, or audit reasons. Those copies must be treated as derived data unless ownership is explicitly moved by an ADR.
