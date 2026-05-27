# Asthra Desk Service

Asthra Desk is the service management app for support tickets, service requests, queues, SLAs, approvals, incidents, escalations, change requests, and ticket comments.

This MVP does not implement real AI, RAG, vector databases, agents, automation, or frontend functionality.

## Setup

```bash
cd services/desk-service
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
cd services/desk-service
pytest tests
```

## Seed Data

```bash
cd services/desk-service
python scripts/seed_desk_defaults.py
```

## Docker

```bash
docker compose up --build desk-service
```

Desk is published on `http://localhost:8006`.

## Endpoints

- `POST /api/v1/tickets`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{ticket_id}`
- `PATCH /api/v1/tickets/{ticket_id}`
- `DELETE /api/v1/tickets/{ticket_id}`
- `POST /api/v1/queues`
- `GET /api/v1/queues`
- `POST /api/v1/slas`
- `GET /api/v1/slas`
- `POST /api/v1/tickets/{ticket_id}/approvals`
- `GET /api/v1/tickets/{ticket_id}/approvals`
- `PATCH /api/v1/approvals/{approval_id}`
- `POST /api/v1/incidents`
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/{incident_id}`
- `PATCH /api/v1/incidents/{incident_id}`
- `POST /api/v1/tickets/{ticket_id}/escalations`
- `GET /api/v1/tickets/{ticket_id}/escalations`
- `POST /api/v1/change-requests`
- `GET /api/v1/change-requests`
- `GET /api/v1/change-requests/{change_request_id}`
- `PATCH /api/v1/change-requests/{change_request_id}`
- `POST /api/v1/tickets/{ticket_id}/comments`
- `GET /api/v1/tickets/{ticket_id}/comments`

## Future AI Roadmap

Later tiers may add AI ticket classification, routing, incident summaries, duplicate detection, and resolution suggestions. These are TODO placeholders only in this MVP.
