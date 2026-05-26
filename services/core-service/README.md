# Asthra Core Service

Level 2 foundation backend skeleton for Asthra Core.

This service is intentionally limited to the platform foundation: users, organizations, workspaces, teams, roles, projects, activity logs, and MVP authentication. It does not implement Flow, Docs, AI, RAG, agents, automation, or frontend functionality.

## Setup

```bash
cd services/core-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

API routes are mounted under `/api/v1`.

## Environment Variables

```text
ASTHRA_ENV=development
ASTHRA_SERVICE_NAME=asthra-core-service
ASTHRA_API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=postgresql+psycopg://asthra:asthra@localhost:5432/asthra_core
SECRET_KEY=change-me-in-local-env
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

For local SQLite development, set:

```text
DATABASE_URL=sqlite:///./asthra_core.db
```

## Auth Endpoints

### Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "change-me",
  "full_name": "Example User"
}
```

Returns the created user profile. Duplicate emails return `409 Conflict`.

### Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "change-me"
}
```

Returns:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <jwt>
```

Returns the current user profile for a valid bearer token.

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

SQLAlchemy is configured in `app/db/session.py`. Alembic uses `app.db.base.Base.metadata` for model discovery.

Create a migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
```

Apply migrations:

```bash
alembic upgrade head
```
