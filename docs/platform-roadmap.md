# Asthra Platform Roadmap

## Completed Foundations

- service monorepo
- backend MVP service foundations
- API Gateway foundation
- Event Bus foundation
- shared packages for platform standards
- Docker Compose local orchestration
- governance docs and ADRs
- observability and DevOps planning

## Near-Term Platform Work

- adopt shared platform packages in services
- standardize request ID propagation through API Gateway
- expand gateway routing beyond the initial services
- wire selected services to Event Service
- add service-to-service auth standards
- improve Docker Compose health checks

## Mid-Term Platform Work

- GitHub Actions test/build pipelines
- structured logs
- OpenTelemetry tracing
- Prometheus-style metrics
- API Gateway auth validation
- event-driven automation triggers
- frontend shell

## Future Platform Work

- broker-backed event bus
- Redis/cache layer
- Kubernetes deployment
- Helm and GitOps
- RAG implementation
- real AI workflows
- agent and automation execution
- multimodal processing

## Guiding Rules

- Services own their own domain and database.
- Core remains identity/workspace source of truth.
- API Gateway becomes the frontend entry point.
- Event Service becomes the platform event backbone.
- AI and RAG are introduced after platform foundations are stable.
