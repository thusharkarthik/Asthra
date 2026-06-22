# Pulse Service Context

## Purpose

Operational Health.

## Owned Data

- Team Health
- Capacity
- Metrics
- Objectives
- Services
- Incidents

## Not Owned Data

- Users
- Desk tickets
- Flow work items
- Docs runbooks

## APIs

- Incident CRUD
- Incident updates
- Services
- Health views
- Reports

## Events Published

- IncidentCreated
- IncidentResolved
- ServiceHealthChanged
- MetricCaptured

## Events Consumed

- Future Dev deployment events
- Future Desk ticket escalation events

## RBAC Rules

- Use Pulse permission codes such as `pulse.incident.view`, `pulse.incident.manage`, and `pulse.service.manage`.
- Resolve identity, membership, and scope through Core.

## UI Screens

- Pulse Dashboard
- Incidents
- Incident Detail
- Services
- Reports

## Future Roadmap

- Predictive Risk Analysis
- Team Health Scoring
- Operational Forecasting
