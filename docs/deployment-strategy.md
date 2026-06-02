# Asthra Deployment Strategy

Asthra is currently deployed locally with Docker Compose. Production deployment is intentionally deferred until service boundaries, gateway routing, event foundations, and shared standards are stable.

## Current Deployment Mode

- root `docker-compose.yml`
- one container per service
- SQLite volumes per service
- API Gateway on port `8010`
- services exposed on local ports for direct development

Run locally:

```bash
docker compose up --build
```

## Future Deployment Mode

Future deployment should move toward:

- Kubernetes
- GitHub Actions
- GitOps
- Helm charts
- cloud clusters on EKS, GKE, or AKS
- managed databases
- managed cache layer
- centralized logging and metrics

## Deployment Rules

- Do not commit production secrets.
- Each service must remain independently buildable.
- Service database ownership must remain isolated.
- Frontend clients should use API Gateway.
- Cross-service communication should use HTTP gateway routes or future events, not direct database access.

## Promotion Model

Planned environment promotion:

1. local
2. dev
3. stage
4. prod
