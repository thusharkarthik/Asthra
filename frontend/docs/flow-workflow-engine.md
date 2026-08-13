# Flow Workflow Engine

## Overview

Flow now supports configurable project workflows instead of relying only on the original Todo/In Progress/Review/Done assumptions.

## Workflow Model

Workflow:

- `project_id`
- `workspace_id`
- `name`
- `description`
- `is_default`

Workflow Status:

- `workflow_id`
- `name`
- `key`
- `category`
- `sort_order`

Supported categories:

- `backlog`
- `active`
- `review`
- `completed`

Workflow Transition:

- `workflow_id`
- `from_status_id`
- `to_status_id`

## Default Workflow

Projects without an assigned workflow automatically receive an Engineering workflow:

- Todo
- In Progress
- Review
- Done

Allowed transitions:

- Todo -> In Progress
- In Progress -> Review
- Review -> Done
- Done -> Todo

The final transition is the MVP reopen path.

## Built-In Templates

Available templates:

- Engineering Workflow
- Product Workflow
- Support Workflow

Templates can be created from Flow workflow settings and then assigned to the selected project.

## Frontend Experience

Route:

```text
/flow/settings/workflows
```

Users can:

- Create workflows.
- Create workflows from templates.
- Add statuses.
- Add transitions.
- Assign a workflow to the selected project.

## Board Integration

Boards now render columns from the selected project's workflow statuses.

If a project workflow uses:

- Backlog
- Ready
- Development
- QA
- Done

the board renders those columns instead of the original hardcoded columns.

## Work Item Detail Integration

The status dropdown on a work item detail page shows:

- Current status.
- Statuses reachable through configured transitions.

Invalid moves are blocked by the backend.

## Reports

Flow reports now count statuses dynamically from the selected project workflow.

Completion rate uses statuses in the `completed` category.

Active/review counts use statuses in `active` and `review` categories.

## Migration Notes

Flow keeps the existing work item `status_id` field. Workflow statuses are stored through the existing status table with workflow metadata, so existing work items do not need a new status column.

Existing local SQLite databases get lightweight startup column additions for:

- `workflow_id`
- `key`

New workflow and transition tables are created through SQLAlchemy metadata on startup.

## Remaining Gaps

- No drag-and-drop workflow editor yet.
- No transition delete UI yet.
- No status delete/archive UI beyond status update support.
- Existing local SQLite unique constraints may need a volume reset if old status-table constraints conflict with multiple workflows.
