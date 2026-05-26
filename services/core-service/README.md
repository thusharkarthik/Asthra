# Asthra Core Service

Level 2 foundation backend skeleton for Asthra Core.

This service is intentionally limited to the platform foundation: users, organizations, workspaces, teams, roles, projects, and activity logs. It does not implement Flow, Docs, AI, RAG, agents, automation, or frontend functionality.

## Setup

```bash
cd services/core-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

API routes are mounted under `/api/v1`.

## Structure

```text
app/
  api/v1/          Versioned routers.
  core/            Configuration and security helpers.
  db/              SQLAlchemy session and metadata base.
  models/          SQLAlchemy models.
  repositories/    Data-access layer placeholders.
  schemas/         Pydantic request and response schemas.
  services/        Business-service layer placeholders.
  utils/           Utility helpers.
alembic/           Migration environment placeholder.
```

## Database

SQLAlchemy is configured in `app/db/session.py`. Alembic placeholders are included, but migrations are not generated yet.
