# Asthra RAG Foundation

Phase 2 connects source services, Memory, and Intelligence into the first RAG-ready architecture without paid APIs, vector database requirements, agents, frontend code, or automation execution.

## Service Roles

| Service | Role |
| --- | --- |
| docs-service | content source for documentation pages |
| flow-service | work item source |
| discover-service | idea and feature request source |
| desk-service | support ticket source |
| pulse-service | incident source |
| dev-service | release source |
| collab-service | discussion thread source |
| memory-service | ingestion, chunking, mock embeddings, vector store abstraction, retrieval, workspace search |
| ai-service | answer generation through the existing completion provider flow |

## Current Flow

1. Source services prepare normalized memory payloads with `prepare-memory-document` endpoints.
2. Memory ingests normalized payloads with `POST /api/v1/ingest`.
3. Memory chunks content, generates deterministic mock embeddings, and indexes vectors.
4. Memory supports document semantic retrieval and workspace search.
5. AI calls Memory through `POST /api/v1/completions/rag` or `POST /api/v1/completions/workspace-rag`.
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
