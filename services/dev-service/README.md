# Asthra Dev Service

Asthra Dev is the engineering and DevOps visibility app for repositories, pull requests, deployments, releases, environments, service catalog, ownership, and dependency mapping.

This MVP includes optional AI release summaries through `ai-service`. RAG, vector databases, agents, automation, and frontend functionality are not implemented here.

## Run

```bash
cd services/dev-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_dev_defaults.py
```

## Docker

```bash
docker compose up --build dev-service
```

Dev is published on `http://localhost:8008`.

## Endpoints

Repositories, pull requests, environments, deployments, releases, service catalog items, owners, and dependencies are available under `/api/v1`.

AI endpoint:

- `POST /api/v1/releases/{release_id}/ai-summary`

## AI Configuration

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

AI release summaries are disabled by default and return a clean `503` when disabled or unconfigured. They do not automatically update release or deployment records.

## Future AI Roadmap

Later tiers may add RAG-aware release notes, deployment risk analysis, service dependency risk detection, and architecture insight generation.
