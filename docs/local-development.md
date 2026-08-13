# Asthra Local Development

## Prerequisites

- Python 3.11
- Docker and Docker Compose
- A local virtual environment for running service tests outside Docker

## Docker Compose

Run every service from the repository root:

```bash
docker compose up --build
```

Run one service:

```bash
docker compose up --build core-service
```

Run the API Gateway:

```bash
docker compose up --build api-gateway
```

Gateway URL:

```text
http://localhost:8080
```

Run the Event Service:

```bash
docker compose up --build event-service
```

Event Service URL:

```text
http://localhost:8015
```

Every container listens on `8000` internally. Host ports are assigned in Docker Compose and documented in [service-port-map.md](service-port-map.md).

## Health Checks

Each service exposes:

- `/health` for a simple process status check.
- `/ready` for database readiness.
- `/api/v1/system/info` for service name, version, environment, and API prefix.

## Tests

Run tests from an individual service directory:

```bash
cd services/core-service
python -m pytest tests -q
```

Most service tests use SQLite test databases and override local persistence safely. Do not point test runs at production databases.

## Local Data

Docker Compose stores service SQLite files in named volumes. To reset local Docker data for a service, remove the relevant Docker volume intentionally after stopping the stack.

## Deferred Platform Infrastructure

PostgreSQL, Redis, API gateway routing, event bus delivery, service mesh concerns, RAG infrastructure, frontend apps, and agent execution are future work.
