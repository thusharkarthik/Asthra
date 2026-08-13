# Asthra Dev Service

Asthra Dev provides engineering and DevOps visibility for repositories, pull requests, deployments, releases, environments, service catalog, ownership, and dependency mapping.

## Purpose

Dev creates a structured operational view of software delivery. AI release summarization is optional and disabled by default.

## Entities

- Repository
- PullRequest
- Environment
- Deployment
- Release
- ServiceCatalogItem
- ServiceOwner
- ServiceDependency

## AI Release Summary

Endpoint:

- `POST /api/v1/releases/{release_id}/ai-summary`

The AI release summary response includes release overview, shipped changes, deployment risk, rollback considerations, stakeholder summary, and QA notes. Linked service and deployment context are included when simple. The endpoint does not modify release records.

## Run

```bash
cd services/dev-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
cd services/dev-service
pytest tests
```

## Docker

```bash
docker compose up --build dev-service
```

The service is exposed on `http://localhost:8008`.

## AI Configuration

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

AI calls are fail-safe. If AI is disabled or the AI Service URL is missing, the endpoint returns a clean `503` response.

## Future AI Roadmap

Later tiers may add RAG-aware release notes, deployment risk analysis, dependency risk detection, and architecture insight generation. This MVP does not auto-change release status or deployment records.
