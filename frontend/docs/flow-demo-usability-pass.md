# Flow Demo + Usability Pass

## Seed Data

Flow now has a richer local seed script:

```bash
cd services/flow-service
FLOW_DEMO_WORKSPACE_ID=2 FLOW_DEMO_PROJECT_ID=3 python3 scripts/seed_flow_defaults.py
```

It creates or updates:

- Flow Demo Workflow with Todo, In Progress, Review, and Done statuses.
- Work item types and priorities.
- Initiative, feature, work item, bug, and subtask hierarchy examples.
- Labels, comments, dependencies, links, attachment metadata, custom fields, sprint, release, saved view, capacity, and audit examples.

The default workspace/project IDs match the local demo path used by the frontend, but they can be overridden with environment variables.

## Metadata Cleanup

Flow UI now prefers workflow status names where project workflow data is available. This reduces raw numeric status output across:

- Flow dashboard.
- Work items table.
- Board cards.
- Work item detail.
- Hierarchy.
- Roadmap.
- Sprint detail.
- Release detail.
- Search results.

Backend audit events for status and priority changes now store readable names such as `Todo -> In Progress` and `Medium -> High` instead of only numeric IDs.

## Create/Edit UX

Create Work Item keeps title-only creation fast while advanced inputs are split into sections:

- Basics.
- Planning.
- Ownership.
- Advanced.
- Custom Fields.

The modal keeps the 85vh maximum height, an internally scrolling body, and sticky save/cancel actions. Custom fields are loaded for the selected project and required custom fields block submission.

## Board Usability

The board now includes:

- Sprint filter.
- Release filter.
- Priority filter.
- Assignee filter.
- Column counts.
- Quick move buttons for valid next workflow statuses.
- Existing status dropdown movement.

Board status changes continue to use the Flow update endpoint, so audit, notification, and automation hooks remain on the same path.

## E2E Foundation

A Playwright-ready template lives at:

```text
frontend/e2e/flow-demo.spec.ts.example
```

The frontend package does not currently install `@playwright/test`, so the file is intentionally an example and is not compiled by the normal frontend build.

To enable later:

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
mv e2e/flow-demo.spec.ts.example e2e/flow-demo.spec.ts
npx playwright test e2e/flow-demo.spec.ts
```

The template covers create work item, edit work item, move status, add comment, create sprint, and save a search view.

## Manual Test Steps

1. Start the platform with Docker Compose.
2. Register/login in the frontend.
3. Select or create organization, workspace, and project context.
4. Run the Flow seed script for the selected project.
5. Open `/flow` and confirm the project looks populated.
6. Open `/flow/work-items` and create a title-only item.
7. Reopen Create Work Item and test Planning, Ownership, Advanced, and Custom Fields sections.
8. Open `/flow/boards`, filter by priority/assignee/release/sprint, then move a card.
9. Open a work item detail page and add a comment.
10. Open `/flow/search`, apply filters, and save a view.

## Remaining Gaps

- Playwright is not installed in the frontend package yet.
- Priority/type metadata still uses local constants where backend lookup APIs are not exposed.
- Board drag-and-drop is still deferred.
- Cross-module link creation is still manual ID/title entry.
