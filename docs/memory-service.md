# Asthra Memory Service

Asthra Memory manages durable knowledge context for Asthra. The current MVP focuses on source and document ingestion, local chunk creation, placeholder embedding records, and keyword retrieval logs.

This service does not implement vector database integration, real embeddings, semantic retrieval, RAG orchestration, agents, automation, or frontend functionality yet.

## Purpose

Asthra Memory provides a clean service boundary for knowledge storage and retrieval readiness:

- Track where knowledge came from.
- Store document content and metadata.
- Split documents into retrieval-ready chunks.
- Track placeholder embedding status per chunk.
- Support simple keyword search for early retrieval workflows.
- Log retrieval requests for later observability.

## Ingestion Pipeline

Create a `KnowledgeSource`, then create `KnowledgeDocument` records linked to that source.

Source endpoints:

- `POST /api/v1/sources`
- `GET /api/v1/sources`
- `GET /api/v1/sources/{source_id}`

Document endpoints:

- `POST /api/v1/documents`
- `GET /api/v1/documents`
- `GET /api/v1/documents/{document_id}`
- `PATCH /api/v1/documents/{document_id}`
- `DELETE /api/v1/documents/{document_id}`

When a document is created, chunks are generated automatically.

## Chunking Lifecycle

Chunking uses a simple word-window strategy:

- Split content by whitespace.
- Use `MEMORY_CHUNK_SIZE` as the maximum words per chunk.
- Use `MEMORY_CHUNK_OVERLAP` to carry words into the next chunk.
- Store `chunk_index`, `content`, approximate `token_count`, and metadata.

Chunk endpoint:

- `GET /api/v1/documents/{document_id}/chunks`

When document content is updated, chunks are rebuilt for that document.

## Embedding Lifecycle

Embedding generation is a placeholder in this tier.

Endpoint:

- `POST /api/v1/embeddings/generate/{document_id}`
- `GET /api/v1/embeddings/document/{document_id}`

The generate endpoint creates or updates one `EmbeddingRecord` per chunk and marks it as `generated`. It does not call an embedding provider and does not write vectors.

Current statuses:

- `pending`
- `generated`
- `failed`

## Retrieval Flow

Retrieval currently uses SQL keyword matching over chunk content.

Endpoint:

- `POST /api/v1/retrieval/search`

Request:

```json
{
  "query": "release checklist",
  "top_k": 10,
  "source_id": null,
  "workspace_id": null
}
```

The response includes matching chunks, document/source metadata, retrieval type, result count, and latency. Each search writes a `RetrievalLog`.

This is not semantic retrieval.

## Local Run

```bash
cd services/memory-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`
- `http://localhost:8000/health`
- `http://localhost:8000/ready`

## Tests

```bash
cd services/memory-service
pytest tests
```

Tests use SQLite and do not call external providers.

## Seed Data

```bash
cd services/memory-service
python scripts/seed_memory_defaults.py
```

This creates a sample source, sample document, and generated chunks.

## Docker

From the repository root:

```bash
docker compose up --build memory-service
```

The compose service exposes Asthra Memory on `http://localhost:8004`.

## Future Vector DB Roadmap

Later tiers may add:

- embedding provider adapters
- async embedding generation
- vector database storage
- vector IDs linked from `EmbeddingRecord`
- migration and re-indexing workflows

## Future Semantic Retrieval Roadmap

Later tiers may add:

- semantic nearest-neighbor search
- hybrid keyword and vector retrieval
- source attribution and scoring
- retrieval policies by workspace
- RAG-ready context packaging

These should build on the current ingestion, chunking, embedding record, and retrieval log foundations.
