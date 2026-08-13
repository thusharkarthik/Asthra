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

- Dashboard cards now show Total Ideas, Reviewing, Validating, Approved, Rejected, and Converted to Work.
- Dashboard sections cover Recent Ideas, High Impact Ideas, Ideas Needing Validation, Roadmap Preview, and Product Signals.
- Ideas list supports search, status filter, impact filter, and project filter.
- Ideas now support `captured`, `reviewing`, `validating`, `approved`, `rejected`, and `converted_to_work` statuses.
- Idea records capture problem, target user, business value, impact score, confidence score, and effort score.
- Idea detail includes edit actions and lifecycle actions for approve, reject, and convert to Flow placeholder.
- Idea detail includes a Create Flow Work Item action that shows a reviewable draft payload before marking the idea converted.
- Idea detail is organized around Overview, Problem, Target Users, Scores, Validation Notes, Decision, Roadmap Links, and Linked Flow Work placeholder.
- Validation shows ideas needing evidence with confidence, impact, decision status, and validation/business context.
- Roadmap is grouped into Now, Next, and Later and shows approved ideas as planning candidates inside those buckets.
- Roadmap candidate movement is client-side only for now; persisted bucket changes need a backend roadmap promotion/update flow.
- Discover breadcrumbs and contextual back links were added to dashboard, ideas, validation, roadmap, and detail screens.
- Backend endpoints now support idea approval, rejection, and conversion marking.
- Existing databases are upgraded safely at service startup for the new scoring and business value columns.
- The frontend uses typed API helpers for idea update and lifecycle actions through the gateway.

## Routes

- `/discover`
- `/discover/ideas`
- `/discover/ideas/[id]`
- `/discover/validation`
- `/discover/roadmap`
- `/discover/feature-requests`
- `/discover/feedback`
- `/discover/prioritization`

## CRUD Status

- Create idea: available from Discover headers and Ideas.
- List/search/filter ideas: available on Ideas.
- Read idea detail: available on Idea Detail.
- Edit idea: available on Idea Detail.
- Approve/reject idea: available on Idea Detail.
- Convert to Flow: marks the idea as converted; actual Flow work item creation remains a placeholder.

## Cross-Module Readiness

Discover now exposes the future execution handoff clearly:

- `Generate Specification` creates a real Docs page and stores the related Docs pointer.
- `Create Epic` creates a real Flow work item and stores the related Flow pointer.
- `Convert Idea` opens a manual four-step wizard: Create Documentation, Create Flow Structure, Review, Execute.
- Creating an Epic updates the idea status to `converted_to_work`.
- Idea detail shows Related Documents, Related Work Items, Related Roadmap Items, and Linked Flow Work placeholder sections.
- `/discover/delivery` shows the persisted execution pipeline: Ideas -> Specifications -> Epics -> Stories -> Tasks -> Completed.
- Roadmap cards expose Idea Count, Document Count, Work Item Count, and Completion % placeholders.
- Generic lifecycle relationships can now be persisted through Discover relationship endpoints.
- Persisted Flow epic creation is available from Idea detail.

## Lifecycle Model

Discover is now organized around:

Idea
-> Documentation
-> Execution
-> Sprint
-> Release

The current implementation makes the lifecycle visible and testable in the UI. Relationship storage is available through concrete link tables and the generic lifecycle relationship model. Document and work creation is user-confirmed and persisted.

## RBAC Readiness

Discover actions are structured around permission-ready operations:

- `discover.idea.view`
- `discover.idea.create`
- `discover.idea.edit`
- `discover.idea.manage`

Full enforcement depends on the shared permission helper being adopted across module pages.

## Flow Integration

Create Epic calls Flow with a mapped title, description, project, and Discover source link. Flow stores the Discover idea through its linked resources endpoint.

## Remaining Gaps

- Impact scoring is manually captured; automated scoring can come later.
- Validation notes currently use linked feedback where available; a dedicated validation note UI should be added later.
- Roadmap links can come from `idea_id` roadmap items or generic lifecycle relationships.
- AI suggestions are lightweight UI prompts; richer AI workflows can build on existing backend AI endpoints.
- Search-based pickers and deeper sprint/release automation remain future work.
