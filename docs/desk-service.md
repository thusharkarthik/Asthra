# Asthra Desk Service

Asthra Desk is Asthra's service management app for support tickets, service requests, queues, SLAs, approvals, incidents, escalations, change requests, and ticket comments.

## Purpose

Desk gives teams a foundation for structured service operations. AI assistance is optional and disabled by default.

## Entities

- `ServiceTicket`: support or service request record.
- `ServiceQueue`: team or intake queue.
- `SLA`: response and resolution expectations by priority.
- `Approval`: approval workflow record for a ticket.
- `Incident`: reliability or service-impacting event.
- `Escalation`: ticket escalation record.
- `ChangeRequest`: operational change request.
- `TicketComment`: conversation on a ticket.

## Endpoints

Tickets support CRUD plus comments, approvals, escalations, and optional AI classification. Queues and SLAs support create/list. Incidents and change requests support create/list/get/update.

AI ticket classification:

- `POST /api/v1/tickets/{ticket_id}/ai-classify`

The AI classification response includes category, priority suggestion, severity suggestion, routing suggestion, duplicate hints, and recommended next action. It does not automatically update ticket fields.

API docs are available at `/docs` when the service is running.

## Local Run

```bash
cd services/desk-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

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

The service is exposed on `http://localhost:8006`.

## AI Configuration

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

AI calls are fail-safe. If AI is disabled or the AI Service URL is missing, the endpoint returns a clean `503` response.

## Future AI Roadmap

Later tiers may add:

- AI routing
- AI incident summaries
- AI duplicate detection
- AI resolution suggestions

Ticket classification can later feed reviewed routing or automation workflows, but this MVP does not auto-apply AI output.
