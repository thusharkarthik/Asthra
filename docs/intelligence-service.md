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

Providers:

- `GET /api/v1/providers`

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

## Future RAG Roadmap

Later tiers may add document ingestion, embedding generation, vector search, retrieval policies, source citation, and RAG-aware completion APIs. Those features should remain separate from this MVP provider and conversation foundation.

## Future Agent Roadmap

Later tiers may add tool-aware assistants, planning workflows, approval gates, execution logs, and automation coordination. Agent behavior is intentionally out of scope for the current service foundation.
