# Asthra Collab Service

Asthra Collab is the collaboration and communication layer for threads, messages, mentions, reactions, announcements, activity streams, and async team updates.

This MVP does not implement real AI, RAG, vector databases, agents, automation, realtime websocket, or frontend functionality.

## Run

```bash
cd services/collab-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_collab_defaults.py
```

## Docker

```bash
docker compose up --build collab-service
```

Collab is published on `http://localhost:8009`.

## Future AI Roadmap

Later tiers may add AI conversation summaries, meeting summaries, follow-up generation, and discussion extraction.
