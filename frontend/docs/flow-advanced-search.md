# Flow Advanced Search

## Purpose

Flow advanced search gives teams a project-scoped way to find work items, combine filters, and save reusable views.

## Search Behavior

The backend endpoint is:

```text
GET /api/v1/work-items/search
```

The frontend calls it through the API Gateway:

```text
/api/flow/api/v1/work-items/search
```

The `text` filter searches work item titles, descriptions, and comments where comment data is available.

## Filters

Supported filters include:

- Text, title, and description
- Status and priority by name or ID
- Assignee and reporter
- Effort size, business value, risk level, and complexity
- Sprint, release, parent, and hierarchy level
- Created, updated, and due date ranges

Sorting supports:

- Created date
- Updated date
- Priority
- Due date

Results are paginated with `page` and `page_size`.

## Saved Views

Saved views persist a filter set for a workspace and project.

Examples:

- My Active Work
- High Risk Items
- Sprint 5
- Release 1.0

Users can save the current filter, load a saved view, or delete a view from `/flow/search`.

## Dashboard Quick Links

The Flow dashboard includes shortcuts for:

- My Active Work
- High Priority
- Overdue
- Current Sprint

These open `/flow/search` with starter filters.

## Current Gaps

- Current Sprint uses a lightweight placeholder until sprint context is selected globally.
- Status and priority display still uses IDs in some places until metadata lookup is expanded.
- Saved views are project-scoped and do not yet support sharing or ownership.
