# Asthra RAG Architecture Plan

RAG is planned but not implemented in the current foundation.

## Ownership

- `docs-service` owns pages and knowledge documentation.
- `memory-service` owns ingestion, chunking, embedding records, retrieval, and future vector integration.
- `ai-service` owns prompt construction and LLM calls.

## Planned Flow

1. Source content is created or updated in services such as Docs.
2. Events notify Memory that content may need indexing.
3. Memory ingests and chunks content.
4. Future embedding providers create vectors.
5. Retrieval returns context to AI.
6. AI generates responses using controlled prompts and retrieved context.

## Current Constraints

- No vector database yet.
- No semantic retrieval yet.
- No automatic cross-service indexing yet.
- No agentic RAG workflows yet.

## Future Work

- vector DB integration
- embedding generation
- semantic retrieval
- indexing jobs
- source freshness and permissions
- auditability and governance
