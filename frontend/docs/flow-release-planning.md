# Flow Release Planning

## Release Lifecycle

Flow releases are project-scoped delivery milestones.

Statuses:

- `planned`: release is being defined.
- `active`: work is being executed toward the release.
- `released`: release has shipped and records an actual release date.
- `cancelled`: release was stopped before shipping.

Release metrics are calculated from assigned work items:

- Work item count
- Completed work count
- Completion percentage

## Sprint To Release Flow

Sprints answer: "What are we working on now?"

Releases answer: "What delivery milestone is this work contributing to?"

A work item can sit in:

- backlog
- a sprint
- a release

Sprint assignment and release assignment are independent so teams can plan delivery timelines without changing sprint execution.

## Roadmap Model

The roadmap page is intentionally lightweight:

- Initiatives come from work items marked as `initiative`.
- Features come from work items marked as `feature`.
- Releases provide the timeline and target dates.
- Assigned work appears under the relevant release.

This is not a Gantt chart or portfolio forecasting system yet.

## Current UI

Users can:

- Create releases from `/flow/releases`
- Activate planned releases
- Mark active releases as released
- View release detail pages
- Assign or remove a release from a work item detail page
- View a roadmap timeline from `/flow/roadmap`

## Remaining Gaps

- Release assignment is manual.
- Release risk is calculated from simple blocked/high-risk work item fields.
- Roadmap hierarchy is lightweight and should later use stronger product planning metadata.
- No portfolio forecasting, dependency forecasting, or AI release summaries are included in this pass.
