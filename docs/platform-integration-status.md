# Asthra Platform Integration Status

## Completed In Phase 2 So Far

- API Gateway routes all current services.
- API Gateway exposes static service registry.
- API Gateway exposes downstream health aggregation.
- API Gateway safely adopts shared response/auth/config/request ID helpers when available.
- Selected services have optional event publisher helpers.
- Event settings are documented in selected `.env.example` files.

## Event Publishing Status

| Service | Status |
| --- | --- |
| core-service | publishes create events for organizations, workspaces, projects |
| flow-service | publishes work item created/updated events |
| docs-service | publishes page created/updated events |
| ai-service | publishes completion generated events |
| memory-service | publishes document created/chunked events |
| other services | pending |

## Known Gaps

- Shared packages are not yet installed as dependencies in every service image.
- Event publishing does not include request ID or correlation ID yet.
- Event publishing has no retry queue.
- Event Service does not drive automation triggers yet.
- Frontend, RAG, agents, and cache layers remain future work.

## Recommended Next Steps

1. Finalize package installation strategy for shared packages.
2. Add request/correlation ID propagation into event publishing.
3. Adopt event publishing in Discover, Desk, Pulse, and Dev.
4. Add Event Service ingestion tests using mocked publishers.
5. Later, add broker-backed retry and delivery workers.
