# ADR 0006: Memory Service for RAG

## Status

Accepted

## Context

RAG requires ingestion, chunking, retrieval, embeddings, source metadata, and future vector infrastructure. These concerns are distinct from LLM provider access and from the services that own source content.

## Decision

Use `memory-service` as the owner of RAG memory foundations: knowledge sources, documents, chunks, embedding records, retrieval logs, and future vector integration.

## Consequences

- Source services keep ownership of original content.
- Memory owns derived retrieval artifacts.
- AI can later request context from Memory before calling providers.
- Permission-aware retrieval and indexing freshness must be handled in future tiers.
