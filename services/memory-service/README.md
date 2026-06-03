# Asthra Memory Service

Asthra Memory is the foundation service for managed knowledge context across Asthra. This tier defines sources, workspace memory collections, documents, chunks, embedding records, workspace search, and retrieval logs.

This foundation does not implement production vector database integration, real embedding generation, agents, automation, or frontend functionality.

## Scope

Initial Memory entities:

- Knowledge sources
- Memory collections
- Knowledge documents
- Document chunks
- Embedding records
- Retrieval logs

## Setup

```bash
cd services/memory-service
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

## Tests

Tests use a local SQLite database under `tests/`.

```bash
cd services/memory-service
pytest tests
```

Optional coverage:

```bash
pytest --cov=app tests
```

## Seed Defaults

Seed a sample source, sample document, and generated chunks:

```bash
cd services/memory-service
python scripts/seed_memory_defaults.py
```

The seed script is idempotent and creates tables if they do not already exist.

## Docker

Run through the root compose file:

```bash
cd ../..
docker compose up --build memory-service
```

The compose service maps Asthra Memory to `http://localhost:8004` and stores SQLite data in a Docker volume.

## Environment Variables

```text
APP_NAME=asthra-memory-service
APP_VERSION=0.1.0
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite:///./asthra_memory.db
MEMORY_CHUNK_SIZE=500
MEMORY_CHUNK_OVERLAP=50
MEMORY_PLACEHOLDER_EMBEDDING_MODEL=placeholder-keyword-model
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL_NAME=mock-embedding-v1
VECTOR_STORE_PROVIDER=in_memory
EVENT_SERVICE_URL=
EVENT_PUBLISHING_ENABLED=false
```

## Current Structure

```text
app/
  api/v1/      Versioned placeholder routers.
  core/        Configuration, responses, and exception handlers.
  db/          SQLAlchemy base and session.
  models/      Initial Memory SQLAlchemy models.
  providers/   Reserved for future embedding/vector providers.
  schemas/     Pydantic request and response schemas.
  repositories/ Data access layer for sources, documents, and chunks.
  services/    Business logic for ingestion and chunking.
  utils/       Reserved for shared helpers.
tests/         Reserved for Memory service tests.
```

## API Areas

Current routes:

- `POST /api/v1/sources`
- `GET /api/v1/sources`
- `GET /api/v1/sources/{source_id}`
- `POST /api/v1/collections`
- `GET /api/v1/collections`
- `GET /api/v1/collections/{collection_id}`
- `PATCH /api/v1/collections/{collection_id}`
- `DELETE /api/v1/collections/{collection_id}`
- `POST /api/v1/ingest`
- `POST /api/v1/documents`
- `GET /api/v1/documents`
- `GET /api/v1/documents/{document_id}`
- `PATCH /api/v1/documents/{document_id}`
- `DELETE /api/v1/documents/{document_id}`
- `GET /api/v1/documents/{document_id}/chunks`
- `POST /api/v1/embeddings/generate/{document_id}`
- `GET /api/v1/embeddings/document/{document_id}`
- `POST /api/v1/retrieval/search`
- `POST /api/v1/retrieval/semantic-search`
- `POST /api/v1/workspace-search`

Embedding and retrieval routes are foundation-level. Mock embeddings and an in-memory vector store are used by default.

## Source Registry

Supported `source_type` values:

- `docs_page`
- `work_item`
- `idea`
- `feature_request`
- `support_ticket`
- `incident`
- `release`
- `discussion_thread`

## Ingestion Flow

Create a knowledge source first:

```http
POST /api/v1/sources
```

```json
{
  "workspace_id": 1,
  "source_type": "manual",
  "name": "Engineering handbook",
  "external_reference": null
}
```

Then create a document linked to that source:

```http
POST /api/v1/documents
```

```json
{
  "source_id": 1,
  "title": "Release checklist",
  "content": "Document content goes here.",
  "content_type": "text/plain",
  "metadata": {
    "owner": "platform"
  }
}
```

When a document is created, Asthra Memory automatically rebuilds its chunks.

Generic ingestion can create or reuse a source, create a document, chunk it, generate mock embeddings, and index vectors in one request:

```http
POST /api/v1/ingest
```

```json
{
  "source_type": "support_ticket",
  "external_reference": "support_ticket:123",
  "workspace_id": 1,
  "title": "Login issue",
  "content": "User cannot sign in.",
  "metadata": {
    "ticket_id": 123
  }
}
```

## Chunking Flow

Chunking is a simple word-window strategy for now:

- Split content by whitespace.
- Create chunks using `MEMORY_CHUNK_SIZE`.
- Reuse the last `MEMORY_CHUNK_OVERLAP` words in the next chunk.
- Store each chunk with `chunk_index`, `content`, and approximate `token_count`.

When document content is updated through `PATCH /api/v1/documents/{document_id}`, chunks are rebuilt for that document.

List generated chunks:

```http
GET /api/v1/documents/{document_id}/chunks
```

## Embedding Lifecycle

Generate placeholder embedding records for an already-ingested document:

```http
POST /api/v1/embeddings/generate/{document_id}
```

This uses the configured embedding provider. The default `mock` provider returns deterministic local vectors and does not call external APIs.

Current placeholder statuses:

- `pending`
- `generated`
- `failed`

The generate endpoint marks records as `generated` and upserts vectors into the configured vector store. The default vector store is in-memory.

List embedding records for a document:

```http
GET /api/v1/embeddings/document/{document_id}
```

## Retrieval Flow

Search Memory chunks with simple keyword matching:

```http
POST /api/v1/retrieval/search
```

Request:

```json
{
  "query": "release checklist",
  "top_k": 10,
  "source_id": null,
  "workspace_id": null
}
```

Response includes matching chunks, document/source metadata, retrieval type, result count, and latency. Each retrieval request is stored in `retrieval_logs`.

Semantic retrieval:

```http
POST /api/v1/retrieval/semantic-search
```

Workspace search:

```http
POST /api/v1/workspace-search
```

```json
{
  "workspace_id": 1,
  "query": "login failures",
  "top_k": 5
}
```

Workspace search returns source type, title, chunk text, relevance score, source reference, document ID, chunk ID, and metadata.

## Optional Event Publishing

Memory can publish no-op-safe events when configured:

- `memory.document.ingested`
- `memory.document.chunked`
- `memory.embedding.generated`
- `memory.workspace.search`

This is a SQL keyword search over chunk content, not semantic retrieval.

## Future Vector DB Notes

Later tiers may add:

- real embedding provider adapters
- asynchronous embedding generation
- vector database storage
- semantic retrieval APIs
- hybrid keyword/vector search
- retrieval quality scoring

Those capabilities should build on the current `DocumentChunk`, `EmbeddingRecord`, and `RetrievalLog` foundations without replacing the basic ingestion model.

## Entity Notes

`KnowledgeSource` represents where knowledge came from, such as a document system, workspace upload, or future integration.

`KnowledgeDocument` stores raw document content and metadata.

`DocumentChunk` stores chunked text metadata for future retrieval.

`EmbeddingRecord` tracks embedding readiness and optional external vector IDs. No real embeddings or vector DB integration are implemented yet.

`RetrievalLog` captures basic retrieval request metadata for later observability.

## Run

```bash
uvicorn app.main:app --reload
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`
- `http://localhost:8000/health`
- `http://localhost:8000/ready`

## Optional Event Publishing

Memory can publish placeholder document events:

- `memory.document.created`
- `memory.document.chunked`

Publishing is disabled by default with `EVENT_PUBLISHING_ENABLED=false`. Event Service is optional.
