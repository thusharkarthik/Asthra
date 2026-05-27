# Asthra Connect Service

Asthra Connect is the integration and connectivity service for external systems, connector metadata, webhooks, API connections, sync jobs, and event subscriptions.

## Integration Architecture

- `Integration`: workspace-scoped provider configuration such as GitHub, Slack, Jira, or a custom provider.
- `Connector`: placeholder adapter definition attached to an integration.
- `APIConnection`: API connection metadata for provider base URL and auth type.
- `EventSubscription`: subscription metadata for future event bus routing.

Connect currently stores metadata only. Real provider calls, OAuth, external sync, and webhook delivery are future work.

## Webhook Lifecycle

1. Create a webhook endpoint with a target URL.
2. Future event processing creates delivery records.
3. Delivery status is tracked as pending, success, or failed.
4. Future async workers will handle retries and response capture.

## Sync Lifecycle

1. A sync job is created for an integration.
2. The job records type, status, timestamps, and execution log.
3. Future workers will execute sync jobs against real provider APIs.

## Local Run

```bash
cd services/connect-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

With Docker Compose:

```bash
docker compose up --build connect-service
```

The service is published at `http://localhost:8011`.

## Tests

```bash
cd services/connect-service
pytest tests
```

## Future Roadmap

Future tiers may add event bus integration, realtime streaming, async delivery workers, retry queues, provider SDKs, OAuth/token handling, AI integration recommendations, AI sync anomaly detection, and AI connector mapping suggestions.
