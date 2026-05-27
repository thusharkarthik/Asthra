# Asthra Infrastructure

Asthra local orchestration uses Docker Compose with one container per service. Each service keeps its own SQLite database in a named Docker volume for local development.

## Local Service Ports

| Service | Port | Health URL |
| --- | --- | --- |
| core-service | 8000 | http://localhost:8000/health |
| flow-service | 8001 | http://localhost:8001/health |
| docs-service | 8002 | http://localhost:8002/health |
| ai-service | 8003 | http://localhost:8003/health |
| memory-service | 8004 | http://localhost:8004/health |
| discover-service | 8005 | http://localhost:8005/health |
| desk-service | 8006 | http://localhost:8006/health |
| pulse-service | 8007 | http://localhost:8007/health |
| dev-service | 8008 | http://localhost:8008/health |
| collab-service | 8009 | http://localhost:8009/health |
| automation-service | 8010 | http://localhost:8010/health |

## Local Run

From the repository root:

```bash
docker compose up --build
```

After startup, verify each service by opening its health URL. Containers listen on port `8000` internally, while Docker Compose publishes each service to its assigned host port.

## Current Scope

The local infrastructure foundation intentionally uses SQLite volumes only. PostgreSQL, Redis, caching, background workers, real AI calls, RAG, agents, and automation are later-tier infrastructure concerns.
