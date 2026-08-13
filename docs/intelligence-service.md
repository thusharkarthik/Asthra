# Asthra Intelligence Service

Asthra Intelligence is the AI foundation service for Asthra. In this tier it provides the data model and API foundation for provider configuration, prompt templates, conversations, messages, and request logging.

This document describes the current MVP only. RAG, vector databases, agents, automation, streaming, and frontend features are planned for later tiers and are not implemented here.

## Purpose

Asthra Intelligence centralizes AI provider access and reusable AI interaction records so other Asthra services can later request AI capabilities through a consistent service boundary.

Current responsibilities:

- Store AI provider metadata.
- Manage reusable prompt templates.
- Store conversations and messages.
- Execute simple non-streaming chat completions through provider adapters.
- Orchestrate read-only assistant sessions and chat.
- Record request log metadata for observability.

## Provider Abstraction

The service uses provider adapters under `app/providers/`.

Current adapters:

- OpenRouter
- Groq

Each adapter follows the same interface:

- `generate_completion()`
- `health_check()`

`ProviderService` resolves an active provider from the database or environment configuration, builds the matching adapter, executes the request, and writes an `AIRequestLog` when possible.

## Entities

- `AIProvider`: provider name, provider type, base URL, model name, and active state.
- `PromptTemplate`: reusable system prompts grouped by category.
- `Conversation`: user or workspace-scoped conversation metadata.
- `ConversationMessage`: ordered conversation messages with role, content, and optional token count.
- `AIRequestLog`: provider request metadata, token usage, status, and latency.
- `AssistantSession`: workspace-scoped assistant session.
- `AssistantMessage`: user and assistant message history.
- `AssistantContext`: retrieved context used for assistant responses.
- `AssistantToolCall`: read-only tool usage tracking.
- `AssistantResponse`: generated assistant answer and retrieval metadata.

## Endpoints

Health:

- `GET /health`
- `GET /ready`

Prompt templates:

- `POST /api/v1/prompts`
- `GET /api/v1/prompts`
- `GET /api/v1/prompts/{prompt_id}`
- `PATCH /api/v1/prompts/{prompt_id}`
- `DELETE /api/v1/prompts/{prompt_id}`

Conversations:

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/{conversation_id}`
- `DELETE /api/v1/conversations/{conversation_id}`
- `POST /api/v1/conversations/{conversation_id}/messages`
- `GET /api/v1/conversations/{conversation_id}/messages`

Completions:

- `POST /api/v1/completions/chat`
- `POST /api/v1/completions/rag`
- `POST /api/v1/completions/workspace-rag`

Providers:

- `GET /api/v1/providers`

Assistant:

- `POST /api/v1/assistant/sessions`
- `GET /api/v1/assistant/sessions`
- `GET /api/v1/assistant/sessions/{session_id}`
- `DELETE /api/v1/assistant/sessions/{session_id}`
- `POST /api/v1/assistant/sessions/{session_id}/messages`
- `GET /api/v1/assistant/sessions/{session_id}/messages`
- `POST /api/v1/assistant/chat`

Provider management remains intentionally minimal in this tier.

## Local Run

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The default SQLite database is `asthra_intelligence.db`.

## Provider Configuration

Configure provider keys through environment variables. Do not hardcode secrets.

```text
OPENROUTER_API_KEY=
GROQ_API_KEY=
AI_PROVIDER_TIMEOUT_SECONDS=30
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
GROQ_DEFAULT_MODEL=llama-3.1-8b-instant
```

## Seed Data

```bash
cd services/ai-service
python scripts/seed_ai_defaults.py
```

The seed script creates default OpenRouter and Groq provider records plus sample prompt templates.

## Tests

```bash
cd services/ai-service
pytest tests
```

Tests use SQLite and mocked provider responses. They do not call external AI services.

## Docker

From the repository root:

```bash
docker compose up --build ai-service
```

The compose service exposes Asthra Intelligence on `http://localhost:8003`.

## RAG Foundation

`POST /api/v1/completions/rag` calls Memory semantic retrieval, builds context from returned chunks, and then uses the existing completion provider flow.

Request fields:

- `query`
- `workspace_id`
- `memory_service_url`
- `top_k`
- `provider`
- `model`
- `system_prompt`

`MEMORY_SERVICE_URL` provides the default Memory URL. Tests mock both Memory retrieval and AI providers, so no external services or paid APIs are required.

`POST /api/v1/completions/workspace-rag` calls Memory workspace search, builds context across indexed workspace sources, and then uses the existing completion provider flow.

Workspace RAG request fields:

- `query`
- `workspace_id`
- `memory_service_url`
- `top_k`
- `provider`
- `model`
- `system_prompt`

## Future RAG Roadmap

Later tiers may add event-driven indexing, stronger source citations, retrieval policies, production embeddings, vector database integration, and gateway-mediated cross-service auth.

## Current AI Feature Consumers

The AI feature packs use `POST /api/v1/completions/chat` from:

- Discover idea analysis
- Flow task breakdown
- Docs page summary
- Desk ticket classification
- Pulse incident summary
- Dev release summary

These consumers keep AI optional with `AI_FEATURES_ENABLED=false` by default and mock AI calls in tests.

## Assistant Foundation

`POST /api/v1/assistant/chat` creates or continues a workspace-scoped assistant session, retrieves workspace context from Memory, records read-only tool usage, calls the existing completion provider flow, and stores the response.

The assistant is not an agent. It does not mutate downstream services or execute automation.

## Future Agent Roadmap

Later tiers may add tool-aware assistants, planning workflows, approval gates, execution logs, and automation coordination. Agent behavior is intentionally out of scope for the current service foundation.
