# Asthra Automate Service

Asthra Automate is the workflow automation and orchestration foundation for triggers, conditions, actions, manual execution, schedules, and audit history.

This MVP is intentionally local and synchronous. It does not run background workers, call external integrations, execute agents, or invoke AI services.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` for local overrides.

## Run

```bash
uvicorn app.main:app --reload
```

Docker Compose publishes this service on `http://localhost:8010`.

## Tests

```bash
pytest tests
```

Tests use SQLite and override the app database dependency.

## Seed

```bash
python scripts/seed_automation_defaults.py
```

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /api/v1/workflows`
- `GET /api/v1/workflows`
- `GET /api/v1/workflows/{workflow_id}`
- `PATCH /api/v1/workflows/{workflow_id}`
- `DELETE /api/v1/workflows/{workflow_id}`
- `POST /api/v1/workflows/{workflow_id}/triggers`
- `GET /api/v1/workflows/{workflow_id}/triggers`
- `PATCH /api/v1/triggers/{trigger_id}`
- `DELETE /api/v1/triggers/{trigger_id}`
- `POST /api/v1/workflows/{workflow_id}/conditions`
- `GET /api/v1/workflows/{workflow_id}/conditions`
- `PATCH /api/v1/conditions/{condition_id}`
- `DELETE /api/v1/conditions/{condition_id}`
- `POST /api/v1/workflows/{workflow_id}/actions`
- `GET /api/v1/workflows/{workflow_id}/actions`
- `PATCH /api/v1/actions/{action_id}`
- `DELETE /api/v1/actions/{action_id}`
- `POST /api/v1/workflows/{workflow_id}/execute`
- `GET /api/v1/executions`
- `GET /api/v1/executions/{execution_id}`
- `POST /api/v1/workflows/{workflow_id}/schedule`
- `GET /api/v1/schedules`
- `PATCH /api/v1/schedules/{schedule_id}`
- `DELETE /api/v1/schedules/{schedule_id}`
- `GET /api/v1/audit-logs`

## Future Roadmap

Later tiers will add real service integrations, background execution, AI workflow generation, condition suggestions, automation recommendations, agent orchestration, and autonomous execution.
