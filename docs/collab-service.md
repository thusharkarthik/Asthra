# Asthra Collab Service

Asthra Collab provides collaboration primitives for comments, mentions, threads, activity streams, announcements, reactions, and async team updates.

## Purpose

Collab gives Asthra services a shared communication layer without realtime websocket, AI, RAG, agents, automation, or frontend features in this MVP.

## Entities

- Thread
- ThreadMessage
- Mention
- Reaction
- Announcement
- ActivityStreamItem
- TeamUpdate

## Run

```bash
cd services/collab-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
cd services/collab-service
pytest tests
```

## Docker

```bash
docker compose up --build collab-service
```

The service is exposed on `http://localhost:8009`.

## Future AI Roadmap

Later tiers may add AI conversation summaries, AI meeting summaries, AI follow-up generation, and AI discussion extraction. No AI calls are implemented in this MVP.
