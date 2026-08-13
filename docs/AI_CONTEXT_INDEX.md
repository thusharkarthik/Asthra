# Platform Context Index

Asthra platform context is split into root, frontend, service, and machine-readable files.

## Primary Context

- `AI_CONTEXT.md`: platform vision, hierarchy, lifecycle, ownership, architecture, development rules, current priorities, and constraints.

## Frontend Context

- `frontend/AI_CONTEXT.md`: routing strategy, layout strategy, scope selection, context providers, TanStack Query standards, permission guards, and shared UI patterns.

## Service Context Files

| Service | Context File | Ownership Boundary |
| --- | --- | --- |
| API Gateway | `services/api-gateway/AI_CONTEXT.md` | Gateway routes, service registry, request forwarding, health. |
| Core | `services/core-service/AI_CONTEXT.md` | Identity, membership, scope, roles, permissions. |
| Flow | `services/flow-service/AI_CONTEXT.md` | Work planning and execution. |
| Discover | `services/discover-service/AI_CONTEXT.md` | Opportunities, ideas, validation, roadmap. |
| Docs | `services/docs-service/AI_CONTEXT.md` | Knowledge spaces, pages, versions, comments. |
| Desk | `services/desk-service/AI_CONTEXT.md` | Tickets, requests, SLAs, support workflow. |
| Pulse | `services/pulse-service/AI_CONTEXT.md` | Health, capacity, incidents, metrics. |
| Dev | `services/dev-service/AI_CONTEXT.md` | Repositories, deployments, builds, pipelines. |
| Collab | `services/collab-service/AI_CONTEXT.md` | Discussions, mentions, reactions, notifications. |
| Automation | `services/automation-service/AI_CONTEXT.md` | Rules, triggers, actions, workflow runs. |
| Connect | `services/connect-service/AI_CONTEXT.md` | Integrations, OAuth connections, webhooks. |
| Insights | `services/insights-service/AI_CONTEXT.md` | Dashboards, reports, analytics. |
| Guard | `services/guard-service/AI_CONTEXT.md` | Audit logs, security events, compliance. |
| Media | `services/media-service/AI_CONTEXT.md` | Files, attachments, media metadata. |
| AI | `services/ai-service/AI_CONTEXT.md` | Intelligence orchestration foundation. |
| Memory | `services/memory-service/AI_CONTEXT.md` | Memory documents, chunks, embeddings, retrieval. |
| Event | `services/event-service/AI_CONTEXT.md` | Event envelopes, ingestion, persistence. |

## Supporting Architecture Docs

- `docs/platform-lifecycle.md`
- `docs/platform-ownership.md`
- `docs/service-map.md`
- `docs/event-catalog.md`
- `docs/architecture-rules.md`
- `docs/ui-rules.md`
- `docs/naming-conventions.md`

## Machine-Readable Context

- `.asthra/platform.json`
- `.asthra/services/*.json`

## Ownership Rules

- Core owns identity, membership, scope, roles, and permissions.
- No service directly owns users except Core.
- No direct database sharing between services.
- Services communicate through APIs.
- Future cross-service coordination uses events.
- Ownership boundaries must be respected.
