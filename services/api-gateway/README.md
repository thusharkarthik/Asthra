# Asthra API Gateway

Asthra API Gateway is the single entry point for frontend and client requests. This foundation keeps routing simple while preparing the platform for later auth forwarding, request IDs, rate limits, service discovery, and gateway policy enforcement.

## Current Scope

- FastAPI gateway service.
- CORS middleware.
- Request ID middleware using `X-Request-ID`.
- Standard `/health` and `/ready` endpoints.
- Gateway metadata at `/api/gateway/info`.
- Static service registry at `/api/gateway/services`.
- Service health aggregation at `/api/gateway/health/services`.
- Simple proxy routes for all current services.

## Supported Proxy Routes

| Gateway Route | Downstream Service |
| --- | --- |
| `/api/core/{path}` | core-service |
| `/api/flow/{path}` | flow-service |
| `/api/docs/{path}` | docs-service |
| `/api/ai/{path}` | ai-service |
| `/api/memory/{path}` | memory-service |
| `/api/discover/{path}` | discover-service |
| `/api/desk/{path}` | desk-service |
| `/api/pulse/{path}` | pulse-service |
| `/api/dev/{path}` | dev-service |
| `/api/collab/{path}` | collab-service |
| `/api/automation/{path}` | automation-service |
| `/api/connect/{path}` | connect-service |
| `/api/guard/{path}` | guard-service |
| `/api/insights/{path}` | insights-service |
| `/api/media/{path}` | media-service |
| `/api/events/{path}` | event-service |

The proxy forwards method, path, query params, request body, `Authorization`, `X-Request-ID`, and `Content-Type` when present.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

Docker Compose from the repository root:

```bash
docker compose up --build api-gateway
```

Gateway URL:

```text
http://localhost:8080
```

## Tests

```bash
python -m pytest tests -q
```

Tests mock downstream proxy calls and do not require other services to be running.

## Environment

See `.env.example` for service URL configuration. In Docker Compose, service URLs use Compose service names such as `http://core-service:8000`.

## Future Roadmap

- Shared auth validation and auth context forwarding.
- API gateway policy layer.
- Rate limiting.
- Service discovery.
- Cache layer integration.
- Request and response observability.
