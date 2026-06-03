# Asthra Pulse Service

Asthra Pulse is the incident and reliability app for alerts, incidents, on-call schedules, escalation policies, status pages, postmortems, and root cause tracking.

This MVP includes optional AI incident summaries through `ai-service`. RAG, vector databases, agents, automation, and frontend functionality are not implemented here.

## Setup

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

## Seed

```bash
python scripts/seed_pulse_defaults.py
```

## Docker

```bash
docker compose up --build pulse-service
```

Pulse is published on `http://localhost:8007`.

## Endpoints

Alerts, incidents, timeline events, on-call schedules, escalation policies, status pages, components, and postmortems are available under `/api/v1`.

AI endpoint:

- `POST /api/v1/incidents/{incident_id}/ai-summary`

## AI Configuration

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

AI summaries are disabled by default and return a clean `503` when disabled or unconfigured. They do not automatically update incident, status page, or postmortem records.

## Future AI Roadmap

Future tiers may add RAG-aware root cause analysis, outage update drafting, postmortem assistance, and anomaly pattern detection.
