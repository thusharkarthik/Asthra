# Asthra Dev Service

Asthra Dev is the engineering and DevOps visibility app for repositories, pull requests, deployments, releases, environments, service catalog, ownership, and dependency mapping.

This MVP does not implement real AI, RAG, vector databases, agents, automation, or frontend functionality.

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

## Future AI Roadmap

Later tiers may add AI release summaries, deployment risk analysis, service dependency risk detection, and architecture insight generation.
