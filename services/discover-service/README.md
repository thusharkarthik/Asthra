# Asthra Discover Service

Asthra Discover is the product discovery and innovation planning app. It manages ideas, feature requests, feedback, impact scoring, validation notes, MVP plans, and roadmap items.

This MVP does not implement real AI calls, RAG, vector databases, agents, automation, or frontend functionality.

## Setup

```bash
cd services/discover-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Open:

- `http://localhost:8000/`
- `http://localhost:8000/docs`
- `http://localhost:8000/health`
- `http://localhost:8000/ready`

## Tests

```bash
cd services/discover-service
pytest tests
```

## Seed Data

```bash
cd services/discover-service
python scripts/seed_discover_defaults.py
```

## Docker

From the repository root:

```bash
docker compose up --build discover-service
```

The service is published on `http://localhost:8005`.

## Endpoints

Ideas:

- `POST /api/v1/ideas`
- `GET /api/v1/ideas`
- `GET /api/v1/ideas/{idea_id}`
- `PATCH /api/v1/ideas/{idea_id}`
- `DELETE /api/v1/ideas/{idea_id}`

Feature requests:

- `POST /api/v1/feature-requests`
- `GET /api/v1/feature-requests`
- `GET /api/v1/feature-requests/{feature_request_id}`
- `PATCH /api/v1/feature-requests/{feature_request_id}`
- `DELETE /api/v1/feature-requests/{feature_request_id}`

Feedback:

- `POST /api/v1/feedback`
- `GET /api/v1/feedback`

Idea planning:

- `POST /api/v1/ideas/{idea_id}/impact-score`
- `GET /api/v1/ideas/{idea_id}/impact-score`
- `POST /api/v1/ideas/{idea_id}/validation-notes`
- `GET /api/v1/ideas/{idea_id}/validation-notes`
- `POST /api/v1/ideas/{idea_id}/mvp-plan`
- `GET /api/v1/ideas/{idea_id}/mvp-plan`
- `PATCH /api/v1/ideas/{idea_id}/mvp-plan`

Roadmap:

- `POST /api/v1/roadmap-items`
- `GET /api/v1/roadmap-items`
- `PATCH /api/v1/roadmap-items/{roadmap_item_id}`
- `DELETE /api/v1/roadmap-items/{roadmap_item_id}`

## Future AI Roadmap

Future tiers may add AI feasibility analysis, competitor analysis, MVP planning assistance, monetization analysis, and evidence summarization. These are TODO placeholders only in this MVP.
