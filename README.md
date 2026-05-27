# Asthra

Asthra is an AI-native operating platform for work, engineering, knowledge, automation, collaboration, and intelligent workflows.

Asthra is an original platform with its own architecture, suite model, workflows, and long-term AI-first direction. The current repository contains the platform monorepo, Level 2 backend service MVPs, local Docker orchestration, service documentation, seed scripts, and automated test foundations.

## Current Modules

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

## Run Locally

From the repository root:

```bash
docker compose up --build
```

Each service exposes:

- `/health`
- `/ready`
- `/api/v1/system/info`
- `/docs`

See [docs/service-port-map.md](docs/service-port-map.md) for the full local port map.

## Run Tests

Each service owns its test suite. Example:

```bash
cd services/core-service
python -m pytest tests -q
```

Repeat from any service directory. Tests use local SQLite databases and should not target production data.

## Milestone Status

Completed platform foundation:

- Monorepo structure and documentation foundation
- FastAPI service skeletons across the Asthra suite
- SQLite local persistence pattern per service
- Docker Compose orchestration for all current services
- MVP endpoints, seed scripts, and basic tests for service foundations
- Standard health/readiness/system metadata endpoints
- API Gateway foundation for selected service proxy routes
- Event Bus foundation for event envelopes, subscriptions, and placeholder delivery logs

Future platform work:

- Shared auth propagation
- API gateway
- Event bus
- Broker-backed event delivery
- Redis/cache layer
- Service-to-service communication
- RAG integration
- Real AI provider workflows beyond placeholders
- Frontend applications
