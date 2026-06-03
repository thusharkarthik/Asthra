# Asthra AI Feature Pack 1

This pack introduces the first platform-aware AI features across Discover, Flow, and Docs using the existing Intelligence service completion API.

No frontend, agents, automation execution, cache layer, or paid API usage is required by default.

## Features

| Service | Endpoint | Purpose |
| --- | --- | --- |
| discover-service | `POST /api/v1/ideas/{idea_id}/ai-analysis` | Analyze product ideas |
| flow-service | `POST /api/v1/work-items/{work_item_id}/ai-breakdown` | Break work into subtasks/checklists |
| docs-service | `POST /api/v1/pages/{page_id}/ai-summary` | Summarize page content |

## Configuration

Each participating service supports:

```text
AI_SERVICE_URL=
AI_FEATURES_ENABLED=false
```

AI features are disabled by default. Tests mock AI Service responses and never call real providers.

## Fail-Safe Behavior

- Missing `AI_SERVICE_URL` returns a clean service-unavailable error.
- Disabled `AI_FEATURES_ENABLED` returns a clean service-unavailable error.
- AI Service timeout returns a gateway timeout error.
- AI Service network failure returns a bad gateway error.

## Future Improvements

- RAG-aware idea/page analysis using Memory.
- Auto-create Flow subtasks after explicit user approval.
- Store Docs summaries as versioned page metadata.
- Feed AI outputs into Automation only after automation execution is explicitly implemented.
