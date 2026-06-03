# Asthra Docs Service

Asthra Docs is the knowledge and documentation service for Asthra. This foundation provides a clean FastAPI service skeleton, SQLAlchemy persistence setup, initial documentation models, Pydantic schemas, and placeholder API routers.

This service does not implement frontend behavior, AI, RAG, vector search, agents, automation, or external integrations.

## Scope

Initial Docs entities:

- Spaces scoped to Core workspaces
- Pages with parent/child hierarchy
- Page versions
- Page comments
- Page attachment metadata
- Page tags

Docs references Asthra Core records by ID for workspaces and users. Core remains the source of truth for users, organizations, workspaces, teams, and projects.

## Setup

```bash
cd services/docs-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Health endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

API routes are mounted under `/api/v1`.

Seed sample Docs data after database tables exist:

```bash
python scripts/seed_docs_defaults.py
```

The seed script is idempotent and creates or updates:

- one sample space
- sample pages
- sample tags

## Docker

From the repository root:

```bash
docker compose up --build docs-service
```

The Docker Compose service exposes Docs on:

```text
http://localhost:8002
```

The container uses SQLite at `/app/data/asthra_docs.db`, backed by the `docs_service_data` Docker volume.

## Environment Variables

```text
APP_NAME=asthra-docs-service
APP_VERSION=0.1.0
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite:///./asthra_docs.db
```

## Current Structure

```text
app/
  api/v1/          Versioned placeholder routers.
  core/            Configuration, response helpers, and exception handlers.
  db/              SQLAlchemy base and session.
  models/          Initial Docs SQLAlchemy models.
  repositories/    Reserved for data access logic.
  schemas/         Pydantic request and response schemas.
  services/        Reserved for business logic.
  utils/           Reserved for shared helpers.
tests/             Reserved for Docs service tests.
```

## API Areas

- `/api/v1/spaces`
- `/api/v1/pages`
- `/api/v1/comments`
- `/api/v1/attachments`
- `/api/v1/tags`
- `/api/v1/search`

## Space Endpoints

Authentication is currently represented by TODO placeholders. Core Service JWT validation and workspace membership checks will be added later.

### Create Space

```http
POST /api/v1/spaces
```

Request:

```json
{
  "workspace_id": 1,
  "name": "Engineering",
  "description": "Engineering knowledge base",
  "created_by_id": 1
}
```

### List Spaces

```http
GET /api/v1/spaces
```

Optional query parameter:

- `workspace_id`

### Get, Update, Delete Space

```http
GET /api/v1/spaces/{space_id}
PATCH /api/v1/spaces/{space_id}
DELETE /api/v1/spaces/{space_id}
```

Delete performs a soft delete by setting `is_active` to `false`.

### List Pages In Space

```http
GET /api/v1/spaces/{space_id}/pages
```

Returns active pages in the space and includes `parent_page_id` so clients can build a page tree.

## Page Endpoints

### Create Page

```http
POST /api/v1/pages
```

Request:

```json
{
  "space_id": 1,
  "parent_page_id": null,
  "title": "Getting Started",
  "content": "",
  "status": "draft",
  "created_by_id": 1
}
```

When a page is created, Docs creates `PageVersion` version `1`.

### List Pages

```http
GET /api/v1/pages
```

Optional query parameters:

- `space_id`
- `status`
- `created_by_id`
- `parent_page_id`
- `limit`
- `offset`

### Get, Update, Delete Page

```http
GET /api/v1/pages/{page_id}
PATCH /api/v1/pages/{page_id}
DELETE /api/v1/pages/{page_id}
```

When page `title` or `content` changes, Docs creates the next `PageVersion`. Delete performs a soft delete by setting `is_active` to `false`.

## Comment Endpoints

### Add Page Comment

```http
POST /api/v1/pages/{page_id}/comments
```

Request:

```json
{
  "user_id": 1,
  "content": "Please review this section."
}
```

### List Page Comments

```http
GET /api/v1/pages/{page_id}/comments
```

### Update And Delete Comment

```http
PATCH /api/v1/comments/{comment_id}
DELETE /api/v1/comments/{comment_id}
```

## Attachment Endpoints

Attachments store metadata only. Docs does not upload or store file bytes yet.

### Add Page Attachment Metadata

```http
POST /api/v1/pages/{page_id}/attachments
```

Request:

```json
{
  "file_name": "architecture.pdf",
  "file_url": "https://files.example/architecture.pdf",
  "file_type": "application/pdf",
  "file_size": 2048,
  "uploaded_by_id": 1
}
```

### List Page Attachments

```http
GET /api/v1/pages/{page_id}/attachments
```

### Delete Attachment Metadata

```http
DELETE /api/v1/attachments/{attachment_id}
```

## Tag Endpoints

### Create And List Tags

```http
POST /api/v1/tags
GET /api/v1/tags
```

Request:

```json
{
  "name": "engineering"
}
```

Tag names are unique case-insensitively.

### Page Tag Links

```http
POST /api/v1/pages/{page_id}/tags
GET /api/v1/pages/{page_id}/tags
DELETE /api/v1/pages/{page_id}/tags/{tag_id}
```

Request:

```json
{
  "tag_id": 1
}
```

Duplicate page-tag links return `409 Conflict`.

## Basic Search

```http
GET /api/v1/search/pages?q=architecture
```

Search uses simple SQL `LIKE`/`ILIKE` matching across page title and content. This is not semantic search, RAG, or vector search.

Authentication integration and migrations will be added in later controlled tasks.

## Tests

Run tests from the service directory:

```bash
cd services/docs-service
pytest tests
```

The tests use a disposable SQLite database at `tests/test_asthra_docs.db` and cover health, readiness, spaces, pages, page versions, comments, attachment metadata, tags, and basic search.

## Optional Event Publishing

Docs can publish placeholder page events:

- `docs.page.created`
- `docs.page.updated`

Set `EVENT_SERVICE_URL` and `EVENT_PUBLISHING_ENABLED=true` to enable later. Publishing is disabled by default and Event Service is not required.
