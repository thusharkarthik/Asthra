# Asthra AI Assistant Foundation

Asthra AI Assistant is a platform-wide AI orchestration layer for answering workspace questions with context from Docs, Flow, Discover, Desk, Pulse, Dev, Collab, and Memory.

This is not an autonomous agent. It is read-only, does not execute mutations, and does not run automation.

## Lifecycle

1. A client creates or reuses an assistant session.
2. The user sends a message.
3. The assistant stores the user message.
4. The context builder queries workspace memory.
5. Read-only placeholder tools are recorded where useful.
6. The assistant builds a prompt from conversation history, retrieved context, and tool usage.
7. AI Service calls the existing completion provider flow.
8. The assistant stores the assistant response and retrieval metadata.

## Endpoints

Sessions:

- `POST /api/v1/assistant/sessions`
- `GET /api/v1/assistant/sessions`
- `GET /api/v1/assistant/sessions/{session_id}`
- `DELETE /api/v1/assistant/sessions/{session_id}`

Messages:

- `POST /api/v1/assistant/sessions/{session_id}/messages`
- `GET /api/v1/assistant/sessions/{session_id}/messages`

Chat:

- `POST /api/v1/assistant/chat`

Request:

```json
{
  "workspace_id": 1,
  "session_id": null,
  "message": "What is blocking onboarding?",
  "user_id": 10,
  "provider": "openrouter",
  "top_k": 5
}
```

Response includes:

- answer
- sources
- context metadata
- read-only tool usage
- provider/model

## Stored Assistant Memory

Assistant stores:

- `AssistantSession`
- `AssistantMessage`
- `AssistantContext`
- `AssistantToolCall`
- `AssistantResponse`

This supports conversation continuity and auditability of retrieved context.

## Events

Events are no-op-safe and disabled unless event publishing is configured:

- `ai.assistant.session.created`
- `ai.assistant.message.created`
- `ai.assistant.response.generated`

## Current Limits

- Tools are placeholders.
- Tools are read-only.
- Memory retrieval uses workspace search.
- There is no autonomous planning or execution.
- There is no frontend assistant panel yet.

## Future Agent Readiness

The assistant foundation creates the tracking primitives needed for future agents:

- sessions
- history
- retrieved context
- tool usage logs
- response records

Future tiers can add approval gates, action policies, and automation execution without changing the read-only assistant contract.
