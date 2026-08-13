# Insights Service Context

## Purpose

Reporting and Analytics.

## Owned Data

- Dashboards
- Reports
- KPIs
- Metric definitions
- Metric snapshots

## Not Owned Data

- Source operational records
- Users
- Service-specific business entities

## APIs

- Dashboard CRUD
- Report CRUD
- Metric definitions
- Metric snapshots
- Usage metrics

## Events Published

- ReportCreated
- ReportGenerated
- DashboardUpdated

## Events Consumed

- Future platform events
- Future metric capture events

## RBAC Rules

- Use Insights permission codes such as `insights.report.view`.
- Reports must respect source module scope and permissions.

## UI Screens

- Insights Dashboard
- Dashboards
- Reports
- Metrics
- Usage

## Future Roadmap

- Executive Dashboards
- Forecasting
- Trend Analysis
