# Naming Conventions

## Services

Services use the `*-service` naming pattern.

Examples:

- `core-service`
- `flow-service`
- `docs-service`

## Events

Events use past tense naming.

Examples:

- WorkItemCreated
- ReleaseCompleted
- PagePublished
- IncidentResolved

## Permissions

Permissions use:

```text
module.resource.action
```

Examples:

- `flow.workitem.create`
- `flow.workitem.edit`
- `docs.page.edit`
- `discover.idea.manage`

## Routes

Module routes should use stable nouns and resource identifiers.

Examples:

- `/flow/work-items`
- `/docs/pages`
- `/discover/ideas`

## Files

Frontend modules should use clear feature-oriented names. Backend files should follow the service's established FastAPI and SQLAlchemy conventions.
