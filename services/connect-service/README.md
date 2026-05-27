# Asthra Connect Service

Asthra Connect is the integration and connectivity platform for external systems, webhooks, connector definitions, API connections, sync jobs, and event subscriptions.

This MVP stores integration metadata and placeholder connector definitions only. It does not call external systems, run async workers, deliver webhooks, or execute automation.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

Docker Compose publishes this service on `http://localhost:8011`.

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_connect_defaults.py
```

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /api/v1/integrations`
- `GET /api/v1/integrations`
- `GET /api/v1/integrations/{integration_id}`
- `PATCH /api/v1/integrations/{integration_id}`
- `DELETE /api/v1/integrations/{integration_id}`
- `POST /api/v1/connectors`
- `GET /api/v1/connectors`
- `GET /api/v1/connectors/{connector_id}`
- `PATCH /api/v1/connectors/{connector_id}`
- `DELETE /api/v1/connectors/{connector_id}`
- `POST /api/v1/webhooks`
- `GET /api/v1/webhooks`
- `GET /api/v1/webhooks/{webhook_id}`
- `PATCH /api/v1/webhooks/{webhook_id}`
- `DELETE /api/v1/webhooks/{webhook_id}`
- `GET /api/v1/webhook-deliveries`
- `GET /api/v1/webhook-deliveries/{delivery_id}`
- `POST /api/v1/event-subscriptions`
- `GET /api/v1/event-subscriptions`
- `PATCH /api/v1/event-subscriptions/{subscription_id}`
- `DELETE /api/v1/event-subscriptions/{subscription_id}`
- `POST /api/v1/sync-jobs`
- `GET /api/v1/sync-jobs`
- `GET /api/v1/sync-jobs/{job_id}`
- `PATCH /api/v1/sync-jobs/{job_id}`
- `POST /api/v1/api-connections`
- `GET /api/v1/api-connections`
- `GET /api/v1/api-connections/{connection_id}`
- `PATCH /api/v1/api-connections/{connection_id}`
- `DELETE /api/v1/api-connections/{connection_id}`

## Future Roadmap

Later tiers may add event bus integration, realtime streaming, async delivery workers, retry queues, real external connectors, OAuth flows, AI integration recommendations, sync anomaly detection, and connector mapping suggestions.
