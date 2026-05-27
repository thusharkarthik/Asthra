# Asthra Pulse Service

Asthra Pulse is the incident and reliability app for alerts, incidents, on-call schedules, escalation policies, status pages, postmortems, and root cause tracking.

This MVP does not implement real AI, RAG, vector databases, agents, automation, or frontend functionality.

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

## Future AI Roadmap

Future tiers may add AI root cause analysis, incident summaries, outage update drafting, and anomaly pattern detection. These are TODO placeholders only.
