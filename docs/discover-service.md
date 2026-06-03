# Asthra Discover Service

Asthra Discover is Asthra's product discovery and innovation planning service. It helps teams capture product ideas, feature requests, customer feedback, validation notes, MVP plans, impact scores, and roadmap items.

This service is not a frontend. AI features are optional and call Asthra Intelligence only when explicitly enabled.

## Purpose

Discover provides the early product planning layer before work enters delivery workflows. It keeps product signals structured enough to compare, validate, and plan.

## Entities

- `Idea`: product opportunity or problem to explore.
- `FeatureRequest`: requested capability from customers, internal teams, or market signals.
- `Feedback`: qualitative signal connected to an idea or feature request.
- `ImpactScore`: numeric scoring for reach, impact, confidence, and effort.
- `ValidationNote`: research, experiment, interview, or analysis note.
- `MVPPlan`: scoped plan for testing or shipping the minimum useful version.
- `RoadmapItem`: planned product direction item linked optionally to an idea.

## Endpoints

Ideas:

- `POST /api/v1/ideas`
- `GET /api/v1/ideas`
- `GET /api/v1/ideas/{idea_id}`
- `PATCH /api/v1/ideas/{idea_id}`
- `DELETE /api/v1/ideas/{idea_id}`
- `POST /api/v1/ideas/{idea_id}/ai-analysis`

Feature requests:

- `POST /api/v1/feature-requests`
- `GET /api/v1/feature-requests`
- `GET /api/v1/feature-requests/{feature_request_id}`
- `PATCH /api/v1/feature-requests/{feature_request_id}`
- `DELETE /api/v1/feature-requests/{feature_request_id}`

Feedback:

- `POST /api/v1/feedback`
- `GET /api/v1/feedback`

Planning:

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

## Local Run

```bash
cd services/discover-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

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

The service is exposed on `http://localhost:8005`.

## AI Idea Analysis

`POST /api/v1/ideas/{idea_id}/ai-analysis` analyzes an idea and stores the result in `IdeaAIAnalysis`.

The response includes summary, problem clarity, target users, feasibility, risks, MVP suggestion, monetization angle, and next steps.

Configuration:

```text
AI_SERVICE_URL=
AI_FEATURES_ENABLED=false
```

The feature is disabled by default and tests mock AI Service.

## Future AI Roadmap

Later tiers may add:

- AI competitor analysis
- AI MVP planning support
- AI monetization analysis
- AI feedback clustering and summarization

Future improvements should add RAG-aware product context from Memory and optional automation handoff after explicit approval.
