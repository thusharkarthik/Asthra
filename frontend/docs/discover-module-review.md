# Discover Module Review

## Before State

Discover had working MVP endpoints and basic pages, but the frontend still felt like a data table surface:

- The dashboard only showed recent ideas and roadmap items.
- Empty states did not explain the discovery workflow.
- Feature requests, feedback, validation, and prioritization did not have dedicated product surfaces.
- Idea detail pages did not clearly separate problem, users, validation, MVP planning, roadmap fit, and AI analysis.
- Roadmap items were grouped by raw status rather than product planning buckets.

## After State

Discover now behaves like a product discovery and innovation planning workspace:

- Dashboard cards show Total Ideas, Feature Requests, Validated Ideas, Roadmap Items, and High Impact Ideas.
- Dashboard sections include Recent Ideas, Ideas Needing Validation, Top Prioritized Ideas, Roadmap Preview, and AI Discovery Suggestions.
- Guided empty states explain missing organization, workspace, ideas, feature requests, and roadmap setup.
- Primary actions are visible for Create Idea, Add Feature Request, Add Feedback, Create Roadmap Item, and AI idea analysis.
- Discover sub-navigation covers Dashboard, Ideas, Feature Requests, Feedback, Roadmap, Validation, and Prioritization.
- Ideas include search plus status and project filters.
- Idea detail pages now show Overview, Problem Statement, Target Users, Validation Notes, Impact Score, MVP Plan, Roadmap Links, AI Analysis, and future Linked Work Items.
- Roadmap is grouped into Now, Next, and Later.

## Operational Foundation

This pass made the product discovery lifecycle testable end to end:

- Ideas now support `captured`, `reviewing`, `validating`, `approved`, `rejected`, and `converted_to_work` statuses.
- Idea records capture problem, target user, business value, impact score, confidence score, and effort score.
- Idea detail includes edit actions and lifecycle actions for approve, reject, and convert to Flow placeholder.
- Discover breadcrumbs and contextual back links were added to the dashboard, ideas list, and idea detail.
- Backend endpoints now support idea approval, rejection, and conversion marking.
- Existing databases are upgraded safely at service startup for the new scoring and business value columns.
- The frontend uses typed API helpers for idea update and lifecycle actions through the gateway.

## RBAC Readiness

Discover actions are structured around permission-ready operations:

- `discover.idea.view`
- `discover.idea.create`
- `discover.idea.edit`
- `discover.idea.manage`

Full enforcement depends on the shared permission helper being adopted across module pages.

## Flow Integration Placeholder

The Convert to Flow action marks an idea as `converted_to_work` today. It does not create a Flow work item yet. The next integration step is to call Flow with a mapped title, description, project, and discovery link once cross-module reference creation is finalized.

## Remaining Gaps

- Impact scoring is manually captured; automated scoring can come later.
- Validation notes currently use linked feedback where available; a dedicated validation note UI should be added later.
- Roadmap links depend on backend `idea_id` relationships being populated.
- AI suggestions are lightweight UI prompts; richer AI workflows can build on existing backend AI endpoints.
- Cross-module links to Flow, Docs, Desk, and Pulse are placeholders until platform references are persisted.
