# AI Feature Pack 2

Asthra AI Feature Pack 2 adds optional AI-assisted workflows to Desk, Pulse, and Dev using the existing Intelligence Service chat completion endpoint.

These features are fail-safe by design. AI calls are disabled by default, no provider is called unless the service is configured, and failed AI calls do not change the underlying ticket, incident, or release records.

## Features

### Desk: Ticket Classification

Endpoint:

- `POST /api/v1/tickets/{ticket_id}/ai-classify`

Behavior:

- Loads the service ticket.
- Builds a structured classification prompt.
- Calls `ai-service` through `POST /api/v1/completions/chat`.
- Returns category, priority suggestion, severity suggestion, routing suggestion, duplicate hints, and recommended next action.

The endpoint does not automatically update ticket fields. Future tiers may allow reviewed or policy-controlled auto-application.

### Pulse: Incident Summary

Endpoint:

- `POST /api/v1/incidents/{incident_id}/ai-summary`

Behavior:

- Loads the incident.
- Includes timeline events when available.
- Calls `ai-service` through `POST /api/v1/completions/chat`.
- Returns current situation, impact, likely cause, timeline summary, next actions, and a customer-facing update draft.

The endpoint does not update the incident, postmortem, or status page automatically.

### Dev: Release Summary

Endpoint:

- `POST /api/v1/releases/{release_id}/ai-summary`

Behavior:

- Loads the release.
- Includes linked service and deployment context when simple.
- Calls `ai-service` through `POST /api/v1/completions/chat`.
- Returns release overview, shipped changes, deployment risk, rollback considerations, stakeholder summary, and QA notes.

The endpoint does not modify release records automatically.

## Configuration

Each participating service supports:

```text
AI_SERVICE_URL=http://localhost:8003
AI_FEATURES_ENABLED=false
```

`AI_FEATURES_ENABLED` defaults to `false`. If AI is disabled or `AI_SERVICE_URL` is not configured, the feature endpoint returns a clean `503` response.

## Testing

Tests mock the AI Service HTTP call. They do not call real AI providers.

```bash
cd services/desk-service
pytest tests/test_ai_classification.py

cd services/pulse-service
pytest tests/test_ai_incident_summary.py

cd services/dev-service
pytest tests/test_ai_release_summary.py
```

## Future Work

- Add RAG-aware context from Docs and Memory where useful.
- Route AI calls through the API Gateway once gateway auth propagation is ready.
- Add reviewed auto-apply workflows through Automate.
- Store structured AI outputs for historical analysis where product value is clear.
