# Asthra RAG Foundation

Phase 2 connects Docs, Memory, and Intelligence into the first RAG-ready architecture without paid APIs, vector database requirements, agents, frontend code, or automation execution.

## Service Roles

| Service | Role |
| --- | --- |
| docs-service | content source for documentation pages |
| memory-service | ingestion, chunking, mock embeddings, vector store abstraction, retrieval |
| ai-service | answer generation through the existing completion provider flow |

## Current Flow

1. Docs prepares a normalized memory document payload with `POST /api/v1/pages/{page_id}/prepare-memory-document`.
2. Memory ingests documents through its existing document APIs and automatically chunks content.
3. Memory generates deterministic mock embeddings with `POST /api/v1/embeddings/generate/{document_id}`.
4. Memory stores vectors in an in-memory vector store for local/test usage.
5. AI calls Memory semantic retrieval through `POST /api/v1/completions/rag`.
6. AI builds context from retrieved chunks and calls the existing completion provider service.

## Defaults

Memory defaults:

```text
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL_NAME=mock-embedding-v1
VECTOR_STORE_PROVIDER=in_memory
```

AI defaults:

```text
MEMORY_SERVICE_URL=http://localhost:8004
```

## Current Limits

- Mock embeddings are deterministic fake vectors.
- In-memory vector storage is not durable.
- Qdrant integration is a placeholder.
- Local embedding provider is a placeholder.
- AI provider calls remain mockable in tests and are not paid by default.

## Future Roadmap

- production embedding providers
- local embedding model selection
- Qdrant or pgvector
- hybrid keyword and semantic retrieval
- source citation quality improvements
- event-driven Docs to Memory indexing
- workspace access enforcement through Core auth context
