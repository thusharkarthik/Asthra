# Asthra Insights Service

Asthra Insights is the analytics and reporting layer for Asthra. It stores dashboards, KPI definitions, metric snapshots, reports, report runs, insight events, and usage metrics.

## Analytics Model

The MVP captures analytics-ready records without cross-service aggregation:

- `Dashboard` and `DashboardWidget` store dashboard configuration.
- `MetricDefinition` defines metric keys, names, units, and source services.
- `MetricSnapshot` stores point-in-time metric values.
- `Report` and `ReportRun` store report configuration and run history.
- `InsightEvent` stores operational insight signals.
- `UsageMetric` stores service usage measurements.

## Local Run

```bash
cd services/insights-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

With Docker Compose:

```bash
docker compose up --build insights-service
```

The service is published at `http://localhost:8013`.

## Tests

```bash
cd services/insights-service
pytest tests
```

## Future AI Roadmap

Future tiers may add AI trend analysis, forecasting, project health insights, anomaly detection, and executive summaries. The MVP does not call `ai-service`.
