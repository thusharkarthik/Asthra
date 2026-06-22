# Dashboard Read Models

## Purpose

Asthra dashboards should not calculate summary cards by loading every list in a module. Dashboard read models store lightweight counts that can be refreshed synchronously today and moved to event-driven updates later.

## Summary Tables

Core:
- `workspace_summary`
- `project_summary`

Flow:
- `flow_dashboard_summary`

Docs:
- `docs_dashboard_summary`

Discover:
- `discover_dashboard_summary`

Desk:
- `desk_dashboard_summary`

Pulse:
- `pulse_dashboard_summary`

## Endpoint Pattern

Module dashboards use summary endpoints through the API Gateway:

- Flow: `GET /api/flow/api/v1/dashboard/summary?project_id=...`
- Docs: `GET /api/docs/api/v1/dashboard/summary?workspace_id=...`
- Discover: `GET /api/discover/api/v1/dashboard/summary?workspace_id=...`
- Desk: `GET /api/desk/api/v1/dashboard/summary?workspace_id=...`
- Pulse: `GET /api/pulse/api/v1/dashboard/summary?workspace_id=...`

Core exposes scoped summaries:

- `GET /api/core/api/v1/dashboard/workspace-summary?organization_id=...`
- `GET /api/core/api/v1/dashboard/project-summary?workspace_id=...`

## Frontend Query Keys

Dashboard summary data uses dedicated TanStack Query keys:

- `queryKeys.flow.dashboardSummary(projectId)`
- `queryKeys.docs.dashboardSummary(workspaceId)`
- `queryKeys.discover.dashboardSummary(workspaceId)`
- `queryKeys.desk.dashboardSummary(workspaceId)`
- `queryKeys.pulse.dashboardSummary(workspaceId)`

Dashboards should prefer summary queries for cards and use list queries for detailed sections only.

## Refresh Behavior

Current implementation uses synchronous refresh-on-read for summary endpoints. The endpoint refreshes the summary row from source tables, stores it, and returns the persisted row.

After create/update/delete mutations, the frontend invalidates:

- the affected list query
- the affected dashboard summary query

This keeps dashboard cards current without forcing every dashboard render to fetch multiple entity lists.

## Future Direction

The next architecture step is event-driven summary refresh:

- Entity mutation emits a domain event.
- A summary updater consumes the event.
- Summary rows are updated without refresh-on-read.
- Frontend continues using the same summary endpoints and query keys.

This preserves the API contract while improving write/read separation.
