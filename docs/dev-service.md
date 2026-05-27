# Asthra Dev Service

Asthra Dev provides engineering and DevOps visibility for repositories, pull requests, deployments, releases, environments, service catalog, ownership, and dependency mapping.

## Purpose

Dev creates a structured operational view of software delivery without adding real AI, RAG, agents, automation, or frontend functionality in this MVP.

## Entities

- Repository
- PullRequest
- Environment
- Deployment
- Release
- ServiceCatalogItem
- ServiceOwner
- ServiceDependency

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

## Future AI Roadmap

Later tiers may add AI release summaries, deployment risk analysis, dependency risk detection, and architecture insight generation. No AI calls are implemented in this MVP.
