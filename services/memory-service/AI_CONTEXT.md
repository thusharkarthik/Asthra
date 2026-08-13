# Memory Service Context

## Purpose

Workspace memory, chunking, embedding, and retrieval foundation.

## Owned Data

- Memory documents
- Chunks
- Embedding records
- Retrieval logs
- Vector metadata

## Not Owned Data

- Docs source pages
- Users
- Assistant sessions
- Production vector infrastructure

## APIs

- Document ingestion
- Chunk generation
- Embedding generation
- Semantic search
- Workspace search
- Retrieval logging

## Events Published

- MemoryDocumentCreated
- MemoryDocumentChunked
- EmbeddingGenerated
- RetrievalPerformed

## Events Consumed

- Future page published events
- Future source update events

## RBAC Rules

- Retrieval must respect workspace and project scope.
- Do not expose memory from inaccessible scopes.

## UI Screens

- Workspace search
- Memory status views

## Future Roadmap

- Production vector database
- Incremental indexing
- Retrieval quality controls
