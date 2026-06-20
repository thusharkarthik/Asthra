# Desk Module Review

## Workflow

Desk now supports the core support workflow from the UI:

- Create tickets with requester, category, priority, queue, workspace, and project context.
- List tickets with search and filters for status, priority, category, queue, and assignment.
- Open ticket detail pages with breadcrumbs, back navigation, status changes, assignment, queue routing, comments, SLA context, approvals, and linked incident visibility.
- Edit ticket title, description, status, priority, category, assignee, and queue from the detail page.
- Review basic activity timestamps and linked resource placeholders from ticket detail.
- View queues, SLAs, approvals, incidents, change requests, and ticket reports.

## Routes

- `/desk`
- `/desk/tickets`
- `/desk/tickets/[id]`
- `/desk/queues`
- `/desk/slas`
- `/desk/approvals`
- `/desk/incidents`
- `/desk/change-requests`
- `/desk/reports`

## CRUD Status

- Tickets: create, list, detail, edit, update status/priority/category, assign, route, resolve, close, comment.
- Queues: create and list.
- SLAs: create and list.
- Approvals/change requests/incidents: operational list/detail foundations.

## RBAC Readiness

Desk UI should eventually use:

- `desk.ticket.view`
- `desk.ticket.create`
- `desk.ticket.edit`
- `desk.ticket.manage`

Permission-aware hiding is ready to be layered in once module-scoped permissions are consistently available.

## Cross-Module Placeholders

Ticket detail includes future link space for Flow work items, Docs pages, and Pulse incidents. Pulse incident links are displayed when Desk incident records reference the ticket.

## Remaining Gaps

- Member lookup still falls back to user IDs where profile APIs are not available.
- Success/error feedback is currently inline on detail pages; a global toast system can replace it later.
- SLA risk is inferred from priority until queue/SLA matching is persisted.
- Ticket reports are count-based and should later include SLA timing and trend charts.
