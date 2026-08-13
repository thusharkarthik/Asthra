# Flow Advanced Work Items

## Purpose

Flow work items now support richer execution planning while keeping the basic create flow lightweight. Users can still create a work item with only a title, then add planning detail as the work becomes clearer.

## Asthra Terminology

- Parent Work: a larger work item that contains or frames this item.
- Initiative: future grouping concept for larger product or delivery efforts.
- Effort: size and optional numeric score for planning.
- Acceptance Criteria: conditions that make the work acceptable.
- Completion Checklist: definition of done or checklist-style completion notes.
- Related Work: placeholder area for future dependencies and cross-module links.

## Fields

Core:
- title
- description
- status
- priority
- assignee
- reporter
- due date

Planning:
- effort size: `XS`, `S`, `M`, `L`, `XL`
- effort score: positive integer
- business value: `low`, `medium`, `high`, `critical`
- risk level: `low`, `medium`, `high`
- complexity: `low`, `medium`, `high`

Acceptance:
- acceptance criteria
- completion checklist

Relationships:
- parent work
- blocks / blocked by placeholder
- related work placeholder

Knowledge:
- linked docs placeholder
- linked tickets placeholder
- linked incidents placeholder
- linked discover items placeholder

## UI Behavior

Create Work Item keeps title required and all advanced fields optional. Advanced fields live behind a collapsible section so the form stays approachable.

The detail page organizes fields into Overview, Execution, Planning, Acceptance, Relationships, Knowledge Links, Comments, and Activity. Edit mode supports all advanced fields.

Board cards now show effort, assignee, due date, and a high-risk badge. Status movement remains a dropdown-based action.

Backlog shows planning context and lightweight grooming actions for priority, effort, and status movement.

Reports include status, priority, effort, high-risk, and overdue summaries.

## Migration / Reset Note

Flow uses SQLite `create_all` for local development. The service includes a startup compatibility step that adds the new nullable work item columns to existing SQLite databases. For unexpected local schema drift, reset only the Flow data volume:

```bash
docker compose down
docker volume rm asthra_flow_service_data
docker compose up --build flow-service api-gateway frontend
```

This deletes local Flow data.

## Remaining Gaps

- Sprints are not implemented yet.
- Dependency graph persistence is not implemented yet.
- Linked docs/tickets/incidents/discover items are placeholders.
- Custom fields are not implemented yet.
- Workflow customization is not implemented yet.
- AI estimation is not implemented yet.
