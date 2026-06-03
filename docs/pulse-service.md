# Asthra Pulse Service

Asthra Pulse is Asthra's incident and reliability service. It manages alerts, incidents, timelines, on-call schedules, escalation policies, status pages, components, and postmortems.

## Purpose

Pulse gives teams a structured reliability workflow. AI incident summarization is optional and disabled by default.

## Entities

- `Alert`
- `Incident`
- `IncidentTimelineEvent`
- `OnCallSchedule`
- `EscalationPolicy`
- `StatusPage`
- `StatusPageComponent`
- `Postmortem`

## Endpoints

The MVP exposes alert, incident, timeline, on-call, escalation policy, status page, component, and postmortem APIs under `/api/v1`.

AI incident summary:

- `POST /api/v1/incidents/{incident_id}/ai-summary`

The AI summary response includes current situation, impact, likely cause, timeline summary, next actions, and a customer-facing update draft. Timeline events are included when available. The endpoint does not modify incident, status page, or postmortem records.

## Local Run

```bash
cd services/pulse-service
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Tests

```bash
cd services/pulse-service
pytest tests
```

## Docker

```bash
docker compose up --build pulse-service
```

The service is exposed on `http://localhost:8007`.

## AI Configuration

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

AI calls are fail-safe. If AI is disabled or the AI Service URL is missing, the endpoint returns a clean `503` response.

## Future AI Roadmap

Later tiers may add RAG-aware root cause analysis, AI outage update drafting, postmortem assistance, and anomaly pattern detection. This MVP does not auto-publish customer communications.
