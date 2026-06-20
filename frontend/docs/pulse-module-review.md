# Pulse Module Review

## Workflow

Pulse now supports the core incident management workflow from the UI:

- Create incidents with title, description, severity, status, impacted service, commander, and workspace context.
- Search and filter incidents by status and severity.
- Open incident detail pages with breadcrumbs, overview metadata, status/severity controls, commander assignment, timeline updates, and postmortem visibility.
- Edit impacted service from incident detail and view linked resource placeholders for future Flow/Docs/Desk relationships.
- Resolve or close incidents from the detail page.
- View service health foundations and operational reports.

## Routes

- `/pulse`
- `/pulse/incidents`
- `/pulse/incidents/[id]`
- `/pulse/services`
- `/pulse/status-pages`
- `/pulse/alerts`
- `/pulse/on-call`
- `/pulse/escalations`
- `/pulse/postmortems`
- `/pulse/reports`

## CRUD Status

- Incidents: create, list, detail, update status/severity/service/commander, resolve, close.
- Incident timeline: create and list updates.
- Alerts/status pages/on-call/escalations/postmortems: list/detail foundations from existing APIs.

## RBAC Readiness

Pulse UI should eventually use:

- `pulse.incident.view`
- `pulse.incident.create`
- `pulse.incident.manage`
- `pulse.service.manage`

Permission-aware hiding can be added once module permissions are consistently available in frontend context.

## Cross-Module Placeholders

Incident detail is ready for future links to Flow work items, Docs runbooks, and Desk tickets. Those relationship APIs are not wired in this pass.

## Remaining Gaps

- Services are backed by status page records until a dedicated service model is introduced.
- Incident commander selection is ID-based until workspace member lookup is exposed.
- Reports are count-based and should later include MTTA, MTTR, and service reliability trends.
