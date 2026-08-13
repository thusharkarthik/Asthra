# Flow Capacity And Time Tracking

## Estimates

Work items now support:

- `original_estimate_minutes`
- `remaining_estimate_minutes`

These fields sit alongside existing planning fields such as `effort_score` and `effort_size`.

Users can update estimates from the work item detail edit form.

## Work Logs

Work logs capture actual time spent against a work item.

Fields:

- Work item
- User ID, optional
- Description, optional
- Time spent in minutes
- Logged timestamp

Current endpoints:

- `POST /api/v1/work-items/{work_item_id}/work-logs`
- `GET /api/v1/work-items/{work_item_id}/work-logs`
- `DELETE /api/v1/work-items/{work_item_id}/work-logs/{work_log_id}`

The frontend displays:

- Original estimate
- Remaining estimate
- Total logged time
- Add work log form
- Work log history

## Capacity Planning

Capacity entries are project-scoped and can optionally be scoped to a sprint, user, or team.

Fields:

- Project ID
- User ID, optional
- Team ID, optional
- Sprint ID, optional
- Capacity minutes
- Notes

Current endpoints:

- `POST /api/v1/capacity`
- `GET /api/v1/capacity`
- `PATCH /api/v1/capacity/{capacity_id}`
- `DELETE /api/v1/capacity/{capacity_id}`

## Capacity Page

The `/flow/capacity` page shows:

- Sprint selector
- Capacity entries
- Assigned effort
- Remaining estimate
- Over-capacity indicator
- Workload table

Member and team lookup is intentionally manual for now. User and team IDs are displayed until Core-backed member lookup is wired into Flow.

## Reports And Dashboard

Flow dashboard now includes:

- Planned effort
- Logged time
- Remaining estimate

Flow reports now include:

- Capacity summary
- Estimate vs actual
- Remaining estimate
- Over-capacity items

Sprint detail pages show:

- Sprint capacity
- Sprint estimate
- Sprint logged time

## Remaining Gaps

- Capacity does not yet pull real member calendars or PTO.
- Team labels are manual IDs.
- Logged-time aggregation is frontend-side for loaded work items.
- No forecasting or AI planning is included.
