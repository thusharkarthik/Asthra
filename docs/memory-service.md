# Asthra Memory Service

Asthra Memory manages durable knowledge context for Asthra. The Phase 2 foundation supports source and document ingestion, chunk creation, mock embeddings, in-memory vector indexing, keyword retrieval, semantic retrieval, and retrieval logs.

No external embedding API, GPU, Qdrant instance, agents, automation, or frontend is required.

## Purpose

- Track where knowledge came from.
- Store document content and metadata.
- Split documents into retrieval-ready chunks.
- Generate deterministic mock embeddings by default.
- Store vectors in an in-memory vector store for local/test use.
- Support keyword and semantic retrieval.
- Log retrieval requests for later observability.

## Ingestion Pipeline

Create a `KnowledgeSource`, then create `KnowledgeDocument` records linked to that source.

When a document is created or content is updated, chunks are generated automatically.

## Chunking Lifecycle

Chunking uses a simple word-window strategy:

- `MEMORY_CHUNK_SIZE`
- `MEMORY_CHUNK_OVERLAP`

Endpoint:

- `GET /api/v1/documents/{document_id}/chunks`

## Embedding Lifecycle

Endpoint:

- `POST /api/v1/embeddings/generate/{document_id}`
- `GET /api/v1/embeddings/document/{document_id}`

Generation:

- loads document chunks
- generates mock vectors by default
- creates or updates `EmbeddingRecord`
- upserts vectors into the configured vector store
- returns document ID, chunks processed, embeddings created, provider, and model

Defaults:

```text
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL_NAME=mock-embedding-v1
VECTOR_STORE_PROVIDER=in_memory
```

## Retrieval Flow

Keyword retrieval:

- `POST /api/v1/retrieval/search`

Semantic retrieval:

- `POST /api/v1/retrieval/semantic-search`

Semantic request:

```json
{
  "query": "release checklist",
  "top_k": 5,
  "workspace_id": 1,
  "source_id": null,
  "document_id": null
}
```

Each retrieval writes a `RetrievalLog`.

## Future Vector DB Roadmap

- Qdrant integration
- pgvector evaluation
- durable vector IDs
- re-indexing workflows
- hybrid keyword/vector retrieval
- workspace-level retrieval policies
