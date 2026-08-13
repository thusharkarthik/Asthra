# Asthra Insights Service

Asthra Insights is the analytics and reporting layer for dashboards, KPIs, metrics, project health, team workload, SLA metrics, usage analytics, and AI-ready operational insight records.

This MVP stores analytics metadata only. It does not aggregate across services, call AI, run forecasts, or generate reports asynchronously.

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

Docker Compose publishes this service on `http://localhost:8013`.

## Tests

```bash
pytest tests
```

## Seed

```bash
python scripts/seed_insights_defaults.py
```

## Endpoint Groups

- Dashboards: `/api/v1/dashboards`
- Widgets: `/api/v1/dashboards/{dashboard_id}/widgets`, `/api/v1/widgets/{widget_id}`
- Metric definitions: `/api/v1/metrics/definitions`
- Metric snapshots: `/api/v1/metrics/snapshots`
- Reports: `/api/v1/reports`
- Report runs: `/api/v1/reports/{report_id}/runs`
- Insight events: `/api/v1/insight-events`
- Usage metrics: `/api/v1/usage-metrics`

## Future Roadmap

Later tiers may add cross-service aggregation, AI trend analysis, forecasting, project health insights, anomaly detection, and executive summaries.
