# Asthra Intelligence Service

Asthra Intelligence is the foundation service for AI capabilities across Asthra. The current MVP supports provider metadata, prompt templates, conversations, messages, request logs, and non-streaming chat completion calls through provider adapters.

This service does not implement RAG, vector databases, agents, automation, or frontend functionality yet.

## Scope

Initial Intelligence entities:

- AI providers
- Prompt templates
- Conversations
- Conversation messages
- AI request logs

## Setup

```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Health endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

API routes are mounted under `/api/v1`.

## Environment Variables

```text
APP_NAME=asthra-intelligence-service
APP_VERSION=0.1.0
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
ASTHRA_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=sqlite:///./asthra_intelligence.db
```

## Current Structure

```text
app/
  api/v1/          Versioned placeholder routers.
  core/            Configuration, responses, and exception handlers.
  db/              SQLAlchemy base and session.
  models/          Initial Intelligence SQLAlchemy models.
  providers/       Provider adapter interfaces and implementations.
  prompts/         Reserved for prompt assets and helpers later.
  schemas/         Pydantic request and response schemas.
  services/        Business logic for providers, prompts, and conversations.
  utils/           Reserved for shared helpers.
scripts/           Seed scripts.
tests/             SQLite-backed service tests.
```

## API Areas

- `/api/v1/providers`
- `/api/v1/prompts`
- `/api/v1/conversations`
- `/api/v1/completions`

Provider management APIs are still placeholders. Prompt templates, conversations, messages, and chat completions are implemented at MVP level.

## Prompt Template Endpoints

### Create Prompt

```http
POST /api/v1/prompts
```

Request:

```json
{
  "name": "Concise assistant",
  "category": "general",
  "system_prompt": "You are concise and practical."
}
```

### List Prompts

```http
GET /api/v1/prompts
```

Optional query parameter:

- `category`

### Get, Update, Delete Prompt

```http
GET /api/v1/prompts/{prompt_id}
PATCH /api/v1/prompts/{prompt_id}
DELETE /api/v1/prompts/{prompt_id}
```

Delete performs a soft delete by setting `is_active` to `false`.

## Conversation Endpoints

### Create Conversation

```http
POST /api/v1/conversations
```

Request:

```json
{
  "workspace_id": 1,
  "user_id": 1,
  "title": "Planning discussion"
}
```

If `title` is omitted, the service uses `Untitled conversation`. AI-assisted title generation is a future TODO and is not implemented yet.

### List Conversations

```http
GET /api/v1/conversations
```

Optional query parameters:

- `workspace_id`
- `user_id`

### Get And Delete Conversation

```http
GET /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
```

### Conversation Messages

```http
POST /api/v1/conversations/{conversation_id}/messages
GET /api/v1/conversations/{conversation_id}/messages
```

Request:

```json
{
  "role": "user",
  "content": "Summarize this discussion.",
  "token_count": null
}
```

Provider calls, advanced prompt execution, RAG, vector search, agents, and automation will be added only in later controlled tiers.

## Provider Setup

The current MVP supports non-streaming chat completions through provider adapters for:

- OpenRouter
- Groq

Set provider API keys in `.env`; do not hardcode secrets:

```text
OPENROUTER_API_KEY=
GROQ_API_KEY=
AI_PROVIDER_TIMEOUT_SECONDS=30
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
GROQ_DEFAULT_MODEL=llama-3.1-8b-instant
```

Provider resolution is intentionally simple:

- If `provider` is supplied in the request, Asthra resolves that active provider or environment-backed adapter.
- If `provider` is omitted, Asthra uses the first active database provider or the first configured environment provider.
- Supported provider values are `openrouter` and `groq`.

## Completion Endpoint

```http
POST /api/v1/completions/chat
```

Request:

```json
{
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "system_prompt": "You are a concise assistant.",
  "messages": [
    {
      "role": "user",
      "content": "Summarize Asthra Intelligence."
    }
  ],
  "temperature": 0.2,
  "max_tokens": 256
}
```

Response:

```json
{
  "generated_text": "Asthra Intelligence is...",
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

Each provider call is logged to `ai_request_logs` when possible. This endpoint is not streaming and does not use RAG, vector search, agents, or automation.

## Tests

Tests use a local SQLite database under `tests/` and mock provider completion behavior. They do not call OpenRouter, Groq, or any external AI provider.

```bash
cd services/ai-service
pytest tests
```

Optional coverage:

```bash
pytest --cov=app tests
```

## Seed Defaults

Seed default provider records and sample prompt templates:

```bash
cd services/ai-service
python scripts/seed_ai_defaults.py
```

The seed script is idempotent and creates tables if they do not already exist.

## Docker

Run through the root compose file:

```bash
cd ../..
docker compose up --build ai-service
```

The compose service maps Asthra Intelligence to `http://localhost:8003` and stores SQLite data in a Docker volume.

## Optional Event Publishing

AI Service can publish `ai.completion.generated` after successful chat completions.

```env
EVENT_SERVICE_URL=
EVENT_PUBLISHING_ENABLED=false
```

Publishing is disabled by default and fail-safe.
