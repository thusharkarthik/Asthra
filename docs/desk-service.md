# Asthra Desk Service

Asthra Desk is Asthra's service management app for support tickets, service requests, queues, SLAs, approvals, incidents, escalations, change requests, and ticket comments.

## Purpose

Desk gives teams a foundation for structured service operations without adding AI, automation, or frontend complexity in the MVP.

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

Tickets support CRUD plus comments, approvals, and escalations. Queues and SLAs support create/list. Incidents and change requests support create/list/get/update.

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

## Future AI Roadmap

Later tiers may add:

- AI ticket classification
- AI routing
- AI incident summaries
- AI duplicate detection
- AI resolution suggestions

No AI calls are implemented in this MVP.
