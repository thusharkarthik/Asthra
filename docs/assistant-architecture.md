# Assistant Architecture

Asthra Assistant sits inside `ai-service` and coordinates provider completion, workspace memory retrieval, and read-only tool tracking.

## Components

| Component | Responsibility |
| --- | --- |
| Assistant API | Session, message, and chat endpoints |
| Assistant Service | Orchestrates chat flow and persistence |
| Context Service | Retrieves workspace memory and builds context text |
| Tool Registry | Lists read-only placeholder tools |
| Provider Service | Calls configured completion provider |
| Event Publisher | Publishes no-op-safe assistant lifecycle events |

## Data Model

- `AssistantSession`: workspace-scoped assistant conversation.
- `AssistantMessage`: user and assistant message history.
- `AssistantContext`: retrieved chunks and source metadata.
- `AssistantToolCall`: read-only tool usage tracking.
- `AssistantResponse`: generated answer and retrieval metadata.

## Context Retrieval

The assistant calls Memory workspace search:

- `POST /api/v1/workspace-search`

Retrieved context may include:

- docs pages
- work items
- ideas
- support tickets
- incidents
- releases
- discussion threads

## Prompt Assembly

The assistant prompt includes:

- recent conversation history
- retrieved workspace context
- read-only tool usage summary
- user request

The system prompt explicitly states that the assistant must not take autonomous actions.

## Boundaries

- No frontend implementation.
- No autonomous agents.
- No service mutations through tools.
- No automation execution.
- No cache layer.
- No direct cross-service database access.
