# Flow Sprint Planning

## Purpose

Flow now supports lightweight sprint planning and execution. Teams can create sprints, assign backlog work, start an active sprint, complete it, and review simple progress metrics.

## Sprint Lifecycle

Sprint statuses:

- `planned`
- `active`
- `completed`
- `cancelled`

Lifecycle actions:

- Create sprint from `/flow/sprints`
- Assign backlog work to a sprint
- Start a planned sprint
- Complete an active sprint

Only one active sprint is expected in normal use, but the current MVP does not enforce that globally yet.

## Backlog Planning

The backlog page includes sprint assignment controls. Work items can remain in the backlog with no `sprint_id`, or they can be assigned to a planned or active sprint.

Backlog rows show:

- effort
- priority
- business value
- risk
- parent work
- sprint assignment

## Sprint Metrics

Sprint read responses include:

- `planned_work_count`
- `completed_work_count`
- `total_effort`

Sprint detail shows:

- progress percentage
- completed work
- remaining work
- total effort
- blocked work for active sprints
- high risk work for active sprints

## Board Integration

The board supports sprint filtering:

- all project work
- backlog
- current sprint
- future planned sprint

Columns still come from the project workflow engine.

## Remaining Gaps

- No advanced velocity forecasting yet.
- No capacity planning yet.
- No burnup/burndown charts yet.
- Active sprint uniqueness is not enforced yet.
- Sprint planning does not yet integrate with Insights dashboards.
