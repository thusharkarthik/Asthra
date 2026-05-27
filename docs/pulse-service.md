# Asthra Pulse Service

Asthra Pulse is Asthra's incident and reliability service. It manages alerts, incidents, timelines, on-call schedules, escalation policies, status pages, components, and postmortems.

## Purpose

Pulse gives teams a structured reliability workflow before adding advanced AI or automation.

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

## Future AI Roadmap

Later tiers may add AI root cause analysis, AI incident summaries, AI outage update drafting, and AI anomaly pattern detection. No AI calls are implemented in this MVP.
