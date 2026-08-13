# Asthra Service Registry

The API Gateway owns the current static service registry. It maps gateway route prefixes to configured downstream service URLs.

## Registry Table

| Route Prefix | Service Name | Docker Compose Name | Local URL | Gateway Prefix |
| --- | --- | --- | --- | --- |
| core | core-service | core-service | http://localhost:8000 | `/api/core` |
| flow | flow-service | flow-service | http://localhost:8001 | `/api/flow` |
| docs | docs-service | docs-service | http://localhost:8002 | `/api/docs` |
| ai | ai-service | ai-service | http://localhost:8003 | `/api/ai` |
| memory | memory-service | memory-service | http://localhost:8004 | `/api/memory` |
| discover | discover-service | discover-service | http://localhost:8005 | `/api/discover` |
| desk | desk-service | desk-service | http://localhost:8006 | `/api/desk` |
| pulse | pulse-service | pulse-service | http://localhost:8007 | `/api/pulse` |
| dev | dev-service | dev-service | http://localhost:8008 | `/api/dev` |
| collab | collab-service | collab-service | http://localhost:8009 | `/api/collab` |
| automation | automation-service | automation-service | http://localhost:8010 | `/api/automation` |
| connect | connect-service | connect-service | http://localhost:8011 | `/api/connect` |
| guard | guard-service | guard-service | http://localhost:8012 | `/api/guard` |
| insights | insights-service | insights-service | http://localhost:8013 | `/api/insights` |
| media | media-service | media-service | http://localhost:8014 | `/api/media` |
| events | event-service | event-service | http://localhost:8015 | `/api/events` |

## Gateway Endpoints

- `GET /api/gateway/services`
- `GET /api/gateway/health/services`

## Future Service Discovery Plan

The registry is static for Phase 2. Later phases can replace it with:

- environment-backed service discovery
- Kubernetes service discovery
- active health polling
- service metadata from a platform catalog
- route policy configuration
