# Platform Integration Hardening

This document records the current platform-wide hardening pass.

## Applied Standards

- Verified required service files across all current services:
  - `app/main.py`
  - `README.md`
  - `requirements.txt`
  - `.env.example`
  - `Dockerfile`
  - `tests/`
  - `scripts/`
- Verified Docker Compose includes all current services.
- Added API Gateway as the platform entry point for selected service proxy routes.
- Added Event Bus foundation for event envelopes and subscription metadata.
- Kept each service on the existing SQLite local database pattern.
- Added or confirmed `/api/v1/system/info` across services.
- Confirmed service metadata config fields:
  - service name
  - version
  - environment
  - API prefix
- Kept response standardization low risk by using existing response helpers instead of refactoring business endpoints.

## Standard Endpoints

Each service should expose:

- `GET /health`
- `GET /ready`
- `GET /api/v1/system/info`

`/health` confirms the service process is running. `/ready` confirms local database connectivity. `/api/v1/system/info` reports metadata for local diagnostics and integration checks.

## Docker Standards

- One service per container.
- Container port `8000`.
- Stable host ports `8000` through `8014`.
- One named SQLite data volume per service.
- Environment configuration loaded through per-service `.env.example` files plus Compose overrides for container database paths.

## Future TODOs

- Shared auth propagation across service boundaries.
- API gateway for routing, auth, rate limits, and request normalization.
- Broker-backed event bus for cross-service domain events.
- Redis/cache layer for high-read workflows and background coordination.
- RAG integration between Docs, Memory, and Intelligence.
- Standard service-to-service communication contracts.
- Frontend apps for end-user workflows.

## Known Gaps

- Response envelope behavior is not fully uniform on every historical endpoint.
- Request ID middleware exists in Core and can be propagated later.
- Cross-service authorization checks are not standardized.
- Docker healthcheck declarations are not yet defined in Compose.
