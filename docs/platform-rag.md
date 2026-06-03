# Platform RAG

Platform RAG connects source services, Memory, and Intelligence into a workspace-aware retrieval and answer-generation flow.

## Current Architecture

| Layer | Responsibility |
| --- | --- |
| Source services | Prepare normalized memory documents |
| memory-service | Ingest, chunk, embed, index, retrieve |
| ai-service | Retrieve context and generate answers |
| event-service | Future indexing and re-indexing backbone |

## Workspace RAG Flow

1. A source service exposes a memory payload, such as a ticket, incident, page, work item, or release.
2. Memory ingests the payload through `POST /api/v1/ingest`.
3. Memory creates chunks and mock embeddings.
4. Memory indexes vectors in the in-memory vector store.
5. AI Service calls `POST /api/v1/workspace-search`.
6. AI Service builds a prompt with retrieved workspace context.
7. AI Service calls the existing chat completion provider flow.

AI endpoint:

- `POST /api/v1/completions/workspace-rag`

Request:

```json
{
  "workspace_id": 1,
  "query": "What is blocking customer onboarding?",
  "top_k": 5
}
```

Response includes:

- answer
- source chunks
- provider/model
- retrieval metadata

## Defaults

Memory:

```text
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL_NAME=mock-embedding-v1
VECTOR_STORE_PROVIDER=in_memory
```

AI:

```text
MEMORY_SERVICE_URL=http://localhost:8004
```

## Current Limits

- Mock embeddings are deterministic development vectors.
- In-memory vectors are not durable.
- Workspace access enforcement is not yet propagated from Core.
- Source services do not auto-index themselves.
- Event-driven indexing is planned but not active.

## Future Roadmap

- Qdrant or pgvector
- Hybrid keyword and semantic retrieval
- Event-driven indexing after source updates
- RAG-aware AI features across Desk, Pulse, Dev, Flow, Docs, Discover, and Collab
- Knowledge graph relationships
- Agent memory with user-approved execution
