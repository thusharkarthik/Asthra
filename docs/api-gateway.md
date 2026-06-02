# Asthra API Gateway

Asthra API Gateway is the platform entry point for frontend and client traffic. It provides a single gateway surface while downstream services keep their independent product boundaries.

## Purpose

The gateway foundation prepares Asthra for:

- centralized request routing
- auth forwarding
- request ID propagation
- service registry visibility
- future rate limiting
- future service discovery
- future cache integration

The current MVP does not validate authentication, enforce rate limits, use Redis, or implement frontend logic.

## Routing Strategy

The gateway currently supports explicit proxy routes for the first platform services:

| Gateway Route | Downstream |
| --- | --- |
| `/api/core/{path}` | `CORE_SERVICE_URL` |
| `/api/flow/{path}` | `FLOW_SERVICE_URL` |
| `/api/docs/{path}` | `DOCS_SERVICE_URL` |
| `/api/ai/{path}` | `AI_SERVICE_URL` |
| `/api/memory/{path}` | `MEMORY_SERVICE_URL` |

The proxy forwards:

- HTTP method
- path
- query parameters
- request body
- `Authorization`
- `X-Request-ID`

## Gateway Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | process health |
| `GET /ready` | gateway readiness |
| `GET /api/gateway/info` | gateway metadata and supported routes |
| `GET /api/gateway/services` | static service registry |

## Local Run

```bash
cd services/api-gateway
python -m pytest tests -q
uvicorn app.main:app --reload
```

Docker Compose:

```bash
docker compose up --build api-gateway
```

Local URL:

```text
http://localhost:8080
```

## Service Registry

The service registry is static in the MVP. It reports service names, configured base URLs, health paths, and a placeholder `configured` status.

Later tiers can replace this with active health polling or service discovery.

## Future Roadmap

- Expand proxy routes to every Asthra service.
- Add gateway-level auth validation.
- Forward normalized auth context to downstream services.
- Add rate limiting.
- Add API gateway policy controls.
- Add service discovery and active health status.
- Add Redis/cache layer integration.
- Add gateway observability and structured request logs.
