# Asthra

Asthra is an AI-native operating platform for work, engineering, knowledge, automation, collaboration, and intelligent workflows.

Asthra is an original platform with its own architecture, suite model, workflows, and long-term AI-first direction. The current repository contains the platform monorepo, backend service MVPs, shared packages, local Docker orchestration, developer tooling, governance docs, ADRs, and automated test foundations.

## Platform Overview

Asthra is organized around service-owned product and platform domains:

- Core identity and workspace foundation
- Work management
- Documentation and knowledge
- Product discovery
- Service management
- Incident and reliability workflows
- Engineering visibility
- Collaboration
- Integrations
- Governance
- Analytics
- Media metadata
- AI, memory, eventing, and API gateway foundations

## Current Architecture

- Monorepo with `services/`, `packages/`, `docs/`, `scripts/`, and infrastructure files.
- FastAPI service foundations.
- One Docker Compose service per backend boundary.
- SQLite local persistence for current MVP development.
- API Gateway foundation for future frontend/client entry.
- Event Bus foundation for future asynchronous workflows.
- Shared packages for platform utilities, auth helpers, events, schemas, config, DB helpers, test utilities, and API clients.

Architecture references:

- [Architecture Principles](docs/architecture-principles.md)
- [Service Boundaries](docs/service-boundaries.md)
- [Data Ownership](docs/data-ownership.md)
- [Service Communication](docs/service-communication.md)
- [ADR Index](docs/adr)

## Current Services

| Service | Suite Name | Port | Current Status |
| --- | --- | ---: | --- |
| api-gateway | Asthra API Gateway | 8080 | Gateway foundation MVP |
| event-service | Asthra Event Bus | 8015 | Event bus foundation MVP |
| core-service | Asthra Core | 8000 | Level 2 foundation MVP |
| flow-service | Asthra Flow | 8001 | Work management MVP |
| docs-service | Asthra Docs | 8002 | Knowledge/documentation MVP |
| ai-service | Asthra Intelligence | 8003 | Provider and prompt foundation |
| memory-service | Asthra Memory | 8004 | Ingestion/chunking/retrieval placeholder MVP |
| discover-service | Asthra Discover | 8005 | Product discovery MVP |
| desk-service | Asthra Desk | 8006 | Service management MVP |
| pulse-service | Asthra Pulse | 8007 | Incident/reliability MVP |
| dev-service | Asthra Dev | 8008 | Engineering visibility MVP |
| collab-service | Asthra Collab | 8009 | Collaboration MVP |
| automation-service | Asthra Automate | 8010 | Workflow foundation MVP |
| connect-service | Asthra Connect | 8011 | Integration foundation MVP |
| guard-service | Asthra Guard | 8012 | Security/governance MVP |
| insights-service | Asthra Insights | 8013 | Analytics/reporting MVP |
| media-service | Asthra Media | 8014 | Media metadata MVP |

See [Service Port Map](docs/service-port-map.md) and [Platform Service Map](docs/platform-service-map.md).

## Repository Structure

```text
apps/             Future user-facing web applications.
services/         Backend service boundaries.
packages/         Shared reusable packages.
infrastructure/   Docker, nginx, deployment, and monitoring assets.
docs/             Product, architecture, standards, and service docs.
scripts/          Developer and operational scripts.
.github/          Pull request and issue templates.
```

## Run Locally

From the repository root:

```bash
docker compose up --build
```

Each service exposes:

- `/health`
- `/ready`
- `/api/v1/system/info` for services
- `/docs`

## Run Tests

Run a single service or package:

```bash
cd services/core-service
python3 -m pytest tests -q
```

Run discovered tests:

```bash
scripts/run_all_tests.sh
```

## Contribution Notes

Before contributing, read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [Git Workflow](docs/git-workflow.md)
- [Branching Strategy](docs/branching-strategy.md)
- [Commit Conventions](docs/commit-conventions.md)
- [API Conventions](docs/api-conventions.md)

Keep changes scoped. Do not modify unrelated service business logic. Update docs when architecture, structure, APIs, or standards change.

## Roadmap

See [Roadmap](docs/roadmap.md), [Development Status](docs/development-status.md), and the architecture plans for AI, RAG, event-driven workflows, and performance layers.
