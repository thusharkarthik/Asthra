# Cross-Service Memory Payloads

Asthra services expose normalized memory payload endpoints so Memory can ingest knowledge without direct cross-service database access.

These endpoints return payloads only. They do not call `memory-service` automatically.

## Payload Contract

```json
{
  "source_type": "support_ticket",
  "external_reference": "support_ticket:123",
  "workspace_id": 1,
  "title": "Login issue",
  "content": "User cannot sign in...",
  "metadata": {}
}
```

## Source Endpoints

| Service | Endpoint | Source Type |
| --- | --- | --- |
| Docs | `POST /api/v1/pages/{page_id}/prepare-memory-document` | `docs_page` |
| Flow | `POST /api/v1/work-items/{work_item_id}/prepare-memory-document` | `work_item` |
| Discover | `POST /api/v1/ideas/{idea_id}/prepare-memory-document` | `idea` |
| Desk | `POST /api/v1/tickets/{ticket_id}/prepare-memory-document` | `support_ticket` |
| Pulse | `POST /api/v1/incidents/{incident_id}/prepare-memory-document` | `incident` |
| Dev | `POST /api/v1/releases/{release_id}/prepare-memory-document` | `release` |
| Collab | `POST /api/v1/threads/{thread_id}/prepare-memory-document` | `discussion_thread` |

Flow work items currently do not store `workspace_id` directly. The payload uses `workspace_id=0` with project metadata until Core-backed project-to-workspace resolution is introduced.

## Adoption Pattern

1. Source service returns normalized payload.
2. API Gateway or a future indexing worker sends the payload to `POST /api/v1/ingest`.
3. Memory chunks, embeds, indexes, and logs retrieval.
4. AI Service uses Memory workspace search for workspace-aware RAG.

## Safety Rules

- Source services remain the owners of their domain data.
- Memory stores knowledge copies for retrieval.
- No source service depends on Memory availability yet.
- No automatic indexing runs in this foundation.
- No agents or automation execution are involved.
