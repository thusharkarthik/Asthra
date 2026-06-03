# Workspace Memory Foundation

Workspace Memory is Asthra's first platform-wide knowledge layer. It lets services expose normalized knowledge payloads that Memory can ingest, chunk, embed, index, and search.

This foundation is local/free by default. It uses mock embeddings and an in-memory vector store unless configured otherwise.

## Source Registry

Memory supports these source types:

- `docs_page`
- `work_item`
- `idea`
- `feature_request`
- `support_ticket`
- `incident`
- `release`
- `discussion_thread`

Source ownership:

| Source Type | Owning Service |
| --- | --- |
| `docs_page` | docs-service |
| `work_item` | flow-service |
| `idea` | discover-service |
| `feature_request` | discover-service |
| `support_ticket` | desk-service |
| `incident` | pulse-service |
| `release` | dev-service |
| `discussion_thread` | collab-service |

Services own their source records. Memory owns ingested documents, chunks, embeddings, retrieval logs, and workspace search.

## Collections

Memory collections organize knowledge scopes such as:

- Workspace Knowledge
- Project Knowledge
- Support Knowledge
- Engineering Knowledge

Endpoints:

- `POST /api/v1/collections`
- `GET /api/v1/collections`
- `GET /api/v1/collections/{collection_id}`
- `PATCH /api/v1/collections/{collection_id}`
- `DELETE /api/v1/collections/{collection_id}`

## Ingestion Lifecycle

Generic ingestion endpoint:

- `POST /api/v1/ingest`

Request shape:

```json
{
  "source_type": "docs_page",
  "external_reference": "page:42",
  "workspace_id": 1,
  "title": "Workspace onboarding",
  "content": "Page content...",
  "metadata": {
    "page_id": 42
  }
}
```

Behavior:

1. Validates and normalizes the source type.
2. Creates or reuses a `KnowledgeSource`.
3. Creates a `KnowledgeDocument`.
4. Chunks the document.
5. Generates mock embeddings by default.
6. Upserts vectors into the in-memory vector store.
7. Publishes no-op-safe Memory events when configured.

Response:

```json
{
  "source_id": 1,
  "document_id": 1,
  "chunks_created": 2,
  "embeddings_created": 2,
  "source_type": "docs_page",
  "external_reference": "page:42"
}
```

## Workspace Search

Endpoint:

- `POST /api/v1/workspace-search`

Request:

```json
{
  "workspace_id": 1,
  "query": "login failures",
  "top_k": 5
}
```

Returns source type, title, chunk text, relevance score, source reference, document ID, chunk ID, and metadata.

## Events

Memory publishes through optional no-op-safe event publishing:

- `memory.document.ingested`
- `memory.document.chunked`
- `memory.embedding.generated`
- `memory.workspace.search`

If `EVENT_PUBLISHING_ENABLED=false` or `EVENT_SERVICE_URL` is missing, events are skipped without failing the main request.

## Future Roadmap

- Durable vector store with Qdrant or pgvector
- Knowledge graph relationships between sources
- Core-auth-aware workspace filtering
- Event-driven re-indexing
- Agent memory and task context
- RAG evaluation and citation quality checks
