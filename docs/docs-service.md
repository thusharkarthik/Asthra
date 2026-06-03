# Asthra Docs Service

Asthra Docs is the documentation and knowledge service for Asthra. It manages spaces, pages, page versions, comments, tags, attachment metadata, and basic keyword search.

Docs is not the AI memory, RAG, or vector-search layer. Those capabilities belong to later Asthra tiers and will be added only after the foundation service model is stable.

## Purpose

Docs provides structured knowledge spaces linked to Core workspaces. It gives teams a place to create, version, organize, discuss, and tag documentation.

## Entities

- `Space`: workspace-scoped documentation area.
- `Page`: content page within a space, optionally nested under another page.
- `PageVersion`: immutable snapshot created on page create and title/content update.
- `PageComment`: discussion entry on a page.
- `PageAttachment`: metadata for externally stored files.
- `PageTag`: reusable tag that can be attached to pages.

## Endpoints

Health:

- `GET /health`
- `GET /ready`

Spaces:

- `POST /api/v1/spaces`
- `GET /api/v1/spaces`
- `GET /api/v1/spaces/{space_id}`
- `PATCH /api/v1/spaces/{space_id}`
- `DELETE /api/v1/spaces/{space_id}`
- `GET /api/v1/spaces/{space_id}/pages`

Pages:

- `POST /api/v1/pages`
- `GET /api/v1/pages`
- `GET /api/v1/pages/{page_id}`
- `PATCH /api/v1/pages/{page_id}`
- `DELETE /api/v1/pages/{page_id}`
- `POST /api/v1/pages/{page_id}/prepare-memory-document`
- `POST /api/v1/pages/{page_id}/ai-summary`

Comments, attachments, tags, and search:

- `POST /api/v1/pages/{page_id}/comments`
- `GET /api/v1/pages/{page_id}/comments`
- `PATCH /api/v1/comments/{comment_id}`
- `DELETE /api/v1/comments/{comment_id}`
- `POST /api/v1/pages/{page_id}/attachments`
- `GET /api/v1/pages/{page_id}/attachments`
- `DELETE /api/v1/attachments/{attachment_id}`
- `POST /api/v1/tags`
- `GET /api/v1/tags`
- `POST /api/v1/pages/{page_id}/tags`
- `GET /api/v1/pages/{page_id}/tags`
- `DELETE /api/v1/pages/{page_id}/tags/{tag_id}`
- `GET /api/v1/search/pages?q=...`

Search is simple SQL title/content matching. It is not semantic search.

## Local Run

```bash
cd services/docs-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Seed sample data after tables exist:

```bash
python scripts/seed_docs_defaults.py
```

## Docker Run

From the repository root:

```bash
docker compose up --build docs-service
```

Docs is exposed on `http://localhost:8002`.

## Tests

```bash
cd services/docs-service
pytest tests
```

The tests use a disposable SQLite database under `tests/`.

## RAG Readiness

Docs does not call Memory automatically yet. It exposes a memory preparation endpoint:

```http
POST /api/v1/pages/{page_id}/prepare-memory-document
```

This returns:

- title
- content
- workspace_id
- `source_type="docs_page"`
- `external_reference="page:{page_id}"`
- metadata with page and space identifiers

## AI Page Summary

`POST /api/v1/pages/{page_id}/ai-summary` summarizes plain page content through Asthra Intelligence.

The response includes short summary, key points, action items, and related questions.

Configuration:

```text
AI_SERVICE_URL=
AI_FEATURES_ENABLED=false
```

The feature is disabled by default and does not require Memory/RAG yet.

## Future RAG Roadmap

Later tiers can add:

- Core JWT and workspace membership enforcement.
- Alembic migrations and deployment database setup.
- Full-text search indexing.
- Content ingestion events for Asthra Memory.
- Embedding pipelines and vector indexes.
- Retrieval APIs for RAG.
- RAG-aware summaries and question answering.

No RAG, vector database, or AI functionality is implemented in this tier.
